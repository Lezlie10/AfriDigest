# AfriDigest — Project Requirements (MVP)

## Purpose & Audience
- Purpose: Build a professional, fast, SEO-friendly online magazine focused on African news, culture, and analysis.
- Primary audience: English-speaking readers across Africa and global readers interested in African topics.

## Goals
- High-quality, magazine-grade design and typography.
- Excellent SEO and performance (fast LCP, small bundle).
- Easy multi-author publishing workflow and newsletter capture.

## Tech Stack (MVP)
- Database: PostgreSQL
- Backend/API: Node.js + Express
- Frontend: React (create-react-app or Vite) — server-side rendering optional later
- Optional: Next.js later for SEO/SSR improvements
- Hosting: Vercel / Netlify for frontend, Heroku / Railway / DigitalOcean for API and Postgres

## Primary Pages & Routes
- Homepage — hero, featured stories, latest, categories
- Article list (by category/tag)
- Article detail (SEO meta, structured data)
- Author profile page
- Category page
- Search results page
- Newsletter signup modal/page
- Admin/CMS (initially lightweight: content via admin UI or simple script)

## Content Model (core entities)
- Article: id, slug, title, subtitle, excerpt, body (HTML/Markdown), heroImage, gallery[], authorId, categoryIds[], tagIds[], publishDate, status (draft/published), readingTime, metaDescription
- Author: id, name, bio, avatar, socialLinks, slug
- Category: id, name, slug, description
- Tag: id, name, slug
- Subscriber: id, email, subscribedAt, confirmed

## MVP Features (first release)
- Responsive design with a readable typographic scale
- Homepage: hero + curated list + latest articles
- Article pages with social share links and SEO meta tags
- Search (text search across titles and excerpts)
- Newsletter subscription (email capture + simple confirmation)
- Author pages and category listing

## Nice-to-have (phase 2)
- Comments (Disqus or custom)
- User accounts / paywall
- Advanced CMS (Strapi / Sanity / Ghost) integration
- SSR for improved SEO and performance

## SEO & Accessibility Requirements
- Each article must include unique title and meta description
- Use semantic HTML, correct heading order, alt text for images
- Fast page load: target LCP < 2.5s, TTFB low, images optimized
- Structured data: Article schema JSON-LD on article pages

## Analytics & Tracking
- Add privacy-conscious analytics (Plausible or Google Analytics with consent)

## Performance Targets
- Minimize render-blocking CSS/JS
- Use responsive images (srcset) and lazy-loading for non-critical images

## Content Workflow
- Authors write in Markdown or rich editor -> preview -> publish
- Editorial flow: draft -> review -> publish

## API Endpoints (initial)
- GET /api/articles?limit=&page=&category=&tag=&search=
- GET /api/articles/:slug
- GET /api/authors/:slug
- POST /api/subscribe
- Admin CRUD endpoints protected with simple auth/token

## Design Guidelines
- Typeface: readable serif for headings + sans for body (e.g., Merriweather + Inter)
- Grid: 12-column responsive grid
- Images: consistent aspect ratios for cards; large hero images

## Deployment & CI
- Repo with separate `client/` and `api/` folders
- CI: run lint, tests, build; deploy on push to main

## Initial Milestones & Next Steps
1. Scaffold project (`client` + `api`) and set up Postgres locally
2. Build responsive homepage and header/nav
3. Implement article model + API and a sample seed script
4. Article detail page, SEO, and newsletter signup

---
_Document created: concise project requirements for AfriDigest MVP._
