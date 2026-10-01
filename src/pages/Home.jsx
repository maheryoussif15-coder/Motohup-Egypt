import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {sb} from '../lib'
const IMG='https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop'
export default function Home(){
 const [cats,setCats]=useState([])
 useEffect(()=>{sb.from('categories').select('*').order('sort').then(({data})=>setCats(data||[]))},[])
 return <>
  <section className="relative h-[80vh] min-h-[500px] overflow-hidden"><div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:`url('${IMG}')`}}/><div className="absolute inset-0 bg-black/60"/>
   <div className="relative z-10 h-full flex items-center"><div className="max-w-7xl mx-auto px-4 w-full">
    <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight">YOUR RIDE.<br/>YOUR <span className="text-red-600">CHOICE.</span></h1>
    <p className="mt-6 text-lg md:text-xl text-zinc-300 max-w-xl font-medium">Explore the Best in Motorcycles, ATV, UTV, and Marine.</p>
    <a href="#cats" className="inline-flex mt-8 bg-red-600 hover:bg-red-700 font-bold uppercase tracking-wider px-8 py-4 rounded-lg">View All Models</a></div></div></section>
  <section id="cats" className="py-16"><div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
   {cats.map(c=><Link key={c.id} to={`/c/${c.slug}`} className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-red-600/50 transition-all">
    <div className="aspect-[3/4] overflow-hidden"><img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/></div>
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"/>
    <div className="absolute bottom-0 left-0 right-0 p-5"><h3 className="text-2xl font-black uppercase tracking-wide mb-3">{c.name}</h3><span className="inline-flex bg-red-600 group-hover:bg-red-700 font-bold uppercase text-xs px-4 py-2 rounded-md">Shop Now →</span></div></Link>)}
  </div></section></>
}
