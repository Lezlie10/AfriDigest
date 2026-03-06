import type { NextApiRequest } from 'next'

type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

type GlobalWithRateLimiter = typeof globalThis & {
  __afridigestRateLimiter?: Map<string, RateLimitEntry>
}

function store(){
  const g = globalThis as GlobalWithRateLimiter
  if(!g.__afridigestRateLimiter){
    g.__afridigestRateLimiter = new Map<string, RateLimitEntry>()
  }
  return g.__afridigestRateLimiter
}

export function getClientIp(req: NextApiRequest){
  const forwarded = req.headers['x-forwarded-for']
  if(typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim()
  if(Array.isArray(forwarded) && forwarded[0]) return forwarded[0]
  return req.socket.remoteAddress || 'unknown'
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const s = store()
  const current = s.get(key)

  if(!current || current.resetAt <= now){
    s.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterMs: 0 }
  }

  if(current.count >= limit){
    return { allowed: false, remaining: 0, retryAfterMs: current.resetAt - now }
  }

  current.count += 1
  s.set(key, current)
  return { allowed: true, remaining: Math.max(0, limit - current.count), retryAfterMs: 0 }
}

export function normalizeTransferReference(value: string){
  return String(value || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toUpperCase()
}

export function isSafeText(value: string, minLen: number, maxLen: number){
  const v = String(value || '').trim()
  return v.length >= minLen && v.length <= maxLen
}

export function isValidPhone(value: string){
  const cleaned = String(value || '').replace(/\s+/g, '')
  return /^[+0-9()-]{7,20}$/.test(cleaned)
}

export function sameOriginRequest(req: NextApiRequest){
  const host = String(req.headers.host || '').toLowerCase()
  const origin = String(req.headers.origin || '').toLowerCase()
  const referer = String(req.headers.referer || '').toLowerCase()

  if(!host) return true
  if(origin && !origin.includes(host)) return false
  if(!origin && referer && !referer.includes(host)) return false
  return true
}
