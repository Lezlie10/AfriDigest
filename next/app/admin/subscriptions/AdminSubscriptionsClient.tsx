'use client'

import React, { useState } from 'react'

type RequestItem = {
  id: number
  fullName: string
  email: string
  phone: string
  transferReference: string
  receiptUrl?: string
  amountNgn?: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedAt?: string
  reviewNote?: string
}

export default function AdminSubscriptionsClient(){
  const [token, setToken] = useState('')
  const [items, setItems] = useState<RequestItem[]>([])
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({})
  const [confirmedReceived, setConfirmedReceived] = useState<Record<number, boolean>>({})

  async function loadRequests(){
    if(!token.trim()) return
    setLoading(true)
    setError('')
    setStatus('')
    try{
      const params = new URLSearchParams({
        token,
        status: statusFilter,
        q: query,
        dateFrom,
        dateTo,
        sort,
      })
      const res = await fetch(`/api/admin/subscription-requests?${params.toString()}`)
      const json = await res.json()
      if(!res.ok) throw new Error(json?.error || 'Failed to load requests')
      setItems(json?.data || [])
      setStatus(`Loaded ${json?.data?.length || 0} request(s).`)
    }catch(err: any){
      setError(err?.message || 'Failed to load requests')
    }finally{
      setLoading(false)
    }
  }

  async function review(requestId: number, action: 'approve' | 'reject'){
    if(!token.trim()) return
    const note = String(reviewNotes[requestId] || '').trim()
    const confirmed = Boolean(confirmedReceived[requestId])

    if(action === 'approve' && !confirmed){
      setError('Confirm funds received before approving.')
      return
    }
    if(action === 'approve' && note.length < 8){
      setError('Add a verification note (min 8 characters) before approving.')
      return
    }

    setError('')
    setStatus('')
    try{
      const res = await fetch('/api/admin/subscription-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, requestId, action, reviewNote: note }),
      })
      const json = await res.json()
      if(!res.ok) throw new Error(json?.error || 'Review action failed')
      setStatus(`Request ${requestId} ${action}d.`)
      setItems(prev => prev.filter(item => item.id !== requestId))
    }catch(err: any){
      setError(err?.message || 'Review action failed')
    }
  }

  return (
    <div className="container py-12">
      <h1 className="font-serif text-4xl mb-3">Admin — Manual Subscriptions</h1>
      <p className="text-gray-600 mb-8">Review bank-transfer requests and activate paid access.</p>

      <div className="search-panel">
        <div className="search-field">
          <label>Admin token</label>
          <input value={token} onChange={e=>setToken(e.target.value)} placeholder="dev-admin-token" />
        </div>
        <div className="search-actions">
          <button className="btn btn-primary" type="button" onClick={loadRequests} disabled={!token.trim() || loading}>
            {loading ? 'Loading...' : 'Load Requests'}
          </button>
        </div>
      </div>

      <div className="search-panel mt-4">
        <div className="search-field">
          <label>Status</label>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="search-field">
          <label>Search</label>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, email, or reference" />
        </div>
        <div className="search-field">
          <label>Date from</label>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
        </div>
        <div className="search-field">
          <label>Date to</label>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
        </div>
        <div className="search-field">
          <label>Sort</label>
          <select value={sort} onChange={e=>setSort(e.target.value as 'newest' | 'oldest')}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {status ? <p className="mt-4 text-green-700">{status}</p> : null}
      {error ? <p className="mt-4 text-red-700">{error}</p> : null}

      <div className="mt-8">
        {items.length === 0 ? <p className="text-gray-500">No pending requests.</p> : null}
        {items.map(item => (
          <article key={item.id} className="card mt-4">
            <div className="card-body">
              <h3 className="card-title">{item.fullName}</h3>
              <p className="card-excerpt">{item.email} · {item.phone}</p>
              <p className="text-sm text-gray-700 mt-2">Transfer Ref: <strong>{item.transferReference}</strong></p>
              {item.receiptUrl ? (
                <p className="text-sm text-gray-700 mt-2">
                  Receipt: <a href={item.receiptUrl} target="_blank" rel="noreferrer" className="underline">Open proof</a>
                </p>
              ) : null}
              <p className="text-sm text-gray-700">Amount: {item.amountNgn ? `NGN ${item.amountNgn.toLocaleString()}` : 'Not provided'}</p>
              <p className="text-sm text-gray-500">Submitted: {new Date(item.createdAt).toLocaleString()}</p>
              {item.status === 'pending' ? (
                <>
                  <div className="search-field mt-4">
                    <label>Verification note</label>
                    <textarea
                      value={reviewNotes[item.id] || ''}
                      onChange={e => setReviewNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder="E.g. Confirmed GTBank credit alert and account ledger update"
                      rows={3}
                    />
                  </div>
                  <label className="text-sm text-gray-700 mt-3" style={{ display: 'block' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(confirmedReceived[item.id])}
                      onChange={e => setConfirmedReceived(prev => ({ ...prev, [item.id]: e.target.checked }))}
                      style={{ marginRight: '8px' }}
                    />
                    I confirm money has entered the bank account.
                  </label>
                  <div className="hero-actions mt-4">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={()=>review(item.id, 'approve')}
                      disabled={!confirmedReceived[item.id] || String(reviewNotes[item.id] || '').trim().length < 8}
                    >
                      Approve
                    </button>
                    <button className="btn btn-outline" type="button" onClick={()=>review(item.id, 'reject')}>Reject</button>
                  </div>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
