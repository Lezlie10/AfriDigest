import React from 'react'
import Link from 'next/link'
import ArticleListClient from '../components/ArticleListClient'
import { getArticles, getArticlesByCategorySlug, getExclusiveArticles } from '../data/articles'

type HomeArticle = {
  id: number | string
  slug: string
  title: string
  excerpt: string
  heroImage?: string
  readingTime?: number
  publishDate?: string
  exclusive?: boolean
  author?: {
    name: string
    slug?: string
  } | null
  categories?: Array<{
    name: string
    slug: string
  }>
}

function formatPublishDate(value?: string){
  if(!value) return 'Recently published'
  const parsed = new Date(value)
  if(Number.isNaN(parsed.getTime())) return 'Recently published'
  return parsed.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function Page(){
  const allArticles = (await getArticles() as HomeArticle[]).sort(
    (a, b) => new Date(b.publishDate || '').getTime() - new Date(a.publishDate || '').getTime(),
  )
  const heroStory = allArticles[0]
  const editorPicks = allArticles.slice(1, 4)
  const exclusiveArticles = await getExclusiveArticles(2)
  const spotlightSections = (await Promise.all([
    { label: 'World Desk', slug: 'world' },
    { label: 'Culture Desk', slug: 'culture' },
    { label: 'Sports Desk', slug: 'sports' },
  ].map(async section => {
    const item = (await getArticlesByCategorySlug(section.slug) as HomeArticle[])[0]
    return {
      ...section,
      item,
    }
  }))).filter(section => Boolean(section.item))

  return (
    <div>
      <section className="homepage-hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="hero-kicker">Pan-African Magazine</p>
              <h1>Deep reporting. Elegant context.</h1>
              <p className="hero-intro">Original journalism and long-form features from across Africa, curated by editors who care about depth, nuance, and impact.</p>
              <div className="hero-actions">
                <Link className="btn btn-primary" href="#latest">Read latest</Link>
                <Link className="btn btn-outline" href="/categories/sports">Explore Sports</Link>
                <Link className="btn btn-outline" href="/signup">Join Community</Link>
              </div>
              <div className="hero-signals" aria-label="Editorial highlights">
                <div className="signal-tile">
                  <span className="signal-value">Daily</span>
                  <span className="signal-label">New reports</span>
                </div>
                <div className="signal-tile">
                  <span className="signal-value">5 desks</span>
                  <span className="signal-label">Across Africa</span>
                </div>
                <div className="signal-tile">
                  <span className="signal-value">In-depth</span>
                  <span className="signal-label">Explainers</span>
                </div>
              </div>
            </div>

            {heroStory ? (
              <article className="hero-top-story">
                <p className="story-label">Top Story</p>
                <Link href={`/articles/${heroStory.slug}`}>
                  <img src={heroStory.heroImage || 'https://picsum.photos/seed/hero-top-story/900/600'} alt={heroStory.title} className="w-full rounded-lg object-cover"/>
                </Link>
                <div className="story-body">
                  <h2>
                    <Link href={`/articles/${heroStory.slug}`}>{heroStory.title}</Link>
                  </h2>
                  <p>{heroStory.excerpt}</p>
                  <div className="story-meta">
                    <span>{formatPublishDate(heroStory.publishDate)}</span>
                    <span>·</span>
                    <span>{heroStory.readingTime || 6} min read</span>
                  </div>
                </div>
              </article>
            ) : null}
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="section-header">
          <h2 className="text-2xl font-serif mb-0">Editor&apos;s Watch</h2>
          <Link className="btn btn-outline" href="/search">Browse all desks</Link>
        </div>
        <div className="editor-picks-grid">
          {editorPicks.map((article, index) => (
            <article key={article.id} className="editor-pick-card">
              <div className="pick-index">0{index + 1}</div>
              <div>
                <h3>
                  <Link href={`/articles/${article.slug}`}>{article.title}</Link>
                </h3>
                <p>{article.excerpt}</p>
                <Link className="btn btn-outline btn-sm" href={`/articles/${article.slug}`}>Read analysis</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container py-8">
        <div className="section-header">
          <h2 className="text-2xl font-serif mb-4">Exclusive Stories</h2>
          <Link className="btn btn-outline" href="#latest">View all</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {exclusiveArticles.map((article: HomeArticle) => (
            <article key={article.id} className="card">
              <Link href={`/articles/${article.slug}`}>
                <img src={article.heroImage} alt={article.title} />
              </Link>
              <div className="card-body">
                <span className="exclusive-badge">Exclusive</span>
                <h3 className="card-title mt-3">
                  <Link href={`/articles/${article.slug}`}>{article.title}</Link>
                </h3>
                <p className="card-excerpt">{article.excerpt}</p>
                <div className="mt-3 text-sm text-gray-500">By {article.author?.name} · {article.readingTime} min</div>
                <div className="mt-4">
                  <Link className="btn btn-primary" href={`/articles/${article.slug}`}>Read Exclusive</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container py-8">
        <div className="section-header">
          <h2 className="text-2xl font-serif mb-0">From the Desks</h2>
          <Link className="btn btn-outline" href="/search">Open newsroom index</Link>
        </div>
        <div className="desk-grid">
          {spotlightSections.map(section => (
            <article key={section.slug} className="desk-card">
              <p className="desk-name">{section.label}</p>
              <h3>
                <Link href={`/articles/${section.item?.slug}`}>{section.item?.title}</Link>
              </h3>
              <p>{section.item?.excerpt}</p>
              <Link className="btn btn-outline btn-sm" href={`/categories/${section.slug}`}>Go to {section.label}</Link>
            </article>
          ))}
        </div>
      </section>

      <section id="latest" className="container py-12">
        <div className="section-header">
          <h2 className="text-2xl font-serif mb-0">Latest</h2>
          <Link className="btn btn-outline" href="/subscribe">Get Weekend Briefing</Link>
        </div>
        <ArticleListClient />
      </section>
    </div>
  )
}
