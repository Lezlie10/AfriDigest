import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { sendMail } from './mail'

type ResetRecord = {
  email: string
  codeHash: string
  expiresAt: string
  createdAt: string
}

function resetsPath(){
  return path.join(process.cwd(), 'content', 'password-resets.json')
}

function outboxPath(){
  return path.join(process.cwd(), 'content', 'mail-outbox.json')
}

function readResets(): ResetRecord[]{
  if(!fs.existsSync(resetsPath())) return []
  const parsed = JSON.parse(fs.readFileSync(resetsPath(), 'utf-8'))
  return Array.isArray(parsed) ? parsed : []
}

function writeResets(items: ResetRecord[]){
  fs.writeFileSync(resetsPath(), JSON.stringify(items, null, 2), 'utf-8')
}

function hashCode(code: string){
  return crypto.createHash('sha256').update(code).digest('hex')
}

export function createResetCode(email: string){
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const current = readResets().filter(r => r.email !== email)
  const record: ResetRecord = {
    email,
    codeHash: hashCode(code),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
  }
  writeResets([...current, record])
  return code
}

export function verifyResetCode(email: string, code: string){
  const all = readResets()
  const rec = all.find(r => r.email === email)
  if(!rec) return false
  if(new Date(rec.expiresAt).getTime() < Date.now()) return false
  return rec.codeHash === hashCode(code)
}

export function consumeResetCode(email: string){
  const all = readResets().filter(r => r.email !== email)
  writeResets(all)
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

  if(!fs.existsSync(outboxPath())){
    fs.writeFileSync(outboxPath(), '[]', 'utf-8')
  }
  const parsed = JSON.parse(fs.readFileSync(outboxPath(), 'utf-8'))
  const outbox = Array.isArray(parsed) ? parsed : []
  fs.writeFileSync(outboxPath(), JSON.stringify([{ ...payload, smtpSent: true }, ...outbox].slice(0, 100), null, 2), 'utf-8')
}
