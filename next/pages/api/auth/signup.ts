import type { NextApiRequest, NextApiResponse } from 'next'
import { createUser, hashPassword, normalizeEmail, readUsers } from '../../../lib/users'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { fullName, email, phone, password } = req.body || {}
  if(!fullName || !email || !phone || !password){
    return res.status(400).json({ error: 'fullName, email, phone and password are required' })
  }

  if(String(password).length < 8){
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  const users = await readUsers()
  const normalizedEmail = normalizeEmail(String(email))
  if(users.some((u: any) => u.email === normalizedEmail)){
    return res.status(409).json({ error: 'Email already registered' })
  }

  const { salt, hash } = hashPassword(String(password))
  const record = await createUser({
    fullName: String(fullName),
    email: normalizedEmail,
    phone: String(phone),
    passwordHash: hash,
    passwordSalt: salt,
  })
  if(!record) return res.status(409).json({ error: 'Email already registered' })

  return res.status(201).json({ success: true, data: { id: record.id, fullName: record.fullName, email: record.email, phone: record.phone } })
}
