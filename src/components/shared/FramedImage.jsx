import { NO_PHOTO } from '../../lib'

/*
 * Renders an image inside a fixed-ratio box using the framing chosen in the dashboard:
 *   style = { fit: 'contain' | 'cover', x: 0-100, y: 0-100, zoom: 1-3 }
 * "contain" (default) always shows the WHOLE picture; the empty space is filled with a
 * blurred copy of the same photo so the card never looks empty.
 */
export default function FramedImage({ src, style, alt = '', loading = 'lazy', className = '' }) {
  const s = style || {}
  const fit = s.fit || 'contain'
  const x = s.x ?? 50
  const y = s.y ?? 50
  const zoom = s.zoom || 1
  const url = src || NO_PHOTO
  return (
    <div className={`fimg ${className}`}>
      {fit === 'contain' && <img className="fimg__bg" src={url} alt="" aria-hidden="true" loading={loading} />}
      <img
        className="fimg__main"
        src={url}
        alt={alt}
        loading={loading}
        style={{
          objectFit: fit,
          objectPosition: `${x}% ${y}%`,
          transform: zoom !== 1 ? `scale(${zoom})` : undefined,
          transformOrigin: `${x}% ${y}%`,
        }}
      />
    </div>
  )
}
