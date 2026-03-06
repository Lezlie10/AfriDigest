import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { sessionCookieName, verifySessionToken } from '../../../lib/session'
import AdminSubscriptionsClient from './AdminSubscriptionsClient'

export const metadata = {
  title: 'Admin Subscriptions — AfriDigest',
  description: 'Review manual subscription requests.',
}

export default async function AdminSubscriptionsPage(){
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionCookieName())?.value
  const session = verifySessionToken(token)
  if(!session) redirect('/login')

  return <AdminSubscriptionsClient />
}
