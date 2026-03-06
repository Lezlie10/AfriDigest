"use client"
import React, { useEffect, useState } from 'react'
import ArticleCard from './ArticleCard'

export default function ArticleListClient(){
  const [items, setItems] = useState<any[]>([])

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try{
        const res = await fetch('/api/articles')
        const json = await res.json()
        if(mounted) setItems(json.data || [])
      }catch(e){
        // ignore
      }
    })()
    return ()=>{ mounted = false }
  },[])

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {items.length === 0 && <div className="text-gray-500">No articles found.</div>}
      {items.map(a => (
        <ArticleCard key={a.id} article={a} />
      ))}
    </div>
  )
}
