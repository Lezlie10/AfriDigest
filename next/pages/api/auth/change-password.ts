import type { NextApiRequest, NextApiResponse } from 'next'
import { parseCookie, sessionCookieName, verifySessionToken } from '../../../lib/session'
import { findUserById, updateUserPassword, verifyPassword } from '../../../lib/users'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const cookies = parseCookie(req.headers.cookie)
  const token = cookies[sessionCookieName()]
  const session = verifySessionToken(token)
  if(!session) return res.status(401).json({ error: 'Not authenticated' })

  const { currentPassword, newPassword } = req.body || {}
  if(!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword are required' })
  if(String(newPassword).length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' })

  const user = await findUserById(session.userId)
  if(!user) return res.status(401).json({ error: 'Not authenticated' })

  const ok = verifyPassword(String(currentPassword), user.passwordSalt, user.passwordHash)
  if(!ok) return res.status(401).json({ error: 'Current password is incorrect' })

  await updateUserPassword(user.id, String(newPassword))
  return res.status(200).json({ success: true })
}
