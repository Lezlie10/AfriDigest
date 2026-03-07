'use client'

import { useState } from 'react'

export default function ResetPasswordClient(){
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEmailValid = /\S+@\S+\.\S+/.test(email)
  const isCodeValid = code.trim().length >= 6
  const isPasswordValid = newPassword.length >= 8
  const canSubmit = isEmailValid && isCodeValid && isPasswordValid && !isSubmitting

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

    try{
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      })
      const json = await readResponsePayload(res)
      if(!res.ok){
        setError(json?.error || 'Failed to reset password')
        return
      }
      setMessage('Password updated successfully. You can now log in.')
    }catch{
      setError('Network error. Please try again.')
    }finally{
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-12">
      <h1 className="font-serif text-4xl mb-3">Reset Password</h1>
      <p className="text-gray-600 mb-8">Use the code sent to your email address.</p>

      <form className="search-panel" onSubmit={onSubmit} aria-busy={isSubmitting}>
        <div className="search-field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required aria-invalid={email.length > 0 && !isEmailValid} /></div>
        <div className="search-field"><label>Reset code</label><input value={code} onChange={e=>setCode(e.target.value)} required /></div>
        <div className="search-field"><label>New password</label><input type="password" minLength={8} value={newPassword} onChange={e=>setNewPassword(e.target.value)} required /></div>
        <div className="search-actions"><button className="btn btn-primary" type="submit" disabled={!canSubmit} aria-busy={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update password'}</button></div>
      </form>

      {message ? <p className="mt-4 text-green-700">{message}</p> : null}
      {error ? <p className="mt-4 text-red-700">{error}</p> : null}
    </div>
  )
}
