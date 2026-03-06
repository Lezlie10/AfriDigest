import type { NextApiRequest, NextApiResponse } from 'next'
import { parseCookie, sessionCookieName, verifySessionToken } from '../../../lib/session'
import { findUserById } from '../../../lib/users'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const cookies = parseCookie(req.headers.cookie)
  const token = cookies[sessionCookieName()]
  const session = verifySessionToken(token)
  if(!session) return res.status(401).json({ error: 'Not authenticated' })

  const user = await findUserById(session.userId)
  if(!user) return res.status(401).json({ error: 'Not authenticated' })

  return res.status(200).json({
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
