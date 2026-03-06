CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  subscription_status TEXT,
  subscription_plan TEXT,
  subscription_started_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT
);

CREATE TABLE IF NOT EXISTS subscribers (
  id BIGINT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  provider TEXT NOT NULL,
  transfer_reference TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscription_requests (
  id BIGINT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  transfer_reference TEXT NOT NULL,
  transfer_reference_normalized TEXT UNIQUE,
  receipt_url TEXT,
  receipt_file_name TEXT,
  amount_ngn INTEGER,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT
);

CREATE TABLE IF NOT EXISTS cms_articles (
  id BIGINT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,
  hero_image TEXT NOT NULL,
  author_id INTEGER NOT NULL,
  category_ids INTEGER[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  exclusive BOOLEAN NOT NULL DEFAULT FALSE,
  publish_date TIMESTAMPTZ NOT NULL,
  reading_time INTEGER NOT NULL,
  meta_description TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_email ON subscription_requests (email);
CREATE INDEX IF NOT EXISTS idx_cms_articles_publish_date ON cms_articles (publish_date DESC);
