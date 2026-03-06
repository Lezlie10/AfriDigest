'use client'

import { useEffect, useState } from 'react'

type Props = {
  canceled?: boolean
}

export default function SubscribeClient({ canceled = false }: Props){
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [provider, setProvider] = useState<'manual' | 'paystack' | 'stripe' | 'none'>('none')
  const [transferReference, setTransferReference] = useState('')
  const [manualAmountNgn, setManualAmountNgn] = useState<number>(5000)
  const [manualBankName, setManualBankName] = useState('Your Bank')
  const [manualAccountName, setManualAccountName] = useState('AfriDigest Media')
  const [manualAccountNumber, setManualAccountNumber] = useState('0000000000')
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [receiptDataUrl, setReceiptDataUrl] = useState('')
  const [receiptName, setReceiptName] = useState('')
  const [receiptError, setReceiptError] = useState('')

  const isEmailValid = /\S+@\S+\.\S+/.test(email)
  const isPhoneValid = phone.replace(/\D/g, '').length >= 7
  const isManual = provider === 'manual'
  const canSubmit = fullName.trim().length > 1 && isEmailValid && isPhoneValid && (!isManual || (transferReference.trim().length > 2 && receiptDataUrl.length > 0)) && !isSubmitting

  async function onReceiptChange(file?: File){
    setReceiptError('')
    setReceiptDataUrl('')
    setReceiptName('')
    if(!file) return

    const allowed = ['image/png', 'image/jpeg', 'image/webp']
    if(!allowed.includes(file.type)){
      setReceiptError('Receipt must be PNG, JPG, or WEBP.')
      return
    }
    if(file.size > 2 * 1024 * 1024){
      setReceiptError('Receipt file size must be 2MB or less.')
      return
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Unable to read selected file'))
      reader.readAsDataURL(file)
    })

    setReceiptDataUrl(dataUrl)
    setReceiptName(file.name)
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try{
        const res = await fetch('/api/subscribe/options')
        const json = await res.json()
        if(!mounted) return
        const nextProvider = json?.data?.provider || 'none'
        setProvider(nextProvider)
        if(json?.data?.manual){
          setManualAmountNgn(Number(json.data.manual.amountNgn || 5000))
          setManualBankName(String(json.data.manual.bankName || 'Your Bank'))
          setManualAccountName(String(json.data.manual.accountName || 'AfriDigest Media'))
          setManualAccountNumber(String(json.data.manual.accountNumber || '0000000000'))
        }
      }catch{
        if(mounted) setProvider('none')
      }finally{
        if(mounted) setIsLoadingOptions(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    if(!canSubmit) return
    setIsSubmitting(true)
    setMessage('')
    setError('')
    try{
      const endpoint = isManual ? '/api/subscribe/manual-request' : '/api/subscribe'
      const payload = isManual
        ? { fullName, email, phone, transferReference, amountNgn: manualAmountNgn, receiptDataUrl }
        : { fullName, email, phone }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if(!res.ok){
        setError(json?.error || 'Subscription failed')
        return
      }
      if(isManual){
        if(json?.autoApproved){
          setMessage('Payment proof submitted and approved. Your premium access is now active.')
        }else{
          setMessage('Payment request submitted. We will review and activate your subscription shortly.')
        }
        return
      }
      const checkoutUrl = json?.data?.checkoutUrl
      if(!checkoutUrl){
        setError('Payment session created but no checkout URL was returned')
        return
      }
      window.location.href = checkoutUrl
    }catch{
      setError('Network error. Please try again.')
    }finally{
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-12">
      <h1 className="font-serif text-4xl mb-3">Subscribe</h1>
      <p className="text-gray-600 mb-2">Get exclusive stories and weekly briefing emails.</p>
      <p className="text-gray-700 mb-8"><strong>Premium plan:</strong> paid subscription.</p>

      {isLoadingOptions ? <p className="text-gray-500 mb-6">Loading payment options...</p> : null}

      {isManual ? (
        <div className="search-panel mb-6" aria-label="Bank transfer instructions">
          <div className="search-field">
            <label>Payment Method</label>
            <p className="text-gray-700">Manual bank transfer</p>
          </div>
          <div className="search-field">
            <label>Bank</label>
            <p className="text-gray-700">{manualBankName}</p>
          </div>
          <div className="search-field">
            <label>Account Name</label>
            <p className="text-gray-700">{manualAccountName}</p>
          </div>
          <div className="search-field">
            <label>Account Number</label>
            <p className="text-gray-700">{manualAccountNumber}</p>
          </div>
          <div className="search-field">
            <label>Amount</label>
            <p className="text-gray-700">NGN {manualAmountNgn.toLocaleString()}</p>
          </div>
        </div>
      ) : null}

      <form className="search-panel" onSubmit={onSubmit} aria-busy={isSubmitting}>
        <div className="search-field"><label>Full name</label><input value={fullName} onChange={e=>setFullName(e.target.value)} required /></div>
        <div className="search-field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required aria-invalid={email.length > 0 && !isEmailValid} /></div>
        <div className="search-field"><label>Phone</label><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} required aria-invalid={phone.length > 0 && !isPhoneValid} /></div>
        {isManual ? (
          <>
            <div className="search-field"><label>Transfer reference</label><input value={transferReference} onChange={e=>setTransferReference(e.target.value)} placeholder="Enter transaction reference" required /></div>
            <div className="search-field">
              <label>Upload transfer receipt</label>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{ void onReceiptChange(e.target.files?.[0]) }} required />
              {receiptName ? <p className="text-xs text-gray-600 mt-1">Selected: {receiptName}</p> : null}
              {receiptError ? <p className="text-xs text-red-700 mt-1">{receiptError}</p> : null}
            </div>
          </>
        ) : null}
        <div className="search-actions"><button className="btn btn-primary" type="submit" disabled={!canSubmit || isLoadingOptions} aria-busy={isSubmitting}>{isSubmitting ? (isManual ? 'Submitting...' : 'Redirecting to payment...') : (isManual ? 'Submit payment proof' : 'Continue to payment')}</button></div>
      </form>

      {canceled ? <p className="mt-4 text-amber-700">Payment was canceled. You can try again anytime.</p> : null}
      {message ? <p className="mt-4 text-green-700">{message}</p> : null}
      {error ? <p className="mt-4 text-red-700">{error}</p> : null}
    </div>
  )
}
