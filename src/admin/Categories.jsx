import { useEffect, useRef, useState } from 'react'
import { sb, slugify, CAT_FALLBACK } from '../lib'
import { Switch, uploadFiles } from './ui'
import ImageFramer from './ImageFramer'

const DEFAULT_STYLE = { fit: 'cover', x: 50, y: 50, zoom: 1 }

export default function Categories({ cats, prods, reload, notify }) {
  const [editing, setEditing] = useState(null)
  const count = (id) => prods.filter((p) => p.category_id === id).length

  const toggle = async (c) => {
    const { error } = await sb.from('categories').update({ hidden: !c.hidden }).eq('id', c.id)
    if (error) notify(error.message, 'err'); else { notify(c.hidden ? 'Category is now visible' : 'Category hidden from the site'); reload() }
  }
  const del = async (c) => {
    const n = count(c.id)
    if (!confirm(`Delete "${c.name}"?${n ? `\n\nThis will also delete its ${n} product(s). Tip: use the switch to hide it instead.` : ''}`)) return
    const { error } = await sb.from('categories').delete().eq('id', c.id)
    if (error) notify(error.message, 'err'); else { notify('Category deleted'); reload() }
  }
  const move = async (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= cats.length) return
    const next = [...cats]
    ;[next[i], next[j]] = [next[j], next[i]]
    const results = await Promise.all(next.map((c, n) => (c.sort !== n ? sb.from('categories').update({ sort: n }).eq('id', c.id) : null)))
    const bad = results.find((r) => r?.error)
    if (bad) notify(bad.error.message, 'err')
    reload()
  }

  return (
    <>
      <header className="adm-head">
        <div><h1>Categories</h1><p>Use the switch to show or hide a whole category (its products are hidden too).</p></div>
        <button className="adm-btn adm-btn--primary" onClick={() => setEditing('new')}>+ Add category</button>
      </header>

      <div className="adm-cats">
        {cats.map((c, i) => (
          <article className={`adm-cat${c.hidden ? ' is-off' : ''}`} key={c.id}>
            <div className="adm-cat__img"><img src={c.image || CAT_FALLBACK[c.slug]} alt="" style={{ objectPosition: `${c.image_style?.x ?? 50}% ${c.image_style?.y ?? 50}%` }} /></div>
            <div className="adm-cat__body">
              <strong>{c.name}</strong>
              <span>{count(c.id)} products · /c/{c.slug}</span>
              <label className="adm-vis"><Switch on={!c.hidden} onChange={() => toggle(c)} label={`Show ${c.name} on the site`} /><span>{c.hidden ? 'Hidden' : 'Visible'}</span></label>
            </div>
            <div className="adm-cat__actions">
              <button className="adm-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button className="adm-btn" onClick={() => move(i, 1)} disabled={i === cats.length - 1} aria-label="Move down">↓</button>
              <button className="adm-btn" onClick={() => setEditing(c)}>Edit</button>
              <button className="adm-btn adm-btn--danger" onClick={() => del(c)}>Delete</button>
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <CategoryEditor
          initial={editing === 'new' ? null : editing}
          nextSort={cats.length}
          notify={notify}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload() }}
        />
      )}
    </>
  )
}

function CategoryEditor({ initial, nextSort, notify, onClose, onSaved }) {
  const [f, setF] = useState({ name: initial?.name || '', slug: initial?.slug || '', description: initial?.description || '', hidden: !!initial?.hidden })
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const [img, setImg] = useState({ url: initial?.image || (initial ? CAT_FALLBACK[initial.slug] : '') || '', file: null })
  const [style, setStyle] = useState({ ...DEFAULT_STYLE, ...(initial?.image_style || {}) })
  const [busy, setBusy] = useState(false)
  const input = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const setName = (name) => setF({ ...f, name, slug: slugTouched ? f.slug : slugify(name) })

  const save = async () => {
    if (!f.name.trim()) return notify('Category name is required', 'err')
    const slug = slugify(f.slug || f.name)
    if (!slug) return notify('Use English letters or numbers in the web address', 'err')
    setBusy(true)
    try {
      let image = initial?.image || null
      if (img.file) image = (await uploadFiles([img.file]))[0]
      const row = { name: f.name.trim(), slug, description: f.description.trim(), hidden: f.hidden, image, image_style: style }
      const r = initial
        ? await sb.from('categories').update(row).eq('id', initial.id)
        : await sb.from('categories').insert({ ...row, sort: nextSort })
      if (r.error) throw new Error(r.error.code === '23505' ? 'That web address is already used by another category' : r.error.message)
      notify(initial ? 'Category saved' : 'Category added')
      onSaved()
    } catch (e) { notify(e.message, 'err'); setBusy(false) }
  }

  return (
    <div className="adm-drawer" role="dialog" aria-modal="true" aria-label={initial ? 'Edit category' : 'New category'}>
      <div className="adm-drawer__bg" onClick={() => !busy && onClose()} />
      <div className="adm-drawer__panel adm-drawer__panel--sm">
        <header className="adm-drawer__head">
          <h2>{initial ? 'Edit category' : 'Add category'}</h2>
          <button className="adm-x" onClick={onClose} disabled={busy} aria-label="Close">×</button>
        </header>
        <div className="adm-drawer__body">
          <section className="adm-form">
            <div className="adm-field"><label>Name *</label><input className="adm-input" value={f.name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Clothing" /></div>
            <div className="adm-field"><label>Web address</label>
              <div className="adm-slug"><span>/c/</span><input className="adm-input" value={f.slug} onChange={(e) => { setSlugTouched(true); setF({ ...f, slug: e.target.value }) }} /></div></div>
            <div className="adm-field"><label>Short description (shown on the category card)</label>
              <textarea className="adm-input" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
            <label className="adm-vis adm-vis--box"><Switch on={!f.hidden} onChange={(on) => setF({ ...f, hidden: !on })} label="Visible on the site" />
              <span>{f.hidden ? 'Hidden — the category and its products are not shown' : 'Visible on the site'}</span></label>

            <h3>Card photo</h3>
            <button type="button" className="adm-btn" onClick={() => input.current?.click()}>{img.url ? 'Change photo' : 'Choose photo'}</button>
            <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { const file = e.target.files[0]; if (file) setImg({ url: URL.createObjectURL(file), file }); e.target.value = '' }} />
            <ImageFramer src={img.url} value={style} onChange={setStyle} ratio="4 / 5" defaults={DEFAULT_STYLE} />
          </section>
        </div>
        <footer className="adm-drawer__foot">
          <button className="adm-btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="adm-btn adm-btn--primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save category'}</button>
        </footer>
      </div>
    </div>
  )
}
