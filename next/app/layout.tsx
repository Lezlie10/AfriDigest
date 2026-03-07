import './globals.css'
import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'AfriDigest',
  description: 'AfriDigest — insights and stories from across Africa',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'AfriDigest',
    description: 'AfriDigest — insights and stories from across Africa',
    url: '/',
    siteName: 'AfriDigest',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AfriDigest',
    description: 'AfriDigest — insights and stories from across Africa',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <header className="site-header sticky">
          <div className="container py-4">
            <div className="header-top-row">
              <Link className="brand-lockup" href="/">
                <img src="/logo.svg" alt="AfriDigest logo" className="brand-logo"/>
                <div>
                  <div className="font-serif text-xl">AfriDigest</div>
                  <div className="text-xs text-amber-700">All Things Africa</div>
                </div>
              </Link>

              <div className="header-quick-actions">
                <Link className="text-sm text-gray-600" href="/login">Login</Link>
                <Link className="text-sm text-gray-600" href="/account">My Account</Link>
                <Link className="btn btn-outline btn-sm" href="/signup">Sign up</Link>
                <Link className="btn btn-primary btn-sm" href="/subscribe">Subscribe</Link>
              </div>
            </div>

            <nav className="header-links" aria-label="Primary navigation">
              <div className="header-main-links">
                <Link className="text-sm text-gray-600" href="/categories/world">World</Link>
                <Link className="text-sm text-gray-600" href="/categories/culture">Culture</Link>
                <Link className="text-sm text-gray-600" href="/categories/sports">Sports</Link>
                <Link className="text-sm text-gray-600" href="/categories/opinion">Opinion</Link>
                <Link className="text-sm text-gray-600" href="/admin/articles">Admin</Link>
                <Link className="text-sm text-gray-600" href="/admin/subscriptions">Sub Requests</Link>
              </div>

              <form action="/search" method="get" className="header-search" role="search">
                <label className="visually-hidden" htmlFor="header-q">Search articles</label>
                <input id="header-q" name="q" type="search" placeholder="Search articles" />
                <button className="btn btn-outline btn-sm" type="submit">Search</button>
              </form>
            </nav>
          </div>
        </header>
        <main id="main-content">{children}</main>
        <footer className="site-footer" role="contentinfo">
          <div className="container py-10 text-sm text-gray-500">© {new Date().getFullYear()} AfriDigest</div>
        </footer>
      </body>
    </html>
  )
}
