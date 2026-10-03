import {Link,Route,Routes,useLocation} from 'react-router-dom'
import Home from './pages/Home'
import Category from './pages/Category'
import Product from './pages/Product'
import Admin from './pages/Admin'
import {wa} from './lib'
export default function App(){
 const {pathname}=useLocation()
 const isHome=pathname==='/'
 // The home page ships its own navbar/footer, so the global chrome
 // only renders on the other routes (category, product, admin).
 return <div className="min-h-screen bg-black text-white font-sans">
  {!isHome && <header className="bg-black border-b border-zinc-800/60 sticky top-0 z-50"><div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
   <Link to="/" className="leading-tight"><span className="block text-xl font-black tracking-tight">MOTOHUB</span><span className="block text-[10px] font-bold text-red-600 tracking-[0.3em] uppercase">Egypt</span></Link>
   <a href={wa('Hello MotoHub')} target="_blank" rel="noreferrer" className="text-sm font-semibold uppercase tracking-wider text-green-400">WhatsApp</a>
  </div></header>}
  <main><Routes><Route path="/" element={<Home/>}/><Route path="/c/:slug" element={<Category/>}/><Route path="/p/:id" element={<Product/>}/><Route path="/admin" element={<Admin/>}/></Routes></main>
  {!isHome && <footer className="bg-zinc-950 border-t border-zinc-800/60 mt-16"><div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row justify-between gap-4 text-sm text-zinc-400">
   <p className="font-medium">eng/Hossam Abdelwhab</p><a href="tel:01061921764" className="font-semibold text-zinc-300">01061921764</a></div></footer>}
 </div>
}
