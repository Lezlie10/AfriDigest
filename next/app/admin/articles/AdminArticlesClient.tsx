'use client'

import React, { useMemo, useState } from 'react'

type Option = { id: number; name: string; slug: string }

type Props = {
  authors: Option[]
  categories: Option[]
}

export default function AdminArticlesClient({ authors, categories }: Props){
  const [token, setToken] = useState('')
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('<p></p>')
  const [heroImage, setHeroImage] = useState('')
  const [authorId, setAuthorId] = useState(String(authors[0]?.id || ''))
  const [categoryId, setCategoryId] = useState(String(categories[0]?.id || ''))
  const [tags, setTags] = useState('')
  const [readingTime, setReadingTime] = useState('6')
  const [metaDescription, setMetaDescription] = useState('')
  const [exclusive, setExclusive] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadError, setUploadError] = useState('')

  const normalizedSlug = useMemo(() => {
    return (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
  }, [slug, title])

  async function onImageFileChange(e: React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0]
    if(!file) return

    setUploadStatus('')
    setUploadError('')

    if(!token.trim()){
      setUploadError('Enter admin token before uploading images.')
      e.currentTarget.value = ''
      return
    }

    setIsUploadingImage(true)
    try{
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('Failed to read image file'))
        reader.readAsDataURL(file)
      })

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          fileName: file.name,
          dataUrl,
        }),
      })

      const json = await res.json()
      if(!res.ok) throw new Error(json?.error || 'Failed to upload image')

      setHeroImage(json?.data?.url || '')
      setUploadStatus('Image uploaded and attached to this article.')
    }catch(err: any){
      setUploadError(err?.message || 'Image upload failed')
    }finally{
      setIsUploadingImage(false)
      e.currentTarget.value = ''
    }
  }

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    if(isSubmitting || !token.trim() || !title.trim() || !excerpt.trim()) return
    setIsSubmitting(true)
    setStatus('')
    setError('')

    try{
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          article: {
            slug: normalizedSlug,
            title,
            excerpt,
            body,
            heroImage,
            authorId: Number(authorId),
            categoryIds: [Number(categoryId)],
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            publishDate: new Date().toISOString(),
            readingTime: Number(readingTime || 5),
            metaDescription: metaDescription || excerpt,
            exclusive,
          },
        }),
      })

      const json = await res.json()
      if(!res.ok) throw new Error(json?.error || 'Failed to save article')
      setStatus(`Saved: ${json.data.title}`)
      setError('')
    }catch(err: any){
      setError(err?.message || 'Failed to save article')
      setStatus('')
    }finally{
      setIsSubmitting(false)
    }
  }

  const canSubmit = !isSubmitting && token.trim().length > 0 && title.trim().length > 0 && excerpt.trim().length > 0

  return (
    <div className="container py-12">
      <h1 className="font-serif text-4xl mb-3">Admin — New Article</h1>
      <p className="text-gray-600 mb-8">Create and publish exclusive or standard stories.</p>

      <form className="search-panel" onSubmit={onSubmit} aria-busy={isSubmitting}>
        <div className="search-field">
          <label>Admin token</label>
          <input value={token} onChange={e=>setToken(e.target.value)} placeholder="dev-admin-token" />
        </div>
        <div className="search-field">
          <label>Title</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} required />
        </div>
        <div className="search-field">
          <label>Slug</label>
          <input value={slug} onChange={e=>setSlug(e.target.value)} placeholder={normalizedSlug} />
        </div>
        <div className="search-field">
          <label>Excerpt</label>
          <input value={excerpt} onChange={e=>setExcerpt(e.target.value)} required />
        </div>
        <div className="search-field">
          <label>Body (HTML)</label>
          <textarea value={body} onChange={e=>setBody(e.target.value)} rows={10} placeholder="<p>Write the full article body here...</p>" />
        </div>
        <div className="search-field">
          <label>Hero image URL</label>
          <input value={heroImage} onChange={e=>setHeroImage(e.target.value)} />
        </div>
        <div className="search-field">
          <label>Upload image</label>
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onImageFileChange} disabled={isUploadingImage} />
        </div>
        <div className="search-field">
          <label>Author</label>
          <select value={authorId} onChange={e=>setAuthorId(e.target.value)}>
            {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="search-field">
          <label>Category</label>
          <select value={categoryId} onChange={e=>setCategoryId(e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="search-field">
          <label>Tags (comma-separated)</label>
          <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="africa,policy,exclusive" />
        </div>
        <div className="search-field">
          <label>Reading time (min)</label>
          <input type="number" min={1} value={readingTime} onChange={e=>setReadingTime(e.target.value)} />
        </div>
        <div className="search-field">
          <label>Meta description</label>
          <input value={metaDescription} onChange={e=>setMetaDescription(e.target.value)} />
        </div>
        <div className="search-field" style={{ justifyContent: 'flex-end' }}>
          <label>
            <input type="checkbox" checked={exclusive} onChange={e=>setExclusive(e.target.checked)} /> Exclusive article
          </label>
        </div>
        <div className="search-actions">
          <button className="btn btn-primary" type="submit" disabled={!canSubmit}>
            {isSubmitting ? 'Publishing...' : 'Publish Article'}
          </button>
        </div>
      </form>

      {status ? <p className="mt-4 text-green-700">{status}</p> : null}
      {error ? <p className="mt-4 text-red-700">{error}</p> : null}
      {uploadStatus ? <p className="mt-2 text-green-700">{uploadStatus}</p> : null}
      {uploadError ? <p className="mt-2 text-red-700">{uploadError}</p> : null}
      {heroImage ? (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Hero image preview</p>
          <img src={heroImage} alt="Hero preview" style={{ maxWidth: '340px', borderRadius: '10px', border: '1px solid rgba(15,23,42,0.08)' }} />
        </div>
      ) : null}
    </div>
  )
}
