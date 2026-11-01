import { useEffect, useRef, useState } from 'react'
import { sb, wa } from '../../lib'

const PHONE_RE = /^[+\d][\d\s-]{6,17}$/

/*
 * "Order now" form. Saves the order in Supabase (the dashboard gets it instantly)
 * and offers a WhatsApp follow-up once it is sent.
 */
export default function OrderModal({ product, onClose }) {
  const [f, setF] = useState({ customer_name: '', phone: '', city: '', address: '', note: '', website: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const first = useRef(null)

  useEffect(() => {
    first.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setErr('')
    if (f.website) return setDone(true) // honeypot: bots fill the hidden field
    if (!f.customer_name.trim()) return setErr('Please enter your name.')
    if (!PHONE_RE.test(f.phone.trim())) return setErr('Please enter a valid phone number.')
    const last = Number(localStorage.getItem('mh_last_order') || 0)
    if (Date.now() - last < 20000) return setErr('Please wait a few seconds before sending another order.')

    setBusy(true)
    const { error } = await sb.from('orders').insert({
      product_id: product.id,
      product_name: product.name,
      product_price: product.price || '',
      customer_name: f.customer_name.trim(),
      phone: f.phone.trim(),
      city: f.city.trim(),
      address: f.address.trim(),
      note: f.note.trim(),
    })
    setBusy(false)
    if (error) return setErr('Could not send your order. Please try again or contact us on WhatsApp.')
    localStorage.setItem('mh_last_order', String(Date.now()))
    setDone(true)
  }

  const waMsg = `Hello MOTO HUB, I just placed an order for: ${product.name}${product.price ? ' (' + product.price + ')' : ''}\nName: ${f.customer_name}\nPhone: ${f.phone}`

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="order-title" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal__box">
        <button className="modal__x" onClick={onClose} aria-label="Close">×</button>

        {done ? (
          <div className="modal__done">
            <div className="modal__check" aria-hidden="true">✓</div>
            <h2 id="order-title">Order received</h2>
            <p>Thanks {f.customer_name || 'for your order'}! Our team will call you shortly to confirm the details.</p>
            <div className="modal__actions">
              <a className="btn btn--primary btn--sm" href={wa(waMsg)} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
              <button className="btn btn--ghost btn--sm" onClick={onClose}>Close</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h2 id="order-title">Order this product</h2>
            <p className="modal__product"><b>{product.name}</b>{product.price && <span>{product.price}</span>}</p>

            <label className="field"><span>Full name *</span>
              <input ref={first} value={f.customer_name} onChange={set('customer_name')} autoComplete="name" /></label>
            <label className="field"><span>Phone number *</span>
              <input value={f.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="01xxxxxxxxx" /></label>
            <div className="field-row">
              <label className="field"><span>City</span>
                <input value={f.city} onChange={set('city')} autoComplete="address-level2" /></label>
              <label className="field"><span>Address</span>
                <input value={f.address} onChange={set('address')} autoComplete="street-address" /></label>
            </div>
            <label className="field"><span>Notes (optional)</span>
              <textarea rows={2} value={f.note} onChange={set('note')} /></label>

            {/* honeypot */}
            <input className="visually-hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')} name="website" />

            {err && <p className="form-err" role="alert">{err}</p>}
            <button className="btn btn--primary btn--block" disabled={busy}>{busy ? 'Sending…' : 'Send order'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
