import {createClient} from '@supabase/supabase-js'
export const sb=createClient(import.meta.env.VITE_SUPABASE_URL||'http://x.local',import.meta.env.VITE_SUPABASE_ANON_KEY||'x')
export const PHONE='201061921764'
export const wa=t=>`https://wa.me/${PHONE}?text=${encodeURIComponent(t)}`

/* ---------- shared helpers ---------- */
export const CONDITIONS = { new: 'New', used: 'Used' }
export const slugify = (t) => (t || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/* Fallback artwork for the original categories (new categories use the image uploaded in the dashboard) */
export const CAT_FALLBACK = {
  motorcycles: '/img/categories/motorcycles.jpg',
  atv: '/img/categories/atv.jpg',
  utv: '/img/categories/utv.jpg',
  marine: '/img/categories/marine.jpg',
  parts: '/img/categories/parts.jpg',
}
export const NO_PHOTO =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="700" height="525"><rect width="100%25" height="100%25" fill="%23181623"/><text x="50%25" y="50%25" fill="%238E88A6" font-family="sans-serif" font-size="24" text-anchor="middle" dominant-baseline="middle">No photo</text></svg>'

/* A product is public only when it AND its category are visible */
export const isPublic = (p) => !p.hidden && !p.categories?.hidden
