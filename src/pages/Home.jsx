import { useEffect, useState } from 'react'
import { sb } from '../lib'
import '../home.css'

import Intro from '../components/home/Intro'
import HomeNavbar from '../components/home/HomeNavbar'
import Hero from '../components/home/Hero'
import HomeCategories from '../components/home/HomeCategories'
import FeaturedProducts from '../components/home/FeaturedProducts'
import WhyUs from '../components/home/WhyUs'
import HomeAbout from '../components/home/HomeAbout'
import HomeContact from '../components/home/HomeContact'
import HomeFooter from '../components/home/HomeFooter'
import { WhatsAppFloat, BackToTop } from '../components/home/FloatingActions'
import useReveal from '../components/home/useReveal'

/*
 * Public home page — the MOTO HUB design converted to React.
 * The 5 categories are static (fixed by design); products come from the
 * existing Supabase products table. WhatsApp actions use the shared
 * wa() helper (wa.me/201061921764).
 */
export default function Home() {
  const [products, setProducts] = useState([])
  const [filter, setFilter] = useState('all')
  const [introDone, setIntroDone] = useState(false)

  useEffect(() => {
    // Scope document-level styling (scrollbar) to the home page only
    document.body.classList.add('mh-active')

    sb.from('products')
      .select('*,categories(name,slug)')
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => setProducts(data || []))

    return () => document.body.classList.remove('mh-active')
  }, [])

  // Re-run reveal animations once data or the filter has changed
  useReveal([products, filter, introDone])

  // "Explore" on a category card / footer link: set filter + scroll to featured
  function handleExplore(slug) {
    setFilter(slug)
  }

  return (
    <div className="mh-home">
      {!introDone && <Intro onDone={() => setIntroDone(true)} />}

      <a className="skip-link" href="#home" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0 }) }}>
        Skip to content
      </a>

      <HomeNavbar />

      <div>
        <Hero />
        <HomeCategories onExplore={handleExplore} />
        <FeaturedProducts products={products} filter={filter} onFilter={setFilter} />
        <WhyUs />
        <HomeAbout />
        <HomeContact />
      </div>

      <HomeFooter onExplore={handleExplore} />
      <WhatsAppFloat />
      <BackToTop />
    </div>
  )
}
