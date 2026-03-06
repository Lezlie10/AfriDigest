# AfriDigest (Next.js)

## Storage Modes

- File mode (default): no `DATABASE_URL` set, data is read from `content/*.json`.
- Postgres mode: set `DATABASE_URL`, app uses Postgres first with file fallback disabled for writes.

## Postgres Setup

1. Create a Postgres database.
2. Add `DATABASE_URL` to `.env.local`.
3. Initialize schema:

```bash
npm run db:init
```

4. Migrate existing JSON data:

```bash
npm run db:migrate-json
```

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm run start
```

## Deployment (Vercel + Postgres)

1. Push this `next` folder to a GitHub repository.
2. Create a managed Postgres database (Neon, Supabase, Railway, Render, or Vercel Postgres).
3. In Vercel, import the repository and set the project root to `next`.
4. Add environment variables in Vercel Project Settings:

- `NEXT_PUBLIC_SITE_URL` (your final HTTPS domain)
- `DATABASE_URL` (Postgres connection string)
- `AUTH_SECRET` (long random secret)
- `ADMIN_TOKEN` (strong admin API token)
- `ADMIN_EMAILS` (comma-separated admin emails)
- Payment variables you use:
	- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`
	- Paystack: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PLAN_CODE` or `PAYSTACK_AMOUNT_KOBO`
- Manual transfer variables (if using manual mode):
	- `MANUAL_SUBSCRIPTION_ENABLED`
	- `AUTO_APPROVE_MANUAL_SUBSCRIPTIONS=false`
	- `MANUAL_SUBSCRIPTION_AMOUNT_NGN`
	- `MANUAL_BANK_NAME`
	- `MANUAL_BANK_ACCOUNT_NAME`
	- `MANUAL_BANK_ACCOUNT_NUMBER`
- Optional email reset variables:
	- `SMTP_SERVICE`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

5. Run schema setup once against production DB:

```bash
npm run db:init
```

6. If moving existing local data, run migration once with production `DATABASE_URL`:

```bash
npm run db:migrate-json
```

7. Redeploy and test these flows in production:

- Signup/login/logout
- Manual subscription request submit
- Admin approve/reject request
- Exclusive article lock/unlock behavior

## Notes

- If `DATABASE_URL` is not set, app falls back to JSON files in `content/`.
- For real deployment, rotate any dev/test secrets and API keys before going live.
