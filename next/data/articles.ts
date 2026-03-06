import fs from 'fs'
import path from 'path'
import { isPostgresEnabled, queryRows } from '../lib/postgres'

export const authors = [
  { id: 1, slug: 'jane-doe', name: 'Jane Doe', bio: 'Investigative reporter focusing on climate and policy.' },
  { id: 2, slug: 'john-okafor', name: 'John Okafor', bio: 'Cultural critic and long-form features writer.' },
  { id: 3, slug: 'mary-ame', name: 'Mary Ame', bio: 'Economics correspondent covering regional markets.' }
]

export const categories = [
  { id: 1, slug: 'world', name: 'World' },
  { id: 2, slug: 'culture', name: 'Culture' },
  { id: 3, slug: 'opinion', name: 'Opinion' },
  { id: 4, slug: 'business', name: 'Business' },
  { id: 5, slug: 'sports', name: 'Sports' }
]

export const articles = [
  {
    id: 101,
    slug: 'investigating-water-security',
    title: 'Investigating Water Security Across the Sahel',
    excerpt: 'How shifting rainfall patterns and policy gaps are reshaping access to water.',
    body: '<p>Full article HTML content would go here for the demo.</p>',
    heroImage: 'https://picsum.photos/seed/water/1200/700',
    authorId: 1,
    categoryIds: [1],
    tags: ['climate','policy','investigation'],
    exclusive: true,
    publishDate: '2026-02-10T08:00:00Z',
    readingTime: 8,
    metaDescription: 'An in-depth look at water security challenges in the Sahel region.'
  },
  {
    id: 102,
    slug: 'fashion-and-identity',
    title: 'Fashion and Identity: New Voices from Lagos',
    excerpt: 'Emerging designers in Lagos blend tradition and modernity to redefine style.',
    body: '<p>Feature piece exploring contemporary fashion in Lagos.</p>',
    heroImage: 'https://picsum.photos/seed/fashion/1200/700',
    authorId: 2,
    categoryIds: [2],
    tags: ['fashion','culture','design'],
    exclusive: false,
    publishDate: '2026-02-15T10:30:00Z',
    readingTime: 6,
    metaDescription: 'Profiles of the designers influencing African fashion today.'
  },
  {
    id: 103,
    slug: 'regional-markets-rebound',
    title: 'Regional Markets Rebound: What Investors Need to Know',
    excerpt: 'A look at recent market signals and what they mean for regional investment.',
    body: '<p>Market analysis and context for investors and readers.</p>',
    heroImage: 'https://picsum.photos/seed/markets/1200/700',
    authorId: 3,
    categoryIds: [4],
    tags: ['economy','markets','analysis'],
    exclusive: true,
    publishDate: '2026-02-12T09:00:00Z',
    readingTime: 7,
    metaDescription: 'Analysis of the recent rebound in regional markets.'
  },
  {
    id: 104,
    slug: 'caf-qualifiers-race-heats-up',
    title: 'CAF Qualifiers: The Race to the Finals Heats Up',
    excerpt: 'A tactical breakdown of key African national teams and their qualification paths.',
    body: '<p>Sports desk analysis on current qualifiers, standout players, and what to watch next.</p>',
    heroImage: 'https://picsum.photos/seed/sports/1200/700',
    authorId: 2,
    categoryIds: [5],
    tags: ['sports','football','caf'],
    exclusive: false,
    publishDate: '2026-03-01T11:00:00Z',
    readingTime: 5,
    metaDescription: 'Sports analysis of CAF qualifiers and top contenders.'
  }
]

const CATEGORY_HERO_IMAGES: Record<string, string> = {
  world: '/images/categories/world.svg',
  culture: '/images/categories/culture.svg',
  opinion: '/images/categories/opinion.svg',
  business: '/images/categories/business.svg',
  sports: '/images/categories/sports.svg',
  default: '/images/categories/general.svg',
}

export function getCategoryCoverImage(slug?: string){
  if(!slug) return CATEGORY_HERO_IMAGES.default
  return CATEGORY_HERO_IMAGES[slug] || CATEGORY_HERO_IMAGES.default
}

function isPlaceholderImage(url?: string){
  if(!url) return true
  return /picsum\.photos|placehold\.|placeholder|dummyimage/i.test(url)
}

function resolveHeroImage(inputUrl: string | undefined, categorySlug?: string){
  if(inputUrl && !isPlaceholderImage(inputUrl)) return inputUrl
  if(categorySlug && CATEGORY_HERO_IMAGES[categorySlug]) return CATEGORY_HERO_IMAGES[categorySlug]
  return CATEGORY_HERO_IMAGES.default
}

type ArticleRecord = {
  id: number
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

function getCmsArticlesFilePath(){
  return path.join(process.cwd(), 'content', 'articles.json')
}

async function readCmsArticles(): Promise<ArticleRecord[]>{
  if(isPostgresEnabled()){
    try{
      const rows = await queryRows(
        `SELECT id, slug, title, excerpt, body, hero_image, author_id, category_ids, tags,
                exclusive, publish_date, reading_time, meta_description
         FROM cms_articles
         ORDER BY publish_date DESC`,
      )
      return rows.map((row: any) => ({
        id: Number(row.id),
        slug: String(row.slug || ''),
        title: String(row.title || ''),
        excerpt: String(row.excerpt || ''),
        body: String(row.body || ''),
        heroImage: String(row.hero_image || ''),
        authorId: Number(row.author_id || 0),
        categoryIds: Array.isArray(row.category_ids) ? row.category_ids.map((v: any) => Number(v)) : [],
        tags: Array.isArray(row.tags) ? row.tags.map((v: any) => String(v)) : [],
        exclusive: Boolean(row.exclusive),
        publishDate: String(row.publish_date || ''),
        readingTime: Number(row.reading_time || 0),
        metaDescription: String(row.meta_description || ''),
      }))
    }catch{
      // Fallback to file storage if DB is unavailable.
    }
  }

  try{
    const filePath = getCmsArticlesFilePath()
    if(!fs.existsSync(filePath)) return []
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  }catch{
    return []
  }
}

async function getAllRawArticles(): Promise<ArticleRecord[]>{
  const cmsArticles = await readCmsArticles()
  const merged = [...articles, ...cmsArticles] as ArticleRecord[]
  const seen = new Set<string>()
  return merged.filter(a => {
    if(!a?.slug || seen.has(a.slug)) return false
    seen.add(a.slug)
    return true
  })
}

export function enrichArticle(a: any){
  const author = authors.find(x=>x.id===a.authorId) || null
  const cats = categories.filter(c=>a.categoryIds.includes(c.id))
  const primaryCategorySlug = cats[0]?.slug
  return {
    ...a,
    heroImage: resolveHeroImage(a.heroImage, primaryCategorySlug),
    author: author ? { name: author.name, slug: author.slug } : null,
    categories: cats,
  }
}

export async function getArticles(){
  return (await getAllRawArticles()).map(enrichArticle)
}

export async function getArticleBySlug(slug: string){
  const a = (await getAllRawArticles()).find(x=>x.slug===slug)
  return a ? enrichArticle(a) : null
}

export async function getArticlesByAuthorSlug(authorSlug: string){
  const author = authors.find(x=>x.slug===authorSlug)
  if(!author) return []
  return (await getAllRawArticles()).filter(a=>a.authorId===author.id).map(enrichArticle)
}

export async function getArticlesByCategorySlug(categorySlug: string){
  const cat = categories.find(x=>x.slug===categorySlug)
  if(!cat) return []
  return (await getAllRawArticles()).filter(a=>a.categoryIds.includes(cat.id)).map(enrichArticle)
}

export function getAuthorBySlug(slug: string){
  return authors.find(x=>x.slug===slug)
}

export function getCategoryBySlug(slug: string){
  return categories.find(x=>x.slug===slug)
}

export async function getExclusiveArticles(limit = 3){
  return (await getAllRawArticles())
    .filter(a => a.exclusive)
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
    .slice(0, limit)
    .map(enrichArticle)
}

type SearchArgs = {
  search?: string
  category?: string
  tag?: string
  author?: string
  limit?: number
}

function stripHtml(input: string){
  return String(input || '').replace(/<[^>]+>/g, ' ')
}

export async function searchArticles(args: SearchArgs = {}){
  const { search, category, tag, author, limit } = args
  let out = await getArticles()

  if(search){
    const q = String(search).toLowerCase()
    out = out.filter(a => {
      const haystack = [
        a.title,
        a.excerpt || '',
        stripHtml(a.body || ''),
        a.metaDescription || '',
        (a.tags || []).join(' '),
        a.author?.name || '',
        (a.categories || []).map((c: any) => c.name).join(' '),
      ].join(' ').toLowerCase()

      return haystack.includes(q)
    })
  }

  if(category){
    out = out.filter(a => a.categories && a.categories.some((c: any) => c.slug === category))
  }

  if(tag){
    const targetTag = String(tag).toLowerCase()
    out = out.filter(a => Array.isArray(a.tags) && a.tags.some((t: string) => String(t).toLowerCase() === targetTag))
  }

  if(author){
    out = out.filter(a => a.author?.slug === author)
  }

  const lim = Number.isFinite(limit as number) ? (limit as number) : out.length
  return out.slice(0, lim)
}

export async function getCmsArticles(){
  return readCmsArticles()
}

export async function createCmsArticle(record: ArticleRecord){
  if(isPostgresEnabled()){
    try{
      await queryRows(
        `INSERT INTO cms_articles (
           id, slug, title, excerpt, body, hero_image, author_id, category_ids, tags,
           exclusive, publish_date, reading_time, meta_description
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (slug) DO NOTHING`,
        [
          record.id,
          record.slug,
          record.title,
          record.excerpt,
          record.body,
          record.heroImage,
          record.authorId,
          record.categoryIds,
          record.tags,
          Boolean(record.exclusive),
          record.publishDate,
          record.readingTime,
          record.metaDescription,
        ],
      )
      return true
    }catch{
      // Fallback to file storage if DB is unavailable.
    }
  }

  const filePath = getCmsArticlesFilePath()
  const dir = path.dirname(filePath)
  if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const current = await readCmsArticles()
  if(current.some(a => a.slug === record.slug)) return false
  fs.writeFileSync(filePath, JSON.stringify([...current, record], null, 2), 'utf-8')
  return true
}
