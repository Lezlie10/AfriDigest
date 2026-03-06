import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL
if(!databaseUrl){
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const pool = new Pool({ connectionString: databaseUrl })

function readJson(fileName){
  const p = path.join(process.cwd(), 'content', fileName)
  if(!fs.existsSync(p)) return []
  const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'))
  return Array.isArray(parsed) ? parsed : []
}

async function run(){
  const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql')
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8')
  await pool.query(schemaSql)

  const users = readJson('users.json')
  for(const u of users){
    await pool.query(
      `INSERT INTO users (
        id, full_name, email, phone, password_hash, password_salt, created_at,
        subscription_status, subscription_plan, subscription_started_at,
        stripe_customer_id, stripe_subscription_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        password_hash = EXCLUDED.password_hash,
        password_salt = EXCLUDED.password_salt,
        created_at = EXCLUDED.created_at,
        subscription_status = EXCLUDED.subscription_status,
        subscription_plan = EXCLUDED.subscription_plan,
        subscription_started_at = EXCLUDED.subscription_started_at,
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        stripe_subscription_id = EXCLUDED.stripe_subscription_id`,
      [
        Number(u.id),
        String(u.fullName || ''),
        String(u.email || '').toLowerCase(),
        String(u.phone || ''),
        String(u.passwordHash || ''),
        String(u.passwordSalt || ''),
        String(u.createdAt || new Date().toISOString()),
        u.subscriptionStatus || null,
        u.subscriptionPlan || null,
        u.subscriptionStartedAt || null,
        u.stripeCustomerId || null,
        u.stripeSubscriptionId || null,
      ],
    )
  }

  const subscribers = readJson('subscribers.json')
  for(const s of subscribers){
    await pool.query(
      `INSERT INTO subscribers (
        id, email, full_name, phone, subscribed_at, status, provider, transfer_reference
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        subscribed_at = EXCLUDED.subscribed_at,
        status = EXCLUDED.status,
        provider = EXCLUDED.provider,
        transfer_reference = EXCLUDED.transfer_reference`,
      [
        Number(s.id),
        String(s.email || '').toLowerCase(),
        String(s.fullName || ''),
        String(s.phone || ''),
        String(s.subscribedAt || new Date().toISOString()),
        String(s.status || 'active'),
        String(s.provider || 'manual-transfer'),
        String(s.transferReference || s.paystackReference || s.stripeSubscriptionId || ''),
      ],
    )
  }

  const requests = readJson('subscription-requests.json')
  for(const r of requests){
    await pool.query(
      `INSERT INTO subscription_requests (
        id, full_name, email, phone, transfer_reference, transfer_reference_normalized,
        receipt_url, receipt_file_name, amount_ngn, status, created_at, updated_at, reviewed_at, review_note
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        transfer_reference = EXCLUDED.transfer_reference,
        transfer_reference_normalized = EXCLUDED.transfer_reference_normalized,
        receipt_url = EXCLUDED.receipt_url,
        receipt_file_name = EXCLUDED.receipt_file_name,
        amount_ngn = EXCLUDED.amount_ngn,
        status = EXCLUDED.status,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at,
        reviewed_at = EXCLUDED.reviewed_at,
        review_note = EXCLUDED.review_note`,
      [
        Number(r.id),
        String(r.fullName || ''),
        String(r.email || '').toLowerCase(),
        String(r.phone || ''),
        String(r.transferReference || ''),
        r.transferReferenceNormalized || null,
        r.receiptUrl || null,
        r.receiptFileName || null,
        typeof r.amountNgn === 'number' ? r.amountNgn : null,
        String(r.status || 'pending'),
        String(r.createdAt || new Date().toISOString()),
        r.updatedAt || null,
        r.reviewedAt || null,
        r.reviewNote || null,
      ],
    )
  }

  const cmsArticles = readJson('articles.json')
  for(const a of cmsArticles){
    await pool.query(
      `INSERT INTO cms_articles (
        id, slug, title, excerpt, body, hero_image, author_id, category_ids, tags,
        exclusive, publish_date, reading_time, meta_description
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        excerpt = EXCLUDED.excerpt,
        body = EXCLUDED.body,
        hero_image = EXCLUDED.hero_image,
        author_id = EXCLUDED.author_id,
        category_ids = EXCLUDED.category_ids,
        tags = EXCLUDED.tags,
        exclusive = EXCLUDED.exclusive,
        publish_date = EXCLUDED.publish_date,
        reading_time = EXCLUDED.reading_time,
        meta_description = EXCLUDED.meta_description`,
      [
        Number(a.id),
        String(a.slug || ''),
        String(a.title || ''),
        String(a.excerpt || ''),
        String(a.body || ''),
        String(a.heroImage || ''),
        Number(a.authorId || 0),
        Array.isArray(a.categoryIds) ? a.categoryIds.map(Number) : [],
        Array.isArray(a.tags) ? a.tags.map(String) : [],
        Boolean(a.exclusive),
        String(a.publishDate || new Date().toISOString()),
        Number(a.readingTime || 5),
        String(a.metaDescription || ''),
      ],
    )
  }

  console.log('Migration complete: users, subscribers, subscription requests, cms articles')
}

run()
  .catch((err) => {
    console.error('Migration failed', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
