import { useRef } from 'react'
import FramedImage from '../components/shared/FramedImage'
import { Seg } from './ui'

const clamp = (n, a, b) => Math.min(b, Math.max(a, n))

/*
 * Live framing editor. The preview box has the same proportions as the card on the site,
 * so what you see here is what visitors get. Drag the picture to reposition it.
 *   style = { fit: 'contain' | 'cover', x, y, zoom }
 */
export default function ImageFramer({ src, value, onChange, ratio = '4 / 3', defaults }) {
  const s = { fit: 'contain', x: 50, y: 50, zoom: 1, ...value }
  const box = useRef(null)
  const drag = useRef(null)
  const patch = (p) => onChange({ ...s, ...p })

  const down = (e) => {
    if (!src) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, x: s.x, y: s.y }
  }
  const move = (e) => {
    const d = drag.current
    if (!d || !box.current) return
    const r = box.current.getBoundingClientRect()
    patch({
      x: clamp(Math.round(d.x - ((e.clientX - d.px) / r.width) * 100), 0, 100),
      y: clamp(Math.round(d.y - ((e.clientY - d.py) / r.height) * 100), 0, 100),
    })
  }
  const up = () => { drag.current = null }

  return (
    <div className="adm-framer">
      <div
        ref={box}
        className="adm-frame"
        style={{ aspectRatio: ratio }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {src ? <FramedImage src={src} style={s} alt="Preview" loading="eager" /> : <p>Add a photo to frame it</p>}
        {src && <span className="adm-frame__hint">Drag to reposition</span>}
      </div>

      <div className="adm-framer__ctrl">
        <div className="adm-field">
          <label>How the picture fits</label>
          <Seg
            label="Image fit"
            value={s.fit}
            onChange={(fit) => patch({ fit })}
            options={[['contain', 'Show whole picture'], ['cover', 'Fill the card']]}
          />
        </div>
        <label className="adm-range">
          <span>Zoom <b>{s.zoom.toFixed(2)}×</b></span>
          <input type="range" min="1" max="3" step="0.05" value={s.zoom} onChange={(e) => patch({ zoom: Number(e.target.value) })} />
        </label>
        <label className="adm-range">
          <span>Left ↔ Right <b>{s.x}%</b></span>
          <input type="range" min="0" max="100" value={s.x} onChange={(e) => patch({ x: Number(e.target.value) })} />
        </label>
        <label className="adm-range">
          <span>Top ↕ Bottom <b>{s.y}%</b></span>
          <input type="range" min="0" max="100" value={s.y} onChange={(e) => patch({ y: Number(e.target.value) })} />
        </label>
        <button type="button" className="adm-btn adm-btn--ghost" onClick={() => onChange(defaults || { fit: 'contain', x: 50, y: 50, zoom: 1 })}>
          Reset framing
        </button>
      </div>
    </div>
  )
}
