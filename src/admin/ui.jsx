import { sb } from '../lib'

/* Small shared UI pieces for the dashboard */

export function Switch({ on, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      className={`adm-switch${on ? ' is-on' : ''}`}
      onClick={() => onChange(!on)}
    >
      <span />
    </button>
  )
}

export function Seg({ value, options, onChange, label }) {
  return (
    <div className="adm-seg" role="group" aria-label={label}>
      {options.map(([k, l]) => (
        <button type="button" key={k} className={value === k ? 'is-active' : ''} onClick={() => onChange(k)}>{l}</button>
      ))}
    </div>
  )
}

export const timeAgo = (iso) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return `${Math.floor(s / 86400)} d ago`
}
export const fullDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

/* Upload picked files to the public "images" bucket, returns their public URLs (same order) */
export async function uploadFiles(files) {
  const out = []
  for (const f of files) {
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${f.name.replace(/[^\w.]/g, '')}`
    const { error } = await sb.storage.from('images').upload(name, f, { cacheControl: '31536000' })
    if (error) throw new Error(`Upload failed (${f.name}): ${error.message}`)
    out.push(sb.storage.from('images').getPublicUrl(name).data.publicUrl)
  }
  return out
}
