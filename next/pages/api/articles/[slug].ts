import type { NextApiRequest, NextApiResponse } from 'next'
import { getArticleBySlug } from '../../../data/articles'
import { parseCookie, sessionCookieName, verifySessionToken } from '../../../lib/session'
import { findUserById } from '../../../lib/users'

async function hasPaidAccess(req: NextApiRequest){
  const cookies = parseCookie(req.headers.cookie)
  const token = cookies[sessionCookieName()]
  const session = verifySessionToken(token)
  if(!session) return false
  const user = await findUserById(session.userId)
  return Boolean(user && user.subscriptionStatus === 'active')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const { slug } = req.query as any
  if(!slug) return res.status(400).json({ error: 'Missing slug' })
  const article = await getArticleBySlug(String(slug))
  if(!article) return res.status(404).json({ error: 'Not found' })

  if(article.exclusive && !(await hasPaidAccess(req))){
    return res.status(200).json({
      data: {
        ...article,
        body: '<p>This exclusive story is for paid subscribers.</p>',
        locked: true,
      },
    })
  }

  res.status(200).json({ data: article })
}
