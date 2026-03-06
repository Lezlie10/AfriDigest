'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Props = {
  sessionId?: string
  reference?: string
}

export default function SubscribeSuccessClient({ sessionId = '', reference = '' }: Props){
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    if(!sessionId && !reference){
      setStatus('error')
      setError('Missing payment session reference.')
      return
    }

    ;(async () => {
      try{
        const res = await fetch('/api/subscribe/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, reference }),
        })
        const json = await res.json()
        if(!res.ok) throw new Error(json?.error || 'Failed to confirm payment')
        if(mounted) setStatus('success')
      }catch(err: any){
        if(mounted){
          setStatus('error')
          setError(err?.message || 'Failed to confirm subscription')
        }
      }
    })()

    return () => { mounted = false }
  }, [sessionId, reference])

  return (
    <div className="container py-12">
      <h1 className="font-serif text-4xl mb-3">Subscription</h1>

      {status === 'loading' ? <p className="text-gray-600">Confirming your payment...</p> : null}
      {status === 'success' ? (
        <div>
          <p className="text-green-700 mb-5">Payment confirmed. Your AfriDigest subscription is now active.</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/">Go to homepage</Link>
            <Link className="btn btn-outline" href="/account">View my account</Link>
          </div>
        </div>
      ) : null}

      {status === 'error' ? (
        <div>
          <p className="text-red-700 mb-5">{error}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/subscribe">Try payment again</Link>
            <Link className="btn btn-outline" href="/">Back home</Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
