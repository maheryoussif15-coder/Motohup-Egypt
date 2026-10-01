import {useEffect,useState} from 'react'
import {sb} from '../lib'
const inp='w-full bg-zinc-800 rounded-md p-2 text-sm'
const btn='bg-red-600 hover:bg-red-700 font-bold text-sm px-4 py-2 rounded-md'
async function up(files){const out=[];for(const f of files){const n=Date.now()+'-'+f.name.replace(/[^\w.]/g,'');const {error}=await sb.storage.from('images').upload(n,f);if(error)alert(error.message);else out.push(sb.storage.from('images').getPublicUrl(n).data.publicUrl)}return out}
export default function Admin(){
 const [s,setS]=useState(null),[ok,setOk]=useState(false)
 useEffect(()=>{sb.auth.getSession().then(({data})=>{setS(data.session);setOk(true)});const {data:l}=sb.auth.onAuthStateChange((_,x)=>setS(x));return()=>l.subscription.unsubscribe()},[])
 if(!ok)return null
 return s?<Panel/>:<Login/>
}
function Login(){
 const [e,setE]=useState(''),[p,setP]=useState('')
 const go=async()=>{const {error}=await sb.auth.signInWithPassword({email:e,password:p});if(error)alert(error.message)}
 return <div className="max-w-sm mx-auto p-6 mt-16 space-y-3"><h1 className="text-2xl font-black">Admin</h1>
  <input className={inp} placeholder="Email" value={e} onChange={x=>setE(x.target.value)}/>
  <input className={inp} type="password" placeholder="Password" value={p} onChange={x=>setP(x.target.value)}/>
  <button className={btn} onClick={go}>Login</button></div>
}
function Panel(){
 const [cats,setCats]=useState([]),[prods,setProds]=useState([]),[tab,setTab]=useState('p'),[f,setF]=useState({}),[files,setFiles]=useState([]),[busy,setBusy]=useState(false)
 const load=async()=>{setCats((await sb.from('categories').select('*').order('sort')).data||[]);setProds((await sb.from('products').select('*').order('created_at',{ascending:false})).data||[])}
 useEffect(()=>{load()},[])
 const reset=()=>{setF({});setFiles([])}
 const saveCat=async()=>{if(!f.name)return;setBusy(true);const u=await up(files);const row={name:f.name,slug:f.name.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-'),image:u[0]||f.image,sort:Number(f.sort)||0}
  const r=f.id?await sb.from('categories').update(row).eq('id',f.id):await sb.from('categories').insert(row);if(r.error)alert(r.error.message);setBusy(false);reset();load()}
 const saveProd=async()=>{if(!f.name||!f.category_id)return alert('Name and category required');setBusy(true);const u=await up(files)
  const row={name:f.name,category_id:f.category_id,price:f.price||'',description:f.description||'',specs:f.specs||'',hidden:!!f.hidden,images:[...(f.images||[]),...u]}
  const r=f.id?await sb.from('products').update(row).eq('id',f.id):await sb.from('products').insert(row);if(r.error)alert(r.error.message);setBusy(false);reset();load()}
 const del=async(t,id)=>{if(confirm('Delete?')){await sb.from(t).delete().eq('id',id);load()}}
 const set=k=>e=>setF({...f,[k]:e.target.value})
 const Pick=<input type="file" accept="image/*" multiple={tab==='p'} onChange={e=>setFiles([...e.target.files])} className="text-sm"/>
 return <div className="max-w-5xl mx-auto p-4 space-y-6">
  <div className="flex justify-between items-center"><div className="flex gap-2">{[['p','Products'],['c','Categories']].map(([k,l])=><button key={k} onClick={()=>{setTab(k);reset()}} className={`px-4 py-2 rounded-md text-sm font-bold ${tab===k?'bg-red-600':'bg-zinc-800'}`}>{l}</button>)}</div><button className="text-sm text-zinc-400" onClick={()=>sb.auth.signOut()}>Logout</button></div>
  {tab==='c'?<>
   <div className="bg-zinc-900 p-4 rounded-xl space-y-2"><h2 className="font-bold">{f.id?'Edit':'New'} category</h2>
    <input className={inp} placeholder="Name (e.g. ATV)" value={f.name||''} onChange={set('name')}/><input className={inp} placeholder="Order (0,1,2...)" value={f.sort??''} onChange={set('sort')}/>{Pick}
    <div className="flex gap-2"><button disabled={busy} className={btn} onClick={saveCat}>{busy?'Saving...':'Save'}</button>{f.id&&<button className="text-sm" onClick={reset}>Cancel</button>}</div></div>
   {cats.map(c=><div key={c.id} className="flex items-center gap-3 bg-zinc-900 p-3 rounded-xl"><img src={c.image} className="w-16 h-12 object-cover rounded"/><span className="flex-1 font-semibold">{c.name}</span><button className="text-sm text-zinc-300" onClick={()=>setF(c)}>Edit</button><button className="text-sm text-red-500" onClick={()=>del('categories',c.id)}>Delete</button></div>)}
  </>:<>
   <div className="bg-zinc-900 p-4 rounded-xl space-y-2"><h2 className="font-bold">{f.id?'Edit':'New'} product</h2>
    <select className={inp} value={f.category_id||''} onChange={set('category_id')}><option value="">Category...</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
    <input className={inp} placeholder="Name" value={f.name||''} onChange={set('name')}/><input className={inp} placeholder="Price (e.g. 250,000 EGP)" value={f.price||''} onChange={set('price')}/>
    <textarea className={inp} rows={3} placeholder="Description" value={f.description||''} onChange={set('description')}/>
    <textarea className={inp} rows={4} placeholder={'Specs, one per line:\nEngine: 400cc\nTop speed: 110 km/h'} value={f.specs||''} onChange={set('specs')}/>
    {f.images?.length>0&&<div className="flex gap-2 flex-wrap">{f.images.map(u=><div key={u} className="relative"><img src={u} className="h-14 w-20 object-cover rounded"/><button className="absolute top-0 right-0 bg-black/70 px-1 text-xs" onClick={()=>setF({...f,images:f.images.filter(x=>x!==u)})}>x</button></div>)}</div>}
    {Pick}<label className="flex gap-2 text-sm"><input type="checkbox" checked={!!f.hidden} onChange={e=>setF({...f,hidden:e.target.checked})}/>Hidden</label>
    <div className="flex gap-2"><button disabled={busy} className={btn} onClick={saveProd}>{busy?'Saving...':'Save'}</button>{f.id&&<button className="text-sm" onClick={reset}>Cancel</button>}</div></div>
   {prods.map(p=><div key={p.id} className="flex items-center gap-3 bg-zinc-900 p-3 rounded-xl"><img src={p.images?.[0]} className="w-16 h-12 object-cover rounded"/><div className="flex-1"><p className="font-semibold">{p.name}{p.hidden&&' (hidden)'}</p><p className="text-xs text-zinc-400">{p.price}</p></div><button className="text-sm text-zinc-300" onClick={()=>{setF(p);scrollTo(0,0)}}>Edit</button><button className="text-sm text-red-500" onClick={()=>del('products',p.id)}>Delete</button></div>)}
  </>}
 </div>
}
