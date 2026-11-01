import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { sb, isPublic } from '../lib'
import '../home.css'
import '../site.css'

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
 * Public home page. Categories and products both come from Supabase, so anything
 * hidden in the dashboard (a whole category or a single product) disappears here.
 */
export default function Home() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [filter, setFilter] = useState('all')
  const { hash } = useLocation()

  useEffect(() => {
    document.body.classList.add('mh-active')

    sb.from('categories')
      .select('*')
      .eq('hidden', false)
      .order('sort')
      .then(({ data }) => setCategories(data || []))

    sb.from('products')
      .select('*,categories(name,slug,hidden)')
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => setProducts((data || []).filter(isPublic)))

    return () => document.body.classList.remove('mh-active')
  }, [])

  // Re-run reveal animations once data or the filter has changed
  useReveal([products, categories, filter])

  // Coming back from a product / category page with /#featured etc.
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return undefined }
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 120)
    return () => clearTimeout(t)
  }, [hash])

  function handleExplore(slug) {
    setFilter(slug)
  }

  return (
    <div className="mh-home">
      <a className="skip-link" href="#home" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0 }) }}>
        Skip to content
      </a>

      <HomeNavbar />

      <div>
        <Hero />
        <HomeCategories categories={categories} onExplore={handleExplore} />
        <FeaturedProducts products={products} categories={categories} filter={filter} onFilter={setFilter} />
        <WhyUs />
        <HomeAbout />
        <HomeContact />
      </div>

      <HomeFooter categories={categories} onExplore={handleExplore} />
      <WhatsAppFloat />
      <BackToTop />
    </div>
  )
}
