# Deploy Now (Copy/Paste)

## 1) Pre-check locally

```bash
npm run deploy:check
npm run build
```

If `deploy:check` fails, set missing env vars in your deployment platform first.

## 2) Create DB tables (one-time)

Use your production `DATABASE_URL` in environment, then run:

```bash
npm run db:init
```

## 3) Migrate existing JSON data (one-time)

```bash
npm run db:migrate-json
```

## 4) Vercel settings

- Project root directory: `next`
- Build command: `npm run build`
- Install command: `npm install`

Set these environment variables in Vercel:

- `NEXT_PUBLIC_SITE_URL`
- `DATABASE_URL`
- `AUTH_SECRET`
- `ADMIN_TOKEN`
- `ADMIN_EMAILS`
- Stripe mode: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`
- or Paystack mode: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PLAN_CODE`
- Manual mode (if needed):
  - `MANUAL_SUBSCRIPTION_ENABLED=true`
  - `AUTO_APPROVE_MANUAL_SUBSCRIPTIONS=false`
  - `MANUAL_SUBSCRIPTION_AMOUNT_NGN`
  - `MANUAL_BANK_NAME`
  - `MANUAL_BANK_ACCOUNT_NAME`
  - `MANUAL_BANK_ACCOUNT_NUMBER`

## 5) Final verify after deploy

- Signup/login works
- Manual request submit works
- Admin approve/reject works
- Exclusive article locked for non-subscriber, unlocked for active subscriber
