import crypto from 'crypto'

const COOKIE_NAME = 'afridigest_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

function secret(){
  return process.env.AUTH_SECRET || 'dev-auth-secret-change-me'
}

function sign(value: string){
  return crypto.createHmac('sha256', secret()).update(value).digest('hex')
}

export function createSessionToken(payload: { userId: number; email: string }){
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const data = `${payload.userId}|${payload.email}|${exp}`
  const signature = sign(data)
  return Buffer.from(`${data}|${signature}`).toString('base64url')
}

export function verifySessionToken(token?: string){
  if(!token) return null
  try{
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [userId, email, exp, signature] = decoded.split('|')
    if(!userId || !email || !exp || !signature) return null
    const data = `${userId}|${email}|${exp}`
    const expected = sign(data)
    const ok = crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
    if(!ok) return null
    if(Number(exp) < Math.floor(Date.now() / 1000)) return null
    return { userId: Number(userId), email }
  }catch{
    return null
  }
}

export function parseCookie(header?: string){
  if(!header) return {}
  return header.split(';').reduce((acc: Record<string,string>, part)=>{
    const [k, ...rest] = part.trim().split('=')
    if(!k) return acc
    acc[k] = decodeURIComponent(rest.join('='))
    return acc
  }, {})
}

export function sessionCookie(token: string){
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`
}

export function clearSessionCookie(){
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export function sessionCookieName(){
  return COOKIE_NAME
}
