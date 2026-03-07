'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function LoginClient(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEmailValid = /\S+@\S+\.\S+/.test(email)
  const canSubmit = isEmailValid && password.length > 0 && !isSubmitting

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
    setMessage('')
    setError('')
    try{
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await readResponsePayload(res)
      if(!res.ok){
        setError(json?.error || 'Login failed')
        return
      }
      setMessage(`Welcome back, ${json?.data?.fullName || 'reader'}!`)
      setTimeout(() => {
        window.location.href = '/account'
      }, 400)
    }catch{
      setError('Network error. Please try again.')
    }finally{
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-12">
      <h1 className="font-serif text-4xl mb-3">Log in</h1>
      <p className="text-gray-600 mb-8">Access your AfriDigest account.</p>

      <form className="search-panel" onSubmit={onSubmit} aria-busy={isSubmitting}>
        <div className="search-field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required aria-invalid={email.length > 0 && !isEmailValid} /></div>
        <div className="search-field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
        <div className="search-actions"><button className="btn btn-primary" type="submit" disabled={!canSubmit} aria-busy={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Log in'}</button></div>
      </form>

      {message ? <p className="mt-4 text-green-700">{message}</p> : null}
      {error ? <p className="mt-4 text-red-700">{error}</p> : null}
      <p className="mt-4"><Link href="/forgot-password">Forgot password?</Link></p>
    </div>
  )
}
