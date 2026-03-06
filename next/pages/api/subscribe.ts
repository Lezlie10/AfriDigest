import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

type PaystackInitializeResponse = {
  status: boolean
  message: string
  data?: {
    authorization_url?: string
    access_code?: string
    reference?: string
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, fullName, phone } = req.body || {}
  if(!email || !String(email).includes('@')) return res.status(400).json({ error: 'Valid email is required' })

  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
  const paystackPlanCode = process.env.PAYSTACK_PLAN_CODE
  const paystackAmountKobo = Number(process.env.PAYSTACK_AMOUNT_KOBO || 0)

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const stripePriceId = process.env.STRIPE_PRICE_ID
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const hasPaystack = Boolean(paystackSecretKey && !/replace_me/i.test(paystackSecretKey))
  const hasStripe = Boolean(
    stripeSecretKey &&
    stripePriceId &&
    !/replace_me|^sk_test_replace/i.test(stripeSecretKey) &&
    !/replace_me|^price_replace/i.test(stripePriceId),
  )

  if(hasPaystack){
    if(!paystackPlanCode && (!Number.isFinite(paystackAmountKobo) || paystackAmountKobo <= 0)){
      return res.status(500).json({ error: 'Paystack is configured but missing PAYSTACK_PLAN_CODE or valid PAYSTACK_AMOUNT_KOBO.' })
    }

    try{
      const payload: Record<string, unknown> = {
        email: String(email).trim().toLowerCase(),
        callback_url: `${siteUrl}/subscribe/success`,
        metadata: {
          fullName: fullName ? String(fullName).trim() : '',
          phone: phone ? String(phone).trim() : '',
          email: String(email).trim().toLowerCase(),
          source: 'afridigest-subscribe',
        },
      }

      if(paystackPlanCode){
        payload.plan = paystackPlanCode
      }else{
        payload.amount = paystackAmountKobo
      }

      const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const initJson = (await initRes.json()) as PaystackInitializeResponse
      if(!initRes.ok || !initJson?.status || !initJson?.data?.authorization_url){
        const reason = initJson?.message || 'Paystack initialize failed'
        return res.status(500).json({ error: `Failed to start checkout session: ${reason}` })
      }

      return res.status(200).json({ success: true, data: { checkoutUrl: initJson.data.authorization_url, provider: 'paystack' } })
    }catch(err: any){
      return res.status(500).json({ error: `Failed to start checkout session: ${err?.message || 'Paystack request failed'}` })
    }
  }

  if(!hasStripe){
    return res.status(500).json({ error: 'Paid subscription is not configured. Set PAYSTACK_SECRET_KEY (+ plan/amount) or STRIPE_SECRET_KEY + STRIPE_PRICE_ID.' })
  }

  const stripe = new Stripe(String(stripeSecretKey), { apiVersion: '2026-02-25.clover' })

  try{
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: String(stripePriceId), quantity: 1 }],
      customer_email: String(email).trim().toLowerCase(),
      metadata: {
        fullName: fullName ? String(fullName).trim() : '',
        phone: phone ? String(phone).trim() : '',
        email: String(email).trim().toLowerCase(),
      },
      success_url: `${siteUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/subscribe?canceled=1`,
    })

    return res.status(200).json({ success: true, data: { checkoutUrl: session.url, provider: 'stripe' } })
  }catch(err: any){
    const reason = err?.message || 'Unknown Stripe error'
    return res.status(500).json({ error: `Failed to start checkout session: ${reason}` })
  }
}
