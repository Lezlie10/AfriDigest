import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { getArticleBySlug } from '../../../data/articles'
import { findUserById } from '../../../lib/users'
import { sessionCookieName, verifySessionToken } from '../../../lib/session'

type RouteProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: RouteProps){
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if(!article) return { title: 'Article' }
  return {
    title: article.title,
    description: article.metaDescription,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      type: 'article',
      url: `/articles/${article.slug}`,
      images: [{ url: article.heroImage, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.metaDescription,
      images: [article.heroImage],
    },
  } satisfies Metadata
}

export default async function ArticlePage({ params }: RouteProps){
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if(!article) return (<div className="container py-12">Article not found.</div>)

  const cookieStore = await cookies()
  const token = cookieStore.get(sessionCookieName())?.value
  const session = verifySessionToken(token)
  const user = session ? await findUserById(session.userId) : null
  const hasPaidAccess = Boolean(user && user.subscriptionStatus === 'active')
  const isLocked = Boolean(article.exclusive && !hasPaidAccess)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': article.title,
    'image': [article.heroImage],
    'author': { '@type': 'Person', 'name': article.author?.name },
    'datePublished': article.publishDate,
    'dateModified': article.publishDate,
    'mainEntityOfPage': `/articles/${article.slug}`,
    'description': article.metaDescription
  }

  return (
    <article className="container py-12">
      <header>
        <div className="kicker">
          {article.categories?.[0]?.slug ? (
            <Link href={`/categories/${article.categories[0].slug}`}>{article.categories[0].name}</Link>
          ) : (
            article.categories?.[0]?.name
          )}
        </div>
        <h1 className="font-serif text-4xl mb-4">{article.title}</h1>
        <div className="text-sm text-gray-600 mb-6">
          By {article.author?.slug ? <Link href={`/authors/${article.author.slug}`}>{article.author.name}</Link> : article.author?.name} · {article.readingTime} min · <time dateTime={article.publishDate}>{new Date(article.publishDate).toLocaleDateString()}</time>
        </div>
        <img src={article.heroImage} alt={article.title} className="w-full rounded-lg mb-6 object-cover"/>
      </header>

      {isLocked ? (
        <section className="search-panel" aria-label="Premium access required">
          <div className="search-field" style={{ gridColumn: '1 / -1' }}>
            <label>Premium Article</label>
            <p className="text-gray-700">This story is available to paid subscribers only.</p>
            <p className="text-gray-700">Subscribe to continue reading the full article and all premium investigations.</p>
            <div className="hero-actions mt-3">
              <Link className="btn btn-primary" href="/subscribe">Subscribe to unlock</Link>
              {!user ? <Link className="btn btn-outline" href="/login">Log in</Link> : null}
            </div>
          </div>
        </section>
      ) : (
        <section className="prose max-w-none" dangerouslySetInnerHTML={{ __html: article.body }} />
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  )
}
