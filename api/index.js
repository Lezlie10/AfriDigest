const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

// richer in-memory sample data (authors, categories, articles)
const authors = [
  { id: 1, slug: 'jane-doe', name: 'Jane Doe', bio: 'Investigative reporter focusing on climate and policy.' },
  { id: 2, slug: 'john-okafor', name: 'John Okafor', bio: 'Cultural critic and long-form features writer.' },
  { id: 3, slug: 'mary-ame', name: 'Mary Ame', bio: 'Economics correspondent covering regional markets.' }
];

const categories = [
  { id: 1, slug: 'world', name: 'World' },
  { id: 2, slug: 'culture', name: 'Culture' },
  { id: 3, slug: 'opinion', name: 'Opinion' },
  { id: 4, slug: 'business', name: 'Business' }
];

const articles = [
  {
    id: 101,
    slug: 'investigating-water-security',
    title: 'Investigating Water Security Across the Sahel',
    excerpt: 'How shifting rainfall patterns and policy gaps are reshaping access to water.',
    body: '<p>Full article HTML content would go here for the demo. Use Markdown or rich text in production.</p>',
    heroImage: 'https://picsum.photos/seed/water/1200/700',
    authorId: 1,
    categoryIds: [1],
    tags: ['climate','policy','investigation'],
    publishDate: '2026-02-10T08:00:00Z',
    readingTime: 8,
    metaDescription: 'An in-depth look at water security challenges in the Sahel region.'
  },
  {
    id: 102,
    slug: 'fashion-and-identity',
    title: 'Fashion and Identity: New Voices from Lagos',
    excerpt: 'Emerging designers in Lagos blend tradition and modernity to redefine style.',
    body: '<p>Feature piece exploring contemporary fashion in Lagos.</p>',
    heroImage: 'https://picsum.photos/seed/fashion/1200/700',
    authorId: 2,
    categoryIds: [2],
    tags: ['fashion','culture','design'],
    publishDate: '2026-02-15T10:30:00Z',
    readingTime: 6,
    metaDescription: 'Profiles of the designers influencing African fashion today.'
  },
  {
    id: 103,
    slug: 'regional-markets-rebound',
    title: 'Regional Markets Rebound: What Investors Need to Know',
    excerpt: 'A look at recent market signals and what they mean for regional investment.',
    body: '<p>Market analysis and context for investors and readers.</p>',
    heroImage: 'https://picsum.photos/seed/markets/1200/700',
    authorId: 3,
    categoryIds: [4],
    tags: ['economy','markets','analysis'],
    publishDate: '2026-02-12T09:00:00Z',
    readingTime: 7,
    metaDescription: 'Analysis of the recent rebound in regional markets.'
  }
];

// helper: join article with author and categories
function enrichArticle(a){
  const author = authors.find(x=>x.id===a.authorId) || null;
  const cats = categories.filter(c=>a.categoryIds.includes(c.id));
  return Object.assign({}, a, { author: author ? { name: author.name, slug: author.slug } : null, categories: cats });
}

// GET /api/articles - supports ?search=&limit=&category=&tag=
app.get('/api/articles', (req,res)=>{
  const { search, limit, category, tag } = req.query;
  let out = articles.slice();
  if(search){
    const q = String(search).toLowerCase();
    out = out.filter(a => (a.title + ' ' + (a.excerpt||'') + ' ' + (a.tags||[]).join(' ')).toLowerCase().includes(q));
  }
  if(category){
    out = out.filter(a => a.categoryIds && a.categoryIds.some(id => {
      const c = categories.find(x=>x.id==id); return c && c.slug===category;
    }));
  }
  if(tag){
    out = out.filter(a => Array.isArray(a.tags) && a.tags.includes(tag));
  }
  const lim = parseInt(limit,10) || out.length;
  out = out.slice(0, lim).map(enrichArticle);
  res.json({ data: out });
});

app.get('/api/articles/:slug', (req,res)=>{
  const a = articles.find(x=>x.slug===req.params.slug);
  if(!a) return res.status(404).json({ error:'Not found' });
  res.json({ data: enrichArticle(a) });
});

app.get('/api/authors', (req,res)=>{
  res.json({ data: authors });
});

app.get('/api/categories', (req,res)=>{
  res.json({ data: categories });
});

app.post('/api/subscribe', (req,res)=>{
  const { email } = req.body;
  if(!email) return res.status(400).json({ error:'Missing email' });
  // in a real app, save to DB and send confirmation email
  return res.json({ success:true, message:'Subscribed (demo)', email });
});

app.listen(port, ()=> console.log(`API listening on http://localhost:${port}`));
