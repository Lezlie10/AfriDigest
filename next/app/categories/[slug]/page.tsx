import Link from 'next/link'
import type { Metadata } from 'next'
import { getCategoryBySlug, getArticlesByCategorySlug, getCategoryCoverImage } from '../../../data/articles'

type RouteProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: RouteProps){
  const { slug } = await params
  const category = getCategoryBySlug(slug)
  if(!category) return { title: 'Category' }
  return {
    title: `${category.name} — AfriDigest`,
    description: `${category.name} articles from AfriDigest`,
    alternates: { canonical: `/categories/${category.slug}` },
  } satisfies Metadata
}

export default async function CategoryPage({ params }: RouteProps) {
  const { slug } = await params
  const category = getCategoryBySlug(slug)
  if(!category) return <div className="container py-12">Category not found.</div>

  const categoryArticles = await (await getArticlesByCategorySlug(slug))
    .sort((a:any, b:any) => new Date(b.publishDate || '').getTime() - new Date(a.publishDate || '').getTime())

  const featuredArticle = categoryArticles[0]
  const remainingArticles = categoryArticles.slice(1)
  const categoryCover = getCategoryCoverImage(category.slug)

  return (
    <div className="container py-12">
      <header className="category-hero mb-10">
        <img src={categoryCover} alt={`${category.name} desk`} className="category-hero-image" />
        <div className="category-hero-overlay" />
        <div className="category-hero-body">
          <p className="category-hero-kicker">Category Desk</p>
          <h1 className="font-serif text-4xl mb-2">{category.name}</h1>
          <p className="text-lg text-gray-100 mb-4">{categoryArticles.length} {categoryArticles.length === 1 ? 'article' : 'articles'} in this category</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/search">Search all stories</Link>
            <Link className="btn btn-outline" href="/subscribe">Subscribe</Link>
          </div>
        </div>
      </header>

      <section>
        {categoryArticles.length === 0 ? (
          <p className="text-gray-500">No articles in this category yet.</p>
        ) : (
          <>
            {featuredArticle ? (
              <article className="category-featured-card mb-8">
                <Link href={`/articles/${featuredArticle.slug}`}>
                  <img src={featuredArticle.heroImage} alt={featuredArticle.title} className="category-featured-image" />
                </Link>
                <div className="category-featured-body">
                  <p className="kicker">Featured in {category.name}</p>
                  <h2>
                    <Link href={`/articles/${featuredArticle.slug}`}>{featuredArticle.title}</Link>
                  </h2>
                  <p>{featuredArticle.excerpt}</p>
                  <div className="text-sm text-gray-500 mt-3">By {featuredArticle.author?.name || 'AfriDigest'} · {featuredArticle.readingTime || 6} min</div>
                  <div className="mt-4">
                    <Link className="btn btn-primary" href={`/articles/${featuredArticle.slug}`}>Read featured story</Link>
                  </div>
                </div>
              </article>
            ) : null}

            {remainingArticles.length > 0 ? (
              <div className="category-grid">
                {remainingArticles.map((a: any) => (
                  <article key={a.id} className="card">
                    <Link href={`/articles/${a.slug}`}>
                      <img src={a.heroImage} alt={a.title} />
                    </Link>
                    <div className="card-body">
                      <h3 className="card-title"><Link href={`/articles/${a.slug}`}>{a.title}</Link></h3>
                      <p className="card-excerpt">{a.excerpt}</p>
                      <div className="text-sm text-gray-500 mt-3">By {a.author?.name || 'AfriDigest'} · {a.readingTime || 6} min</div>
                      <div className="mt-4">
                        <Link className="btn btn-outline btn-sm" href={`/articles/${a.slug}`}>Open article</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}
