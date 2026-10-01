import {useEffect,useState} from 'react'
import {Link,useParams} from 'react-router-dom'
import {sb} from '../lib'
export default function Category(){
 const {slug}=useParams(),[cat,setCat]=useState(null),[items,setItems]=useState(null)
 useEffect(()=>{setItems(null);(async()=>{
  const {data:c}=await sb.from('categories').select('*').eq('slug',slug).single();setCat(c)
  if(c){const {data}=await sb.from('products').select('*').eq('category_id',c.id).eq('hidden',false).order('created_at',{ascending:false});setItems(data||[])}else setItems([])})()},[slug])
 return <div className="max-w-7xl mx-auto px-4 py-10">
  <Link to="/" className="text-sm text-zinc-400 hover:text-white">← Back</Link>
  <h1 className="text-4xl font-black uppercase mt-3 mb-8">{cat?.name}</h1>
  {items&&!items.length&&<p className="text-zinc-400">No products yet.</p>}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
   {(items||[]).map(p=><Link key={p.id} to={`/p/${p.id}`} className="group rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-red-600/50 transition-all">
    <div className="aspect-[4/3] overflow-hidden bg-zinc-800"><img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/></div>
    <div className="p-4"><h3 className="font-bold">{p.name}</h3><p className="text-red-500 font-semibold mt-1">{p.price}</p></div></Link>)}
  </div></div>
}
