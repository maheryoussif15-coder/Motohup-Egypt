import { useEffect, useRef, useState } from 'react'
import { sb, CONDITIONS } from '../lib'
import { Switch, Seg, uploadFiles } from './ui'
import ImageFramer from './ImageFramer'

const EMPTY = { name: '', category_id: '', price: '', description: '', specs: '', condition: 'new', hidden: false }
const DEFAULT_STYLE = { fit: 'contain', x: 50, y: 50, zoom: 1 }

export default function Products({ cats, prods, reload, notify }) {
  const [q, setQ] = useState('')
  const [fc, setFc] = useState('all')
  const [fcond, setFcond] = useState('all')
  const [fvis, setFvis] = useState('all')
  const [editing, setEditing] = useState(null) // null | 'new' | product

  const catName = (id) => cats.find((c) => c.id === id)?.name || '—'
  const list = prods
    .filter((p) => fc === 'all' || p.category_id === fc)
    .filter((p) => fcond === 'all' || (p.condition || 'new') === fcond)
    .filter((p) => fvis === 'all' || (fvis === 'hidden' ? p.hidden : !p.hidden))
    .filter((p) => !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()))

  const toggle = async (p) => {
    const { error } = await sb.from('products').update({ hidden: !p.hidden }).eq('id', p.id)
    if (error) notify(error.message, 'err'); else { notify(p.hidden ? 'Product is now visible' : 'Product hidden from the site'); reload() }
  }
  const del = async (p) => {
    if (!confirm(`Delete "${p.name}" permanently?`)) return
    const { error } = await sb.from('products').delete().eq('id', p.id)
    if (error) notify(error.message, 'err'); else { notify('Product deleted'); reload() }
  }

  return (
    <>
      <header className="adm-head">
        <div><h1>Products</h1><p>{prods.length} products · {prods.filter((p) => p.hidden).length} hidden</p></div>
        <button className="adm-btn adm-btn--primary" onClick={() => setEditing('new')}>+ Add product</button>
      </header>

      <div className="adm-toolbar">
        <input className="adm-input adm-search" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="adm-input adm-select" value={fc} onChange={(e) => setFc(e.target.value)} aria-label="Category">
          <option value="all">All categories</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Seg label="Condition" value={fcond} onChange={setFcond} options={[['all', 'Any'], ['new', 'New'], ['used', 'Used']]} />
        <Seg label="Visibility" value={fvis} onChange={setFvis} options={[['all', 'All'], ['visible', 'Visible'], ['hidden', 'Hidden']]} />
      </div>

      {!list.length && <div className="adm-empty"><h3>No products found</h3><p>Change the filters or add a new product.</p></div>}

      <div className="adm-table">
        {list.map((p) => (
          <div className={`adm-prow${p.hidden ? ' is-off' : ''}`} key={p.id}>
            <div className="adm-thumb">{p.images?.[0] ? <img src={p.images[0]} alt="" loading="lazy" /> : <span>No photo</span>}</div>
            <div className="adm-prow__main">
              <strong>{p.name}</strong>
              <span>{catName(p.category_id)} · {p.price || 'No price'}</span>
            </div>
            <span className={`adm-pill adm-pill--${p.condition === 'used' ? 'used' : 'newc'}`}>{CONDITIONS[p.condition === 'used' ? 'used' : 'new']}</span>
            <label className="adm-vis"><Switch on={!p.hidden} onChange={() => toggle(p)} label={`Show ${p.name} on the site`} /><span>{p.hidden ? 'Hidden' : 'Visible'}</span></label>
            <button className="adm-btn" onClick={() => setEditing(p)}>Edit</button>
            <button className="adm-btn adm-btn--danger" onClick={() => del(p)}>Delete</button>
          </div>
        ))}
      </div>

      {editing && (
        <ProductEditor
          initial={editing === 'new' ? null : editing}
          cats={cats}
          notify={notify}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload() }}
        />
      )}
    </>
  )
}

function ProductEditor({ initial, cats, notify, onClose, onSaved }) {
  const [f, setF] = useState(initial ? { ...EMPTY, ...initial } : EMPTY)
  const [imgs, setImgs] = useState((initial?.images || []).map((url) => ({ key: url, url })))
  const [style, setStyle] = useState({ ...DEFAULT_STYLE, ...(initial?.image_style || {}) })
  const [busy, setBusy] = useState(false)
  const input = useRef(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const addFiles = (files) => {
    const add = [...files].map((file) => ({ key: `${file.name}-${file.size}-${Math.random()}`, url: URL.createObjectURL(file), file }))
    setImgs((cur) => [...cur, ...add])
  }
  const makeCover = (i) => setImgs((cur) => [cur[i], ...cur.filter((_, n) => n !== i)])
  const removeImg = (i) => setImgs((cur) => cur.filter((_, n) => n !== i))

  const save = async () => {
    if (!f.name.trim()) return notify('Product name is required', 'err')
    if (!f.category_id) return notify('Please choose a category', 'err')
    setBusy(true)
    try {
      const uploaded = await uploadFiles(imgs.filter((i) => i.file).map((i) => i.file))
      let n = 0
      const images = imgs.map((i) => (i.file ? uploaded[n++] : i.url))
      const row = {
        name: f.name.trim(), category_id: f.category_id, price: f.price || '', description: f.description || '',
        specs: f.specs || '', condition: f.condition, hidden: !!f.hidden, images, image_style: style,
      }
      const r = initial ? await sb.from('products').update(row).eq('id', initial.id) : await sb.from('products').insert(row)
      if (r.error) throw new Error(r.error.message)
      notify(initial ? 'Product saved' : 'Product added')
      onSaved()
    } catch (e) {
      notify(e.message, 'err')
      setBusy(false)
    }
  }

  return (
    <div className="adm-drawer" role="dialog" aria-modal="true" aria-label={initial ? 'Edit product' : 'New product'}>
      <div className="adm-drawer__bg" onClick={() => !busy && onClose()} />
      <div className="adm-drawer__panel">
        <header className="adm-drawer__head">
          <h2>{initial ? 'Edit product' : 'Add product'}</h2>
          <button className="adm-x" onClick={onClose} disabled={busy} aria-label="Close">×</button>
        </header>

        <div className="adm-drawer__body">
          <div className="adm-cols">
            <section className="adm-form">
              <h3>Details</h3>
              <div className="adm-field"><label>Category *</label>
                <select className="adm-input" value={f.category_id || ''} onChange={set('category_id')}>
                  <option value="">Choose a category…</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}{c.hidden ? ' (hidden)' : ''}</option>)}
                </select></div>
              <div className="adm-field"><label>Name *</label><input className="adm-input" value={f.name} onChange={set('name')} /></div>
              <div className="adm-field"><label>Condition</label>
                <Seg label="Condition" value={f.condition} onChange={(condition) => setF({ ...f, condition })} options={[['new', 'New'], ['used', 'Used']]} /></div>
              <div className="adm-field"><label>Price</label><input className="adm-input" placeholder="e.g. 250,000 EGP" value={f.price || ''} onChange={set('price')} /></div>
              <div className="adm-field"><label>Description</label><textarea className="adm-input" rows={4} value={f.description || ''} onChange={set('description')} /></div>
              <div className="adm-field"><label>Specifications — one per line, “Name: value”</label>
                <textarea className="adm-input" rows={6} placeholder={'Engine: 400cc\nTop speed: 110 km/h\nYear: 2022'} value={f.specs || ''} onChange={set('specs')} /></div>
              <label className="adm-vis adm-vis--box"><Switch on={!f.hidden} onChange={(on) => setF({ ...f, hidden: !on })} label="Visible on the site" />
                <span>{f.hidden ? 'Hidden — customers cannot see this product' : 'Visible on the site'}</span></label>
            </section>

            <section className="adm-form">
              <h3>Photos <small>The first photo is the cover shown on the cards.</small></h3>
              <div className="adm-gallery">
                {imgs.map((im, i) => (
                  <div className={`adm-gitem${i === 0 ? ' is-cover' : ''}`} key={im.key}>
                    <img src={im.url} alt="" />
                    {i === 0 ? <em>Cover</em> : <button type="button" onClick={() => makeCover(i)}>Make cover</button>}
                    <button type="button" className="adm-gitem__x" onClick={() => removeImg(i)} aria-label="Remove photo">×</button>
                  </div>
                ))}
                <button type="button" className="adm-gadd" onClick={() => input.current?.click()}>+ Add photos</button>
                <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
              </div>

              <h3>Card framing <small>Exactly how the cover looks on the site.</small></h3>
              <ImageFramer src={imgs[0]?.url} value={style} onChange={setStyle} ratio="4 / 3" defaults={DEFAULT_STYLE} />
            </section>
          </div>
        </div>

        <footer className="adm-drawer__foot">
          <button className="adm-btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="adm-btn adm-btn--primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
        </footer>
      </div>
    </div>
  )
}
