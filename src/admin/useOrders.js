import { useCallback, useEffect, useRef, useState } from 'react'
import { sb } from '../lib'

/* ---- sound: one shared AudioContext, unlocked by the first click inside the dashboard ---- */
let ctx
const getCtx = () => {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)() } catch { /* no audio */ } }
  return ctx
}
export function unlockAudio() { getCtx()?.resume?.() }
export function beep() {
  const c = getCtx()
  if (!c) return
  c.resume?.()
  ;[880, 1175, 1480].forEach((freq, i) => {
    const o = c.createOscillator(), g = c.createGain()
    o.type = 'sine'; o.frequency.value = freq
    o.connect(g); g.connect(c.destination)
    const t = c.currentTime + i * 0.16
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
    o.start(t); o.stop(t + 0.17)
  })
}

/*
 * Orders feed: initial load + Supabase realtime (instant) + 30s polling fallback
 * (in case Realtime is not enabled for the table). `onNew(order)` fires for every new order.
 */
export default function useOrders(onNew) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const seen = useRef(new Set())
  const first = useRef(true)
  const cb = useRef(onNew)
  cb.current = onNew

  const merge = useCallback((rows) => {
    const fresh = rows.filter((o) => !seen.current.has(o.id))
    fresh.forEach((o) => seen.current.add(o.id))
    setOrders((cur) => {
      const map = new Map(cur.map((o) => [o.id, o]))
      rows.forEach((o) => map.set(o.id, o))
      return [...map.values()].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    })
    if (!first.current) fresh.forEach((o) => cb.current?.(o))
  }, [])

  const load = useCallback(async () => {
    const { data, error: e } = await sb.from('orders').select('*').order('created_at', { ascending: false }).limit(500)
    if (e) setError(e.message)
    else { setError(''); merge(data || []) }
    first.current = false
    setLoading(false)
  }, [merge])

  useEffect(() => {
    load()
    const ch = sb
      .channel('orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (p) => {
        if (p.eventType === 'DELETE') {
          setOrders((cur) => cur.filter((o) => o.id !== p.old.id))
        } else merge([p.new])
      })
      .subscribe()
    const poll = setInterval(async () => {
      const { data } = await sb.from('orders').select('*').order('created_at', { ascending: false }).limit(50)
      if (data) merge(data)
    }, 30000)
    return () => { sb.removeChannel(ch); clearInterval(poll) }
  }, [load, merge])

  const setStatus = async (id, status) => {
    setOrders((cur) => cur.map((o) => (o.id === id ? { ...o, status } : o)))
    const { error: e } = await sb.from('orders').update({ status }).eq('id', id)
    if (e) { setError(e.message); load() }
  }
  const remove = async (id) => {
    setOrders((cur) => cur.filter((o) => o.id !== id))
    const { error: e } = await sb.from('orders').delete().eq('id', id)
    if (e) { setError(e.message); load() }
  }

  return { orders, loading, error, setStatus, remove, reload: load }
}
