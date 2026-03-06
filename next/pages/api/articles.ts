import type { NextApiRequest, NextApiResponse } from 'next'
import { searchArticles } from '../../data/articles'
import { parseCookie, sessionCookieName, verifySessionToken } from '../../lib/session'
import { findUserById } from '../../lib/users'

async function hasPaidAccess(req: NextApiRequest){
  const cookies = parseCookie(req.headers.cookie)
  const token = cookies[sessionCookieName()]
  const session = verifySessionToken(token)
  if(!session) return false
  const user = await findUserById(session.userId)
  return Boolean(user && user.subscriptionStatus === 'active')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const { search, limit, category, tag, author } = req.query as any

  const lim = parseInt(String(limit || 0),10)
  const out = await searchArticles({
    search: search ? String(search) : undefined,
    category: category ? String(category) : undefined,
    tag: tag ? String(tag) : undefined,
    author: author ? String(author) : undefined,
    limit: lim > 0 ? lim : undefined,
  })

  const canReadExclusive = await hasPaidAccess(req)
  const data = out.map((article: any) => {
    if(!article?.exclusive || canReadExclusive) return article
    return {
      ...article,
      body: '<p>This exclusive story is for paid subscribers.</p>',
      locked: true,
    }
  })

  res.status(200).json({ data })
}
