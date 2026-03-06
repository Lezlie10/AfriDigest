import type { NextApiRequest, NextApiResponse } from 'next'
import { createResetCode, sendResetEmail } from '../../../lib/password-reset'
import { findUserByEmail, normalizeEmail } from '../../../lib/users'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email } = req.body || {}
  if(!email) return res.status(400).json({ error: 'Email is required' })

  const normalized = normalizeEmail(String(email))
  const user = await findUserByEmail(normalized)

  // Always return success-like response to prevent user enumeration.
  if(!user) return res.status(200).json({ success: true, message: 'If the email exists, a reset code has been sent.' })

  const code = createResetCode(normalized)
  try{
    await sendResetEmail(normalized, code)
  }catch(err: any){
    return res.status(500).json({
      error: err?.message || 'Unable to send reset email. Check SMTP settings.',
    })
  }

  const response: any = { success: true, message: 'If the email exists, a reset code has been sent.' }
  if(process.env.NODE_ENV !== 'production') response.devCode = code
  return res.status(200).json(response)
}
