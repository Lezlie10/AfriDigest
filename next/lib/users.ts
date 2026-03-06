import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { isPostgresEnabled, queryRows } from './postgres'

export type UserRecord = {
  id: number
  fullName: string
  email: string
  phone: string
  passwordHash: string
  passwordSalt: string
  createdAt: string
  subscriptionStatus?: 'inactive' | 'active'
  subscriptionPlan?: string
  subscriptionStartedAt?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}

function usersFilePath(){
  return path.join(process.cwd(), 'content', 'users.json')
}

function mapDbUser(row: any): UserRecord {
  return {
    id: Number(row.id),
    fullName: String(row.full_name || ''),
    email: String(row.email || ''),
    phone: String(row.phone || ''),
    passwordHash: String(row.password_hash || ''),
    passwordSalt: String(row.password_salt || ''),
    createdAt: String(row.created_at || ''),
    subscriptionStatus: (row.subscription_status || undefined) as UserRecord['subscriptionStatus'],
    subscriptionPlan: row.subscription_plan || undefined,
    subscriptionStartedAt: row.subscription_started_at || undefined,
    stripeCustomerId: row.stripe_customer_id || undefined,
    stripeSubscriptionId: row.stripe_subscription_id || undefined,
  }
}

export async function readUsers(): Promise<UserRecord[]>{
  if(isPostgresEnabled()){
    try{
      const rows = await queryRows(
        `SELECT id, full_name, email, phone, password_hash, password_salt, created_at,
                subscription_status, subscription_plan, subscription_started_at,
                stripe_customer_id, stripe_subscription_id
         FROM users
         ORDER BY created_at DESC`
      )
      return rows.map(mapDbUser)
    }catch{
      // Fallback to file storage if DB is unavailable.
    }
  }

  const p = usersFilePath()
  if(!fs.existsSync(p)) return []
  const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'))
  return Array.isArray(parsed) ? parsed : []
}

export async function writeUsers(items: UserRecord[]){
  if(isPostgresEnabled()){
    try{
      for(const item of items){
        await queryRows(
          `INSERT INTO users (
             id, full_name, email, phone, password_hash, password_salt, created_at,
             subscription_status, subscription_plan, subscription_started_at,
             stripe_customer_id, stripe_subscription_id
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT (id) DO UPDATE SET
             full_name = EXCLUDED.full_name,
             email = EXCLUDED.email,
             phone = EXCLUDED.phone,
             password_hash = EXCLUDED.password_hash,
             password_salt = EXCLUDED.password_salt,
             created_at = EXCLUDED.created_at,
             subscription_status = EXCLUDED.subscription_status,
             subscription_plan = EXCLUDED.subscription_plan,
             subscription_started_at = EXCLUDED.subscription_started_at,
             stripe_customer_id = EXCLUDED.stripe_customer_id,
             stripe_subscription_id = EXCLUDED.stripe_subscription_id`,
          [
            item.id,
            item.fullName,
            item.email,
            item.phone,
            item.passwordHash,
            item.passwordSalt,
            item.createdAt,
            item.subscriptionStatus || null,
            item.subscriptionPlan || null,
            item.subscriptionStartedAt || null,
            item.stripeCustomerId || null,
            item.stripeSubscriptionId || null,
          ],
        )
      }
      return
    }catch{
      // Fallback to file storage if DB is unavailable.
    }
  }

  fs.writeFileSync(usersFilePath(), JSON.stringify(items, null, 2), 'utf-8')
}

export function normalizeEmail(email: string){
  return String(email).trim().toLowerCase()
}

export function hashPassword(password: string){
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return { salt, hash }
}

export function verifyPassword(password: string, salt: string, expectedHash: string){
  const computed = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(expectedHash, 'hex'))
}

export async function findUserByEmail(email: string){
  const target = normalizeEmail(email)
  if(isPostgresEnabled()){
    try{
      const rows = await queryRows(
        `SELECT id, full_name, email, phone, password_hash, password_salt, created_at,
                subscription_status, subscription_plan, subscription_started_at,
                stripe_customer_id, stripe_subscription_id
         FROM users
         WHERE email = $1
         LIMIT 1`,
        [target],
      )
      return rows[0] ? mapDbUser(rows[0]) : undefined
    }catch{
      // Fallback to file storage if DB is unavailable.
    }
  }
  return (await readUsers()).find(u => u.email === target)
}

export async function findUserById(id: number){
  if(isPostgresEnabled()){
    try{
      const rows = await queryRows(
        `SELECT id, full_name, email, phone, password_hash, password_salt, created_at,
                subscription_status, subscription_plan, subscription_started_at,
                stripe_customer_id, stripe_subscription_id
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [Number(id)],
      )
      return rows[0] ? mapDbUser(rows[0]) : undefined
    }catch{
      // Fallback to file storage if DB is unavailable.
    }
  }
  return (await readUsers()).find(u => Number(u.id) === Number(id))
}

export async function updateUserPassword(userId: number, newPassword: string){
  const { salt, hash } = hashPassword(newPassword)
  if(isPostgresEnabled()){
    try{
      const rows = await queryRows(
        `UPDATE users
         SET password_salt = $1, password_hash = $2
         WHERE id = $3
         RETURNING id`,
        [salt, hash, Number(userId)],
      )
      return rows.length > 0
    }catch{
      // Fallback to file storage if DB is unavailable.
    }
  }

  const users = await readUsers()
  const index = users.findIndex(u => Number(u.id) === Number(userId))
  if(index < 0) return false
  users[index] = { ...users[index], passwordSalt: salt, passwordHash: hash }
  await writeUsers(users)
  return true
}

export async function updateUserSubscriptionByEmail(email: string, payload: {
  status: 'inactive' | 'active'
  plan: string
  startedAt: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}){
  const target = normalizeEmail(email)
  if(isPostgresEnabled()){
    try{
      const rows = await queryRows(
        `UPDATE users
         SET subscription_status = $1,
             subscription_plan = $2,
             subscription_started_at = $3,
             stripe_customer_id = $4,
             stripe_subscription_id = $5
         WHERE email = $6
         RETURNING id`,
        [
          payload.status,
          payload.plan,
          payload.startedAt,
          payload.stripeCustomerId || null,
          payload.stripeSubscriptionId || null,
          target,
        ],
      )
      return rows.length > 0
    }catch{
      // Fallback to file storage if DB is unavailable.
    }
  }

  const users = await readUsers()
  const index = users.findIndex(u => u.email === target)
  if(index < 0) return false
  users[index] = {
    ...users[index],
    subscriptionStatus: payload.status,
    subscriptionPlan: payload.plan,
    subscriptionStartedAt: payload.startedAt,
    stripeCustomerId: payload.stripeCustomerId,
    stripeSubscriptionId: payload.stripeSubscriptionId,
  }

  await writeUsers(users)
  return true
}

export async function createUser(input: {
  fullName: string
  email: string
  phone: string
  passwordHash: string
  passwordSalt: string
}){
  const normalizedEmail = normalizeEmail(input.email)
  const id = Date.now()
  const createdAt = new Date().toISOString()

  if(isPostgresEnabled()){
    try{
      const rows = await queryRows(
        `INSERT INTO users (
           id, full_name, email, phone, password_hash, password_salt, created_at, subscription_status
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (email) DO NOTHING
         RETURNING id, full_name, email, phone, password_hash, password_salt, created_at,
                   subscription_status, subscription_plan, subscription_started_at,
                   stripe_customer_id, stripe_subscription_id`,
        [
          id,
          String(input.fullName).trim(),
          normalizedEmail,
          String(input.phone).trim(),
          input.passwordHash,
          input.passwordSalt,
          createdAt,
          'inactive',
        ],
      )
      if(rows[0]) return mapDbUser(rows[0])
      return null
    }catch{
      // Fallback to file storage if DB is unavailable.
    }
  }

  const users = await readUsers()
  if(users.some((u) => u.email === normalizedEmail)) return null
  const record: UserRecord = {
    id,
    fullName: String(input.fullName).trim(),
    email: normalizedEmail,
    phone: String(input.phone).trim(),
    passwordHash: input.passwordHash,
    passwordSalt: input.passwordSalt,
    createdAt,
    subscriptionStatus: 'inactive',
  }
  await writeUsers([...users, record])
  return record
}
