'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordClient(){
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [devCode, setDevCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEmailValid = /\S+@\S+\.\S+/.test(email)
  const canSubmit = isEmailValid && !isSubmitting

  async function readResponsePayload(res: Response){
    const contentType = String(res.headers.get('content-type') || '').toLowerCase()
    if(contentType.includes('application/json')) return res.json()
    const text = await res.text()
    return { error: text || `Request failed with status ${res.status}` }
  }

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    if(!canSubmit) return
    setIsSubmitting(true)
    setError('')
    setMessage('')
    setDevCode('')

    try{
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await readResponsePayload(res)
      if(!res.ok){
        setError(json?.error || 'Failed to send code')
        return
      }
      setMessage(json?.message || 'Reset code sent')
      if(json?.devCode) setDevCode(String(json.devCode))
    }catch{
      setError('Network error. Please try again.')
    }finally{
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-12">
      <h1 className="font-serif text-4xl mb-3">Forgot Password</h1>
      <p className="text-gray-600 mb-8">Enter your email and we’ll send a reset code.</p>

      <form className="search-panel" onSubmit={onSubmit} aria-busy={isSubmitting}>
        <div className="search-field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required aria-invalid={email.length > 0 && !isEmailValid} /></div>
        <div className="search-actions"><button className="btn btn-primary" type="submit" disabled={!canSubmit} aria-busy={isSubmitting}>{isSubmitting ? 'Sending...' : 'Send code'}</button></div>
      </form>

      {message ? <p className="mt-4 text-green-700">{message}</p> : null}
      {devCode ? <p className="mt-2 text-amber-700">Dev code: <strong>{devCode}</strong></p> : null}
      {error ? <p className="mt-4 text-red-700">{error}</p> : null}

      <p className="mt-6"><Link href="/reset-password">I have a code</Link></p>
    </div>
  )
}
