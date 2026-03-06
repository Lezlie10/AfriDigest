'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function SignupClient(){
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEmailValid = /\S+@\S+\.\S+/.test(email)
  const isPhoneValid = phone.replace(/\D/g, '').length >= 7
  const isPasswordValid = password.length >= 8
  const canSubmit = fullName.trim().length > 1 && isEmailValid && isPhoneValid && isPasswordValid && !isSubmitting

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    if(!canSubmit) return
    setIsSubmitting(true)
    setMessage('')
    setError('')
    try{
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password }),
      })
      const json = await res.json()
      if(!res.ok){
        setError(json?.error || 'Signup failed')
        return
      }
      setMessage('Account created successfully. You can now log in.')
    }catch{
      setError('Network error. Please try again.')
    }finally{
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-12">
      <h1 className="font-serif text-4xl mb-3">Create account</h1>
      <p className="text-gray-600 mb-8">Sign up to access premium newsletters and personalized reading.</p>

      <form className="search-panel" onSubmit={onSubmit} aria-busy={isSubmitting}>
        <div className="search-field"><label>Full name</label><input value={fullName} onChange={e=>setFullName(e.target.value)} required /></div>
        <div className="search-field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required aria-invalid={email.length > 0 && !isEmailValid} /></div>
        <div className="search-field"><label>Phone number</label><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} required aria-invalid={phone.length > 0 && !isPhoneValid} /></div>
        <div className="search-field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required aria-invalid={password.length > 0 && !isPasswordValid} /></div>
        <div className="search-actions"><button className="btn btn-primary" type="submit" disabled={!canSubmit} aria-busy={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create account'}</button></div>
      </form>

      {!isEmailValid && email.length > 0 ? <p className="mt-2 text-amber-700">Enter a valid email address.</p> : null}
      {!isPhoneValid && phone.length > 0 ? <p className="mt-2 text-amber-700">Enter a valid phone number.</p> : null}
      {!isPasswordValid && password.length > 0 ? <p className="mt-2 text-amber-700">Password must be at least 8 characters.</p> : null}

      {message ? <p className="mt-4 text-green-700">{message} <Link href="/login">Log in</Link></p> : null}
      {error ? <p className="mt-4 text-red-700">{error}</p> : null}
    </div>
  )
}
