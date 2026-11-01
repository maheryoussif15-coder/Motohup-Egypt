import { useState } from 'react'
import { timeAgo, fullDate } from './ui'

const STATUSES = [
  ['new', 'New'],
  ['confirmed', 'Confirmed'],
  ['delivered', 'Delivered'],
  ['cancelled', 'Cancelled'],
]
const waLink = (phone, name, product) => {
  let n = String(phone).replace(/[^\d]/g, '')
  if (n.startsWith('0')) n = '2' + n // Egyptian local format 01xxxxxxxxx -> 201xxxxxxxxx
  return `https://wa.me/${n}?text=${encodeURIComponent(`Hello ${name}, this is MOTO HUB about your order: ${product}`)}`
}

export default function Orders({ feed }) {
  const { orders, loading, error, setStatus, remove } = feed
  const [f, setF] = useState('all')
  const [q, setQ] = useState('')
  const count = (k) => (k === 'all' ? orders.length : orders.filter((o) => (o.status || 'new') === k).length)
  const list = orders
    .filter((o) => f === 'all' || (o.status || 'new') === f)
    .filter((o) => {
      const t = q.trim().toLowerCase()
      return !t || [o.customer_name, o.phone, o.product_name, o.city].some((v) => (v || '').toLowerCase().includes(t))
    })

  return (
    <>
      <header className="adm-head">
        <div><h1>Orders</h1><p>Every order placed on the website shows up here instantly.</p></div>
        <input className="adm-input adm-search" placeholder="Search name, phone, product…" value={q} onChange={(e) => setQ(e.target.value)} />
      </header>

      {error && <p className="adm-alert">Could not load orders: {error}. Did you run <code>supabase-update.sql</code>?</p>}

      <div className="adm-chips" role="group" aria-label="Filter orders by status">
        {[['all', 'All'], ...STATUSES].map(([k, l]) => (
          <button key={k} className={f === k ? 'is-active' : ''} onClick={() => setF(k)}>
            {l} <b>{count(k)}</b>
          </button>
        ))}
      </div>

      {loading && <p className="adm-muted">Loading orders…</p>}
      {!loading && !list.length && (
        <div className="adm-empty"><h3>No orders here</h3><p>New orders from the website will appear automatically.</p></div>
      )}

      <div className="adm-orders">
        {list.map((o) => {
          const st = o.status || 'new'
          return (
            <article key={o.id} className={`adm-order is-${st}`}>
              <div className="adm-order__top">
                <span className={`adm-pill adm-pill--${st}`}>{STATUSES.find(([k]) => k === st)?.[1]}</span>
                <time title={fullDate(o.created_at)}>{timeAgo(o.created_at)} · {fullDate(o.created_at)}</time>
              </div>
              <div className="adm-order__grid">
                <div>
                  <small>Product</small>
                  <strong>{o.product_name || '—'}</strong>
                  {o.product_price && <span className="adm-order__price">{o.product_price}</span>}
                </div>
                <div>
                  <small>Customer</small>
                  <strong>{o.customer_name}</strong>
                  <span>{o.phone}</span>
                </div>
                <div>
                  <small>Delivery</small>
                  <strong>{o.city || '—'}</strong>
                  <span>{o.address}</span>
                </div>
                {o.note && <div className="adm-order__note"><small>Notes</small><span>{o.note}</span></div>}
              </div>
              <div className="adm-order__actions">
                <a className="adm-btn" href={`tel:${o.phone}`}>Call</a>
                <a className="adm-btn adm-btn--wa" href={waLink(o.phone, o.customer_name, o.product_name)} target="_blank" rel="noreferrer">WhatsApp</a>
                <select className="adm-input adm-select" value={st} onChange={(e) => setStatus(o.id, e.target.value)} aria-label="Order status">
                  {STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <button className="adm-btn adm-btn--danger" onClick={() => confirm('Delete this order?') && remove(o.id)}>Delete</button>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
