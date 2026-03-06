import type { NextApiRequest, NextApiResponse } from 'next'
import { createSessionToken, sessionCookie } from '../../../lib/session'
import { findUserByEmail, normalizeEmail, verifyPassword } from '../../../lib/users'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = req.body || {}
  if(!email || !password) return res.status(400).json({ error: 'email and password are required' })

  const user = await findUserByEmail(normalizeEmail(String(email)))
  if(!user) return res.status(401).json({ error: 'Invalid credentials' })

  const ok = verifyPassword(String(password), user.passwordSalt, user.passwordHash)
  if(!ok) return res.status(401).json({ error: 'Invalid credentials' })

  const token = createSessionToken({ userId: user.id, email: user.email })
  res.setHeader('Set-Cookie', sessionCookie(token))
  return res.status(200).json({
    success: true,
    data: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      subscriptionStatus: user.subscriptionStatus || 'inactive',
      subscriptionPlan: user.subscriptionPlan || null,
      subscriptionStartedAt: user.subscriptionStartedAt || null,
    },
  })
}
