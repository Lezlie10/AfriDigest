import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { sendMail } from './mail'
import { isPostgresEnabled, queryRows } from './postgres'

type ResetRecord = {
  email: string
  codeHash: string
  expiresAt: string
  createdAt: string
}

type GlobalWithResets = typeof globalThis & {
  __afridigestResetStore?: Map<string, ResetRecord>
  __afridigestResetTableReady?: boolean
}

function resetsPath(){
  return path.join(process.cwd(), 'content', 'password-resets.json')
}

function outboxPath(){
  return path.join(process.cwd(), 'content', 'mail-outbox.json')
}

function readResets(): ResetRecord[]{
  try{
    if(!fs.existsSync(resetsPath())) return []
    const parsed = JSON.parse(fs.readFileSync(resetsPath(), 'utf-8'))
    return Array.isArray(parsed) ? parsed : []
  }catch{
    return []
  }
}

function writeResets(items: ResetRecord[]){
  try{
    fs.writeFileSync(resetsPath(), JSON.stringify(items, null, 2), 'utf-8')
  }catch{
    // Ignore file write errors in read-only production environments.
  }
}

function memoryStore(){
  const g = globalThis as GlobalWithResets
  if(!g.__afridigestResetStore) g.__afridigestResetStore = new Map<string, ResetRecord>()
  return g.__afridigestResetStore
}

async function ensureResetTable(){
  if(!isPostgresEnabled()) return
  const g = globalThis as GlobalWithResets
  if(g.__afridigestResetTableReady) return
  await queryRows(`
    CREATE TABLE IF NOT EXISTS password_resets (
      email TEXT PRIMARY KEY,
      code_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )
  `)
  g.__afridigestResetTableReady = true
}

function hashCode(code: string){
  return crypto.createHash('sha256').update(code).digest('hex')
}

export async function createResetCode(email: string){
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const record: ResetRecord = {
    email,
    codeHash: hashCode(code),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
  }

  if(isPostgresEnabled()){
    try{
      await ensureResetTable()
      await queryRows(
        `INSERT INTO password_resets (email, code_hash, expires_at, created_at)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (email) DO UPDATE SET
           code_hash = EXCLUDED.code_hash,
           expires_at = EXCLUDED.expires_at,
           created_at = EXCLUDED.created_at`,
        [record.email, record.codeHash, record.expiresAt, record.createdAt],
      )
      return code
    }catch{
      // Fallback below.
    }
  }

  const current = readResets().filter(r => r.email !== email)
  writeResets([...current, record])
  memoryStore().set(email, record)
  return code
}

export async function verifyResetCode(email: string, code: string){
  if(isPostgresEnabled()){
    try{
      await ensureResetTable()
      const rows = await queryRows(
        `SELECT code_hash, expires_at
         FROM password_resets
         WHERE email = $1
         LIMIT 1`,
        [email],
      )
      const rec = rows[0]
      if(!rec) return false
      if(new Date(rec.expires_at).getTime() < Date.now()) return false
      return String(rec.code_hash) === hashCode(code)
    }catch{
      // Fallback below.
    }
  }

  const fileRec = readResets().find(r => r.email === email)
  const memRec = memoryStore().get(email)
  const rec = fileRec || memRec
  if(!rec) return false
  if(new Date(rec.expiresAt).getTime() < Date.now()) return false
  return rec.codeHash === hashCode(code)
}

export async function consumeResetCode(email: string){
  if(isPostgresEnabled()){
    try{
      await ensureResetTable()
      await queryRows(`DELETE FROM password_resets WHERE email = $1`, [email])
      return
    }catch{
      // Fallback below.
    }
  }

  const all = readResets().filter(r => r.email !== email)
  writeResets(all)
  memoryStore().delete(email)
}

export async function sendResetEmail(email: string, code: string){
  const payload = {
    to: email,
    subject: 'AfriDigest password reset code',
    body: `Your reset code is ${code}. It expires in 15 minutes.`,
    createdAt: new Date().toISOString(),
  }

  const smtpResult = await sendMail({ to: payload.to, subject: payload.subject, text: payload.body })

  if(!smtpResult.sent){
    const reason = smtpResult.reason || 'Unknown mail error'
    throw new Error(`Reset email delivery failed: ${reason}`)
  }

  try{
    if(!fs.existsSync(outboxPath())){
      fs.writeFileSync(outboxPath(), '[]', 'utf-8')
    }
    const parsed = JSON.parse(fs.readFileSync(outboxPath(), 'utf-8'))
    const outbox = Array.isArray(parsed) ? parsed : []
    fs.writeFileSync(outboxPath(), JSON.stringify([{ ...payload, smtpSent: true }, ...outbox].slice(0, 100), null, 2), 'utf-8')
  }catch{
    // Ignore local outbox write errors in production environments.
  }
}
