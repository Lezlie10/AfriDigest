import React from 'react'
import type { Metadata } from 'next'
import { getAuthorBySlug, getArticlesByAuthorSlug } from '../../../data/articles'
import AuthorPageClient from './AuthorPageClient'

type RouteProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: RouteProps){
  const { slug } = await params
  const author = getAuthorBySlug(slug)
  if(!author) return { title: 'Author' }
  return {
    title: `${author.name} — AfriDigest`,
    description: author.bio,
    alternates: { canonical: `/authors/${author.slug}` },
  } satisfies Metadata
}

export default async function AuthorPage({ params }: RouteProps){
  const { slug } = await params
  const author = getAuthorBySlug(slug)
  if(!author) return (<div className="container py-12">Author not found.</div>)

  const authorArticles = await getArticlesByAuthorSlug(slug)

  return <AuthorPageClient author={author} authorArticles={authorArticles} />
}
