import {createClient} from '@supabase/supabase-js'
export const sb=createClient(import.meta.env.VITE_SUPABASE_URL||'http://x.local',import.meta.env.VITE_SUPABASE_ANON_KEY||'x')
export const PHONE='201061921764'
export const wa=t=>`https://wa.me/${PHONE}?text=${encodeURIComponent(t)}`
