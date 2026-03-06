import type { MetadataRoute } from 'next'
import { getArticles, categories, authors } from '../data/articles'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  const articleRoutes: MetadataRoute.Sitemap = (await getArticles()).map((article: any) => ({
    url: `${siteUrl}/articles/${article.slug}`,
    lastModified: new Date(article.publishDate),
    changeFrequency: 'weekly',
    priority: article.exclusive ? 0.9 : 0.7,
  }))

  const categoryRoutes: MetadataRoute.Sitemap = categories.map(category => ({
    url: `${siteUrl}/categories/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const authorRoutes: MetadataRoute.Sitemap = authors.map(author => ({
    url: `${siteUrl}/authors/${author.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...articleRoutes, ...categoryRoutes, ...authorRoutes]
}
