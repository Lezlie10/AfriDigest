import React from 'react'
import Link from 'next/link'

type Props = {
  article: any
}

export default function ArticleCard({ article }: Props){
  return (
    <article className="card">
      <Link href={`/articles/${article.slug}`}>
        <img src={article.heroImage || 'https://picsum.photos/seed/card/800/500'} alt={article.title} />
      </Link>
      <div className="card-body">
        {article.exclusive ? <span className="exclusive-badge">Exclusive</span> : null}
        <div className="kicker">
          {article.categories?.[0]?.slug ? (
            <Link href={`/categories/${article.categories[0].slug}`}>{article.categories[0].name}</Link>
          ) : (
            article.categories?.[0]?.name
          )}
        </div>
        <h3 className="card-title">
          <Link href={`/articles/${article.slug}`}>{article.title}</Link>
        </h3>
        <p className="card-excerpt">{article.excerpt}</p>
        <div className="mt-3 text-sm text-gray-500">
          By {article.author?.slug ? (
            <Link href={`/authors/${article.author.slug}`}>{article.author.name}</Link>
          ) : (
            article.author?.name || '—'
          )} · {article.readingTime} min
        </div>
        <div className="mt-4">
          <Link className="btn btn-primary" href={`/articles/${article.slug}`}>Read Article</Link>
        </div>
      </div>
    </article>
  )
}
