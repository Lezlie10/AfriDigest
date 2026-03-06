import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

type UploadBody = {
  token?: string
  fileName?: string
  dataUrl?: string
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function sanitizeBaseName(name: string){
  return name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'image'
}

function parseDataUrl(dataUrl: string){
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/)
  if(!match) return null
  const subtype = match[1] === 'jpg' ? 'jpeg' : match[1]
  const ext = subtype === 'jpeg' ? 'jpg' : subtype
  const buffer = Buffer.from(match[2], 'base64')
  return { ext, buffer }
}

function getUploadsDir(){
  return path.join(process.cwd(), 'public', 'uploads')
}

export default function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const adminToken = process.env.ADMIN_TOKEN || 'dev-admin-token'
  const body = (req.body || {}) as UploadBody

  if(body.token !== adminToken){
    return res.status(401).json({ error: 'Invalid admin token' })
  }

  if(!body.dataUrl || !body.fileName){
    return res.status(400).json({ error: 'Missing file payload' })
  }

  const parsed = parseDataUrl(String(body.dataUrl))
  if(!parsed){
    return res.status(400).json({ error: 'Unsupported image format. Use png, jpg, webp, or gif.' })
  }

  if(parsed.buffer.byteLength > MAX_IMAGE_BYTES){
    return res.status(413).json({ error: 'Image too large. Max size is 5MB.' })
  }

  const uploadsDir = getUploadsDir()
  if(!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

  const baseName = sanitizeBaseName(path.parse(String(body.fileName)).name)
  const fileName = `${Date.now()}-${baseName}.${parsed.ext}`
  const filePath = path.join(uploadsDir, fileName)

  fs.writeFileSync(filePath, parsed.buffer)

  return res.status(201).json({ data: { url: `/uploads/${fileName}` } })
}
