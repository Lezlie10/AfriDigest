import React from 'react'
import Link from 'next/link'
import ArticleCard from '../../components/ArticleCard'
import { authors, categories, searchArticles } from '../../data/articles'

type SearchParams = {
  q?: string
  category?: string
  tag?: string
  author?: string
}

type Props = {
  searchParams?: Promise<SearchParams>
}

export async function generateMetadata({ searchParams }: Props){
  const params = (await searchParams) || {}
  const q = (params.q || '').trim()
  return {
    title: q ? `Search: ${q} — AfriDigest` : 'Search — AfriDigest',
    description: 'Search and filter AfriDigest articles by keyword, category and tag.',
  }
}

export default async function SearchPage({ searchParams }: Props){
  const params = (await searchParams) || {}
  const q = (params.q || '').trim()
  const category = (params.category || '').trim()
  const tag = (params.tag || '').trim()
  const author = (params.author || '').trim()

  const results = await searchArticles({
    search: q || undefined,
    category: category || undefined,
    tag: tag || undefined,
    author: author || undefined,
  })

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="font-serif text-4xl mb-3">Search Articles</h1>
        <p className="text-gray-600">Find stories by keyword, category, tag, or author.</p>
      </header>

      <form action="/search" method="get" className="search-panel mb-10">
        <div className="search-field">
          <label htmlFor="q">Keyword</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Search title, excerpt, tags" />
        </div>
        <div className="search-field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={category}>
            <option value="">All categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="search-field">
          <label htmlFor="tag">Tag</label>
          <input id="tag" name="tag" type="text" defaultValue={tag} placeholder="e.g. climate" />
        </div>
        <div className="search-field">
          <label htmlFor="author">Author</label>
          <select id="author" name="author" defaultValue={author}>
            <option value="">All authors</option>
            {authors.map(a => (
              <option key={a.id} value={a.slug}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="search-actions">
          <button className="btn btn-primary" type="submit">Search</button>
          <Link className="btn btn-outline" href="/search">Reset</Link>
        </div>
      </form>

      <section>
        <div className="section-header">
          <h2 className="text-2xl font-serif">Results</h2>
          <span className="text-sm text-gray-500">{results.length} found</span>
        </div>

        {results.length === 0 ? (
          <p className="text-gray-500">No articles match your filters.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mt-4">
            {results.map((article: any) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
