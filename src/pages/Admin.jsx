import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { sb } from '../lib'
import Logo from '../components/home/Logo'
import useOrders, { beep, unlockAudio } from '../admin/useOrders'
import Overview from '../admin/Overview'
import Orders from '../admin/Orders'
import Products from '../admin/Products'
import Categories from '../admin/Categories'
import '../home.css'
import '../admin/admin.css'

export default function Admin() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    document.title = 'MotoHub Admin'
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data: l } = sb.auth.onAuthStateChange((_, s) => setSession(s))
    return () => l.subscription.unsubscribe()
  }, [])

  if (!ready) return null
  return <div className="adm mh-home">{session ? <Panel /> : <Login />}</div>
}

function Login() {
  const [e, setE] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const go = async (ev) => {
    ev.preventDefault()
    setBusy(true); setErr('')
    const { error } = await sb.auth.signInWithPassword({ email: e, password: p })
    if (error) setErr(error.message)
    setBusy(false)
  }
  return (
    <div className="adm-login">
      <form className="adm-login__card" onSubmit={go}>
        <Logo />
        <h1>Dashboard login</h1>
        <div className="adm-field"><label>Email</label><input className="adm-input" type="email" value={e} onChange={(x) => setE(x.target.value)} autoComplete="username" autoFocus /></div>
        <div className="adm-field"><label>Password</label><input className="adm-input" type="password" value={p} onChange={(x) => setP(x.target.value)} autoComplete="current-password" /></div>
        {err && <p className="adm-alert" role="alert">{err}</p>}
        <button className="adm-btn adm-btn--primary adm-btn--block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}

const NAV = [
  ['overview', 'Overview'],
  ['orders', 'Orders'],
  ['products', 'Products'],
  ['categories', 'Categories'],
]

function Panel() {
  const [tab, setTab] = useState(() => sessionStorage.getItem('adm_tab') || 'overview')
  const [cats, setCats] = useState([])
  const [prods, setProds] = useState([])
  const [toasts, setToasts] = useState([])
  const [sound, setSound] = useState(() => localStorage.getItem('adm_sound') !== 'off')
  const [perm, setPerm] = useState(() => ('Notification' in window ? Notification.permission : 'denied'))
  const soundRef = useRef(sound)
  soundRef.current = sound
  const tid = useRef(0)

  const go = (t) => { setTab(t); sessionStorage.setItem('adm_tab', t) }

  const notify = useCallback((msg, type = 'ok', ms = 3800) => {
    const id = ++tid.current
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms)
  }, [])

  const feed = useOrders((o) => {
    if (soundRef.current) beep()
    notify(`New order: ${o.product_name || 'product'} — ${o.customer_name}`, 'order', 9000)
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification('New order on MotoHub', { body: `${o.product_name || ''}\n${o.customer_name} · ${o.phone}` }) } catch { /* ignore */ }
    }
  })

  const reload = useCallback(async () => {
    const [c, p] = await Promise.all([
      sb.from('categories').select('*').order('sort'),
      sb.from('products').select('*').order('created_at', { ascending: false }),
    ])
    if (c.error) notify(c.error.message, 'err')
    if (p.error) notify(p.error.message, 'err')
    setCats(c.data || []); setProds(p.data || [])
  }, [notify])

  useEffect(() => { reload() }, [reload])
  useEffect(() => {
    document.addEventListener('pointerdown', unlockAudio, { once: true })
    return () => document.removeEventListener('pointerdown', unlockAudio)
  }, [])

  const newCount = feed.orders.filter((o) => (o.status || 'new') === 'new').length
  useEffect(() => { document.title = newCount ? `(${newCount}) New orders — MotoHub Admin` : 'MotoHub Admin' }, [newCount])

  const toggleSound = () => {
    const next = !sound
    setSound(next); localStorage.setItem('adm_sound', next ? 'on' : 'off')
    if (next) beep()
  }
  const askPerm = async () => setPerm(await Notification.requestPermission())

  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <Link to="/" className="adm-side__logo" aria-label="Back to website"><Logo /></Link>
        <nav className="adm-nav" aria-label="Dashboard">
          {NAV.map(([k, l]) => (
            <button key={k} className={tab === k ? 'is-active' : ''} onClick={() => go(k)}>
              {l}
              {k === 'orders' && newCount > 0 && <b className="adm-badge">{newCount}</b>}
            </button>
          ))}
        </nav>
        <div className="adm-side__foot">
          <button className="adm-btn adm-btn--block" onClick={toggleSound}>{sound ? '🔔 Sound: on' : '🔕 Sound: off'}</button>
          {perm === 'default' && <button className="adm-btn adm-btn--block" onClick={askPerm}>Enable desktop alerts</button>}
          <Link className="adm-btn adm-btn--block" to="/">View website</Link>
          <button className="adm-btn adm-btn--ghost adm-btn--block" onClick={() => sb.auth.signOut()}>Log out</button>
        </div>
      </aside>

      <main className="adm-main">
        {tab === 'overview' && <Overview feed={feed} cats={cats} prods={prods} go={go} />}
        {tab === 'orders' && <Orders feed={feed} />}
        {tab === 'products' && <Products cats={cats} prods={prods} reload={reload} notify={notify} />}
        {tab === 'categories' && <Categories cats={cats} prods={prods} reload={reload} notify={notify} />}
      </main>

      <div className="adm-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`adm-toast adm-toast--${t.type}`} onClick={() => { if (t.type === 'order') go('orders') }}>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  )
}
