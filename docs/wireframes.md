# AfriDigest — Design layout & wireframes

This document captures the initial layout, components, and responsive wireframes for the AfriDigest homepage and article templates.

## Key layout regions
- Header: site brand, primary nav, search, subscribe CTA
- Hero: large featured story (image + headline + dek)
- Featured strip: 3–4 curated stories with large images
- Main content area: article list (cards) with optional right sidebar
- Footer: newsletter, links, copyright

## Wireframe rules
- Grid: 12-column responsive grid (desktop). Gutters: 24px.
- Breakpoints: mobile (<=600px), tablet (601–1024px), desktop (>=1025px).
- Typography: scale example — H1: 36px, H2: 28px, H3: 20px, body: 16px.
- Images: use 16:9 for hero and 4:3 for cards (or consistent cropping).

## Component specs (brief)
- Nav: sticky on scroll, collapsible mobile menu, visible subscribe CTA.
- Card: image, category label, title (2-line clamp), excerpt (3-line clamp), meta row.
- Article page: title, byline, publish date, hero image, article body, related stories.
- Author card: avatar, name, short bio, link to author page.

## Accessibility
- All images must have descriptive `alt` text.
- Headings follow semantic order (H1 → H2 → H3).
- Nav controls have ARIA labels and keyboard focus states.

## Low-fidelity wireframes
You can preview a clickable HTML wireframe at `client/wireframe.html` (static boxes and layout skeleton).

## Next steps
1. Iterate on visual style (typeface, color palette, spacing).
2. Convert the wireframe into responsive, production-ready HTML/CSS (start with header/nav and hero).
3. Create reusable components for article cards and article pages.
