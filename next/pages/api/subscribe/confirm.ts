import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { normalizeEmail, updateUserSubscriptionByEmail } from '../../../lib/users'
import { readSubscribers, writeSubscribers } from '../../../lib/manual-subscriptions'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const sessionId = String(req.body?.sessionId || '').trim()
  const reference = String(req.body?.reference || '').trim()

  if(!sessionId && !reference){
    return res.status(400).json({ error: 'sessionId or reference is required' })
  }

  if(reference){
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if(!paystackSecretKey || /replace_me/i.test(paystackSecretKey)){
      return res.status(500).json({ error: 'Paystack is not configured' })
    }

    try{
      const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      })

      const verifyJson = await verifyRes.json() as any
      const tx = verifyJson?.data
      if(!verifyRes.ok || !verifyJson?.status || tx?.status !== 'success'){
        return res.status(400).json({ error: 'Payment not completed for this reference' })
      }

      const email = normalizeEmail(String(tx?.customer?.email || tx?.metadata?.email || ''))
      if(!email || !email.includes('@')) return res.status(400).json({ error: 'Unable to resolve subscriber email' })

      const fullName = String(tx?.metadata?.fullName || tx?.customer?.first_name || '').trim()
      const phone = String(tx?.metadata?.phone || '').trim()

      const current = await readSubscribers()
      const exists = current.some((s: any) => s.email === email)
      if(!exists){
        current.push({
          id: Date.now(),
          email,
          fullName,
          phone,
          subscribedAt: new Date().toISOString(),
          status: 'active',
          provider: 'paystack',
          transferReference: reference,
        })
        await writeSubscribers(current)
      }

      await updateUserSubscriptionByEmail(email, {
        status: 'active',
        plan: 'premium-monthly',
        startedAt: new Date().toISOString(),
      })

      return res.status(200).json({ success: true, data: { email, status: 'active', provider: 'paystack' } })
    }catch{
      return res.status(500).json({ error: 'Failed to verify payment reference' })
    }
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if(!secretKey || /replace_me|^sk_test_replace/i.test(secretKey)) return res.status(500).json({ error: 'Stripe is not configured' })

  try{
    const stripe = new Stripe(secretKey, { apiVersion: '2026-02-25.clover' })
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if(session.mode !== 'subscription' || session.payment_status !== 'paid'){
      return res.status(400).json({ error: 'Payment not completed for this session' })
    }

    const email = normalizeEmail(String(session.customer_details?.email || session.metadata?.email || ''))
    if(!email || !email.includes('@')) return res.status(400).json({ error: 'Unable to resolve subscriber email' })

    const fullName = String(session.metadata?.fullName || '').trim()
    const phone = String(session.metadata?.phone || '').trim()

    const current = await readSubscribers()
    const exists = current.some((s: any) => s.email === email)
    if(!exists){
      current.push({
        id: Date.now(),
        email,
        fullName,
        phone,
        subscribedAt: new Date().toISOString(),
        status: 'active',
        provider: 'stripe',
        transferReference: typeof session.subscription === 'string' ? session.subscription : sessionId,
      })
      await writeSubscribers(current)
    }

    await updateUserSubscriptionByEmail(email, {
      status: 'active',
      plan: 'premium-monthly',
      startedAt: new Date().toISOString(),
      stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
      stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
    })

    return res.status(200).json({ success: true, data: { email, status: 'active', provider: 'stripe' } })
  }catch{
    return res.status(500).json({ error: 'Failed to verify payment session' })
  }
}
