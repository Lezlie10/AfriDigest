'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function AccountClient(){
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(()=>{
    ;(async ()=>{
      const res = await fetch('/api/auth/me')
      const json = await res.json()
      if(res.ok) setUser(json.data)
      else setError('Please log in to view your account.')
    })()
  },[])

  async function onChangePassword(e: React.FormEvent){
    e.preventDefault()
    if(newPassword.length < 8 || isSaving) return
    setIsSaving(true)
    setError('')
    setMessage('')
    try{
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const json = await res.json()
      if(!res.ok){
        setError(json?.error || 'Failed to update password')
        return
      }
      setMessage('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
    }catch{
      setError('Network error. Please try again.')
    }finally{
      setIsSaving(false)
    }
  }

  async function onLogout(){
    if(isLoggingOut) return
    setIsLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setMessage('Logged out successfully.')
    setIsLoggingOut(false)
  }

  return (
    <div className="container py-12">
      <h1 className="font-serif text-4xl mb-3">My Account</h1>

      {user ? (
        <div className="mb-8 text-gray-700">
          <p><strong>Name:</strong> {user.fullName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
          <p><strong>Subscription:</strong> {user.subscriptionStatus === 'active' ? `Active${user.subscriptionPlan ? ` (${user.subscriptionPlan})` : ''}` : 'Inactive'}</p>
          {user.subscriptionStartedAt ? <p><strong>Started:</strong> {new Date(user.subscriptionStartedAt).toLocaleDateString()}</p> : null}
          {user.subscriptionStatus !== 'active' ? <p className="mt-2"><Link href="/subscribe">Upgrade to paid subscription</Link></p> : null}
        </div>
      ) : null}

      {user ? (
        <form className="search-panel" onSubmit={onChangePassword} aria-busy={isSaving}>
          <div className="search-field"><label>Current password</label><input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required /></div>
          <div className="search-field"><label>New password</label><input type="password" minLength={8} value={newPassword} onChange={e=>setNewPassword(e.target.value)} required /></div>
          <div className="search-actions"><button className="btn btn-primary" type="submit" disabled={isSaving || newPassword.length < 8} aria-busy={isSaving}>{isSaving ? 'Saving...' : 'Change password'}</button></div>
        </form>
      ) : null}

      {user ? <button className="btn btn-outline mt-5" onClick={onLogout} disabled={isLoggingOut} aria-busy={isLoggingOut}>{isLoggingOut ? 'Logging out...' : 'Log out'}</button> : null}

      {message ? <p className="mt-4 text-green-700">{message}</p> : null}
      {error ? <p className="mt-4 text-red-700">{error}</p> : null}
    </div>
  )
}
