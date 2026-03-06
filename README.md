# AfriDigest

AfriDigest is a professional magazine platform focused on stories, analysis, and culture across Africa.

## Project Structure

- `next/`: primary production app (Next.js + TypeScript)
- `client/`: early static prototype
- `api/`: early Express prototype API

## Run the Next.js App Locally

1. Open a terminal in `next/`
2. Install dependencies:
	- `npm ci`
3. Create env file:
	- copy `next/.env.example` to `next/.env.local`
4. Start development server:
	- `npm run dev`
5. Open:
	- `http://localhost:3000`

## Production Build

From `next/`:

- `npm run build`
- `npm run start`

## Environment Variables

Defined in `next/.env.example`:

- `NEXT_PUBLIC_SITE_URL`: public base URL for metadata/sitemap/robots
- `AUTH_SECRET`: cookie/session signing secret
- `ADMIN_TOKEN`: required for admin article publishing API
- `ADMIN_EMAILS`: optional comma-separated admin email allowlist for admin APIs
- `PAYSTACK_SECRET_KEY` (+ `PAYSTACK_PLAN_CODE` or `PAYSTACK_AMOUNT_KOBO`) for Paystack checkout (Nigeria-friendly)
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` for Stripe checkout fallback
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: optional SMTP for reset emails

If SMTP is not configured, reset emails use a local dev outbox flow.

## CI/CD

GitHub Actions workflow: `next/.github/workflows/ci.yml`

On push/PR, it runs:

1. `npm ci`
2. `npx tsc --noEmit`
3. `npm run build`

## Deployment Notes

Recommended host: Vercel (or any Node-compatible host).

1. Set project root to `next/`
2. Configure all required environment variables from `.env.example`
3. Build command: `npm run build`
4. Start command: `npm run start` (if required by your host)
5. Set `NEXT_PUBLIC_SITE_URL` to your production domain

After deployment, verify:

- `/robots.txt`
- `/sitemap.xml`
- signup/login/forgot/reset flows
- admin article publishing with `ADMIN_TOKEN`
- paid subscription flow (`/subscribe` -> checkout -> `/subscribe/success`)

## Paid Subscription Setup (Paystack - Recommended for Nigeria)

1. Create a Paystack account and switch to Test mode.
2. Copy your secret key into `PAYSTACK_SECRET_KEY`.
3. Set either:
	- recurring plan code in `PAYSTACK_PLAN_CODE`, or
	- one-time amount in `PAYSTACK_AMOUNT_KOBO` (e.g. `500000` for NGN 5,000.00).
4. Set `NEXT_PUBLIC_SITE_URL` to your app URL (for callback routing).

## Stripe Setup (Optional Fallback)

1. Create a recurring product/price in Stripe Dashboard.
2. Copy the recurring `price_...` ID into `STRIPE_PRICE_ID`.
3. Set `STRIPE_SECRET_KEY` (server-side secret key).
4. Set `NEXT_PUBLIC_SITE_URL` to your domain so checkout return URLs are correct.

The app automatically uses Paystack when configured, otherwise Stripe if configured. Subscription is activated only after payment confirmation.

## Manual Subscription (No Gateway)

If you do not have Paystack/Stripe yet, enable manual transfer workflow:

1. Set `MANUAL_SUBSCRIPTION_ENABLED=true`.
2. Keep `AUTO_APPROVE_MANUAL_SUBSCRIPTIONS=false` for fraud safety in manual transfer mode.
2. Set bank/account details and amount in `.env.local`:
	- `MANUAL_BANK_NAME`
	- `MANUAL_BANK_ACCOUNT_NAME`
	- `MANUAL_BANK_ACCOUNT_NUMBER`
	- `MANUAL_SUBSCRIPTION_AMOUNT_NGN`
3. Users submit transfer references on `/subscribe`.
4. Users upload transfer receipt image (PNG/JPG/WEBP, up to 2MB).
5. Admin verifies that funds have actually entered your bank account.
6. Only after verification should admin approve on `/admin/subscriptions`.

Note: automatic, trustless approval requires a provider/bank webhook (e.g. Paystack/Stripe/bank API) that confirms settled payment.
