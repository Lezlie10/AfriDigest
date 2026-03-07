import type { NextApiRequest, NextApiResponse } from 'next'
import { consumeResetCode, verifyResetCode } from '../../../lib/password-reset'
import { findUserByEmail, normalizeEmail, updateUserPassword } from '../../../lib/users'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try{
    const { email, code, newPassword } = req.body || {}
    if(!email || !code || !newPassword) return res.status(400).json({ error: 'email, code and newPassword are required' })
    if(String(newPassword).length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' })

    const normalized = normalizeEmail(String(email))
    const user = await findUserByEmail(normalized)
    if(!user) return res.status(400).json({ error: 'Invalid reset request' })

    const valid = await verifyResetCode(normalized, String(code))
    if(!valid) return res.status(400).json({ error: 'Invalid or expired reset code' })

    await updateUserPassword(user.id, String(newPassword))
    await consumeResetCode(normalized)
    return res.status(200).json({ success: true })
  }catch(err: any){
    return res.status(500).json({ error: err?.message || 'Reset-password request failed' })
  }
}
