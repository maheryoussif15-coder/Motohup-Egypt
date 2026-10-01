import {useEffect,useState} from 'react'
import {Link,useParams} from 'react-router-dom'
import {sb,wa} from '../lib'
export default function Product(){
 const {id}=useParams(),[p,setP]=useState(null),[i,setI]=useState(0)
 useEffect(()=>{sb.from('products').select('*,categories(name,slug)').eq('id',id).single().then(({data})=>setP(data))},[id])
 if(!p)return <p className="p-10 text-zinc-400">Loading...</p>
 const specs=(p.specs||'').split('\n').filter(Boolean).map(l=>{const k=l.indexOf(':');return k<0?[l,'']:[l.slice(0,k),l.slice(k+1)]})
 const msg=`Hello, I'm interested in: ${p.name}${p.price?' ('+p.price+')':''}\n${window.location.href}`
 return <div className="max-w-7xl mx-auto px-4 py-10">
  {p.categories&&<Link to={`/c/${p.categories.slug}`} className="text-sm text-zinc-400 hover:text-white">← {p.categories.name}</Link>}
  <div className="grid md:grid-cols-2 gap-8 mt-4">
   <div><div className="aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800"><img src={p.images?.[i]} alt={p.name} className="w-full h-full object-cover"/></div>
    <div className="flex gap-2 mt-3 overflow-x-auto">{(p.images||[]).map((u,n)=><img key={n} src={u} onClick={()=>setI(n)} className={`h-16 w-20 object-cover rounded-md cursor-pointer border-2 ${n===i?'border-red-600':'border-zinc-800'}`}/>)}</div></div>
   <div><h1 className="text-3xl md:text-4xl font-black uppercase">{p.name}</h1>
    <p className="text-2xl text-red-500 font-bold mt-2">{p.price}</p>
    {p.description&&<p className="text-zinc-300 mt-4 whitespace-pre-line">{p.description}</p>}
    {specs.length>0&&<div className="mt-6 rounded-xl border border-zinc-800 divide-y divide-zinc-800">{specs.map(([k,v],n)=><div key={n} className="flex justify-between gap-4 p-3 text-sm"><span className="text-zinc-400">{k}</span><span className="font-semibold text-right">{v}</span></div>)}</div>}
    <a href={wa(msg)} target="_blank" rel="noreferrer" className="inline-flex mt-8 bg-green-500/10 border-2 border-green-500/50 hover:bg-green-500/20 text-green-400 font-bold uppercase tracking-wider px-6 py-4 rounded-xl">Order on WhatsApp</a></div>
  </div></div>
}
