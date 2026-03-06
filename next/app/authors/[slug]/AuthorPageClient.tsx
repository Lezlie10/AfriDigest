'use client'

import React from 'react'
import Link from 'next/link'

type Props = {
  author: { name?: string; bio?: string }
  authorArticles: Array<{ slug?: string; title?: string }>
}

export default function AuthorPageClient({ author, authorArticles }: Props) {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold">{author?.name ?? 'Author'}</h1>
      {author?.bio ? <p className="mt-3 text-neutral-700">{author.bio}</p> : null}

      <ul className="mt-8 space-y-2">
        {authorArticles.map((article, i) => (
          <li key={article.slug ?? i}>
            {article.slug ? (
              <Link href={`/articles/${article.slug}`}>{article.title ?? 'Untitled article'}</Link>
            ) : (
              article.title ?? 'Untitled article'
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}