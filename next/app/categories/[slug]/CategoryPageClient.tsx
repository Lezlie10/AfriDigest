'use client'

import React from 'react'

type Props = {
  category: { name?: string; slug?: string }
  categoryArticles: Array<{ slug?: string; title?: string }>
}

export default function CategoryPageClient({ category, categoryArticles }: Props) {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold">{category?.name ?? 'Category'}</h1>
      <p className="mt-3 text-neutral-700">{categoryArticles.length} {categoryArticles.length === 1 ? 'article' : 'articles'}</p>

      <ul className="mt-8 space-y-2">
        {categoryArticles.map((article, i) => (
          <li key={article.slug ?? i}>{article.title ?? 'Untitled article'}</li>
        ))}
      </ul>
    </div>
  )
}
