import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { authors, categories } from '../../../data/articles'
import AdminArticlesClient from './AdminArticlesClient'
import { sessionCookieName, verifySessionToken } from '../../../lib/session'

export const metadata = {
  title: 'Admin Articles — AfriDigest',
  description: 'Create and manage magazine articles.',
}

export default async function AdminArticlesPage(){
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionCookieName())?.value
  const session = verifySessionToken(token)
  if(!session) redirect('/login')

  return <AdminArticlesClient authors={authors} categories={categories} />
}
