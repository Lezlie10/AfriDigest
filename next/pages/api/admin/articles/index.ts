import type { NextApiRequest, NextApiResponse } from 'next'
import { createCmsArticle, getCmsArticles } from '../../../../data/articles'

type ArticleInput = {
  slug: string
  title: string
  excerpt: string
  body: string
  heroImage: string
  authorId: number
  categoryIds: number[]
  tags: string[]
  exclusive?: boolean
  publishDate: string
  readingTime: number
  metaDescription: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method === 'GET'){
    const items = await getCmsArticles()
    return res.status(200).json({ data: items })
  }

  if(req.method === 'POST'){
    const adminToken = process.env.ADMIN_TOKEN || 'dev-admin-token'
    const token = req.body?.token
    if(token !== adminToken){
      return res.status(401).json({ error: 'Invalid admin token' })
    }

    const payload = req.body?.article as ArticleInput
    if(!payload?.slug || !payload?.title){
      return res.status(400).json({ error: 'Missing required fields (slug, title)' })
    }

    const current = await getCmsArticles()
    if(current.some((a:any) => a.slug === payload.slug)){
      return res.status(409).json({ error: 'Article slug already exists' })
    }

    const nextId = current.reduce((max:number, item:any) => Math.max(max, Number(item.id || 0)), 200) + 1
    const record = {
      id: nextId,
      ...payload,
      publishDate: payload.publishDate || new Date().toISOString(),
      readingTime: Number(payload.readingTime || 5),
      categoryIds: Array.isArray(payload.categoryIds) ? payload.categoryIds : [],
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      exclusive: Boolean(payload.exclusive),
    }

    const inserted = await createCmsArticle(record)
    if(!inserted) return res.status(409).json({ error: 'Article slug already exists' })
    return res.status(201).json({ data: record })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
