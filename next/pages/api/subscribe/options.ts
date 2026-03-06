import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(_req: NextApiRequest, res: NextApiResponse){
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const stripePriceId = process.env.STRIPE_PRICE_ID

  const hasPaystack = Boolean(paystackSecretKey && !/replace_me/i.test(paystackSecretKey))
  const hasStripe = Boolean(
    stripeSecretKey &&
    stripePriceId &&
    !/replace_me|^sk_test_replace/i.test(stripeSecretKey) &&
    !/replace_me|^price_replace/i.test(stripePriceId),
  )

  const manualEnabled = process.env.MANUAL_SUBSCRIPTION_ENABLED !== 'false'
  const provider = hasPaystack ? 'paystack' : hasStripe ? 'stripe' : manualEnabled ? 'manual' : 'none'

  return res.status(200).json({
    data: {
      provider,
      manual: {
        enabled: provider === 'manual',
        accountName: process.env.MANUAL_BANK_ACCOUNT_NAME || 'AfriDigest Media',
        accountNumber: process.env.MANUAL_BANK_ACCOUNT_NUMBER || '0000000000',
        bankName: process.env.MANUAL_BANK_NAME || 'Your Bank',
        amountNgn: Number(process.env.MANUAL_SUBSCRIPTION_AMOUNT_NGN || 5000),
      },
    },
  })
}
