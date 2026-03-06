import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { normalizeEmail } from '../../../lib/users'
import { readSubscriptionRequests, writeSubscriptionRequests } from '../../../lib/subscription-requests'
import type { SubscriptionRequestRecord } from '../../../lib/subscription-requests'
import { getClientIp, isSafeText, isValidPhone, normalizeTransferReference, rateLimit, sameOriginRequest } from '../../../lib/security'

const MAX_RECEIPT_BYTES = 2 * 1024 * 1024

function decodeReceiptDataUrl(dataUrl: string){
  const match = String(dataUrl || '').match(/^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+/=\r\n]+)$/i)
  if(!match) return null
  const mime = match[1].toLowerCase()
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
  const data = Buffer.from(match[3], 'base64')
  if(data.length <= 0 || data.length > MAX_RECEIPT_BYTES) return null
  return { data, ext }
}

function saveReceiptImage(dataUrl: string){
  const decoded = decodeReceiptDataUrl(dataUrl)
  if(!decoded) return null

  const receiptsDir = path.join(process.cwd(), 'public', 'uploads', 'receipts')
  if(!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true })

  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${decoded.ext}`
  const targetPath = path.join(receiptsDir, name)
  fs.writeFileSync(targetPath, decoded.data)
  return { receiptUrl: `/uploads/receipts/${name}`, receiptFileName: name }
}

export default function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  res.setHeader('Cache-Control', 'no-store')

  if(!sameOriginRequest(req)){
    return res.status(403).json({ error: 'Cross-origin request denied' })
  }

  const ip = getClientIp(req)
  const ipWindow = rateLimit(`manual-subscribe:ip:${ip}`, 20, 10 * 60 * 1000)
  if(!ipWindow.allowed){
    return res.status(429).json({ error: 'Too many requests. Try again later.' })
  }

  if(process.env.MANUAL_SUBSCRIPTION_ENABLED === 'false'){
    return res.status(400).json({ error: 'Manual subscription is disabled' })
  }

  const { fullName, email, phone, transferReference, amountNgn, receiptDataUrl } = req.body || {}
  if(!fullName || !email || !phone || !transferReference || !receiptDataUrl){
    return res.status(400).json({ error: 'fullName, email, phone, transferReference, and receipt image are required' })
  }

  if(!isSafeText(String(fullName), 2, 100)){
    return res.status(400).json({ error: 'Full name must be between 2 and 100 characters' })
  }

  if(!isValidPhone(String(phone))){
    return res.status(400).json({ error: 'Phone format is invalid' })
  }

  const normalized = normalizeEmail(String(email))
  if(!normalized.includes('@')) return res.status(400).json({ error: 'Valid email is required' })

  const emailWindow = rateLimit(`manual-subscribe:email:${normalized}`, 5, 10 * 60 * 1000)
  if(!emailWindow.allowed){
    return res.status(429).json({ error: 'Too many attempts for this email. Try again later.' })
  }

  const normalizedReference = normalizeTransferReference(String(transferReference))
  if(!isSafeText(normalizedReference, 3, 64)){
    return res.status(400).json({ error: 'Transfer reference is invalid' })
  }

  const run = async () => {
  const all = await readSubscriptionRequests()
  const existingPending = all.find(r => r.email === normalized && r.status === 'pending')
  if(existingPending){
    return res.status(409).json({ error: 'A pending payment request already exists for this email.' })
  }

  const duplicateReference = all.find(
    r => (r.transferReferenceNormalized || normalizeTransferReference(r.transferReference)) === normalizedReference,
  )
  if(duplicateReference){
    return res.status(409).json({ error: 'This transfer reference has already been submitted.' })
  }

  const receipt = saveReceiptImage(String(receiptDataUrl))
  if(!receipt){
    return res.status(400).json({ error: 'Receipt must be a PNG, JPG, or WEBP image up to 2MB.' })
  }

  const record: SubscriptionRequestRecord = {
    id: Date.now(),
    fullName: String(fullName).trim(),
    email: normalized,
    phone: String(phone).trim(),
    transferReference: String(transferReference).trim(),
    transferReferenceNormalized: normalizedReference,
    receiptUrl: receipt.receiptUrl,
    receiptFileName: receipt.receiptFileName,
    amountNgn: Number.isFinite(Number(amountNgn)) ? Number(amountNgn) : undefined,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  await writeSubscriptionRequests([record, ...all])
  return res.status(201).json({ success: true, data: record })
  }

  return void run().catch(() => {
    return res.status(500).json({ error: 'Unable to save manual subscription request' })
  })
}
