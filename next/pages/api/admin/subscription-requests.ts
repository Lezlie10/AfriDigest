import type { NextApiRequest, NextApiResponse } from 'next'
import { activateManualSubscription } from '../../../lib/manual-subscriptions'
import { readSubscriptionRequests, writeSubscriptionRequests } from '../../../lib/subscription-requests'
import { parseCookie, sessionCookieName, verifySessionToken } from '../../../lib/session'
import { getClientIp, rateLimit, sameOriginRequest } from '../../../lib/security'

function isAuthorized(req: NextApiRequest){
  const adminToken = process.env.ADMIN_TOKEN || 'dev-admin-token'
  const token = String(req.body?.token || req.query?.token || '')
  const cookies = parseCookie(req.headers.cookie)
  const session = verifySessionToken(cookies[sessionCookieName()])
  if(!session) return false

  const adminEmails = String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(Boolean)
  if(adminEmails.length > 0 && !adminEmails.includes(String(session.email).toLowerCase())) return false

  return token === adminToken
}

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  res.setHeader('Cache-Control', 'no-store')
  if(!sameOriginRequest(req)) return res.status(403).json({ error: 'Cross-origin request denied' })

  const ip = getClientIp(req)
  const rl = rateLimit(`admin-subscription:ip:${ip}`, 60, 10 * 60 * 1000)
  if(!rl.allowed) return res.status(429).json({ error: 'Too many requests. Try again later.' })

  if(!isAuthorized(req)) return res.status(401).json({ error: 'Invalid admin token' })

  if(req.method === 'GET'){
    const status = String(req.query?.status || '').trim()
    const q = String(req.query?.q || '').trim().toLowerCase()
    const dateFrom = String(req.query?.dateFrom || '').trim()
    const dateTo = String(req.query?.dateTo || '').trim()
    const sort = String(req.query?.sort || 'newest').trim()

    const all = await readSubscriptionRequests()
    const data = all
      .filter(r => status ? r.status === status : true)
      .filter(r => {
        if(!q) return true
        const text = `${r.fullName} ${r.email} ${r.phone} ${r.transferReference}`.toLowerCase()
        return text.includes(q)
      })
      .filter(r => {
        if(!dateFrom) return true
        return new Date(r.createdAt).getTime() >= new Date(`${dateFrom}T00:00:00`).getTime()
      })
      .filter(r => {
        if(!dateTo) return true
        return new Date(r.createdAt).getTime() <= new Date(`${dateTo}T23:59:59`).getTime()
      })
      .sort((a, b) => {
        const av = new Date(a.createdAt).getTime()
        const bv = new Date(b.createdAt).getTime()
        return sort === 'oldest' ? av - bv : bv - av
      })

    return res.status(200).json({ data })
  }

  if(req.method === 'POST'){
    const { requestId, action, reviewNote } = req.body || {}
    if(!requestId || !action) return res.status(400).json({ error: 'requestId and action are required' })
    if(!['approve', 'reject'].includes(String(action))) return res.status(400).json({ error: 'action must be approve or reject' })

    const reviewNoteText = String(reviewNote || '').trim()
    if(action === 'approve' && reviewNoteText.length < 8){
      return res.status(400).json({ error: 'Approval requires a verification note (min 8 characters).' })
    }

    const all = await readSubscriptionRequests()
    const idx = all.findIndex(r => Number(r.id) === Number(requestId))
    if(idx < 0) return res.status(404).json({ error: 'Request not found' })

    const record = all[idx]
    if(record.status !== 'pending') return res.status(400).json({ error: 'Request already reviewed' })

    const nextStatus = action === 'approve' ? 'approved' : 'rejected'
    all[idx] = {
      ...record,
      status: nextStatus,
      reviewNote: reviewNoteText,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await writeSubscriptionRequests(all)

    if(nextStatus === 'approved'){
      await activateManualSubscription({
        email: record.email,
        fullName: record.fullName,
        phone: record.phone,
        transferReference: record.transferReference,
      })
    }

    return res.status(200).json({ success: true, data: all[idx] })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
