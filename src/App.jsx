import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Category from './pages/Category'
import Product from './pages/Product'
import Admin from './pages/Admin'
import HomeNavbar from './components/home/HomeNavbar'
import PageFooter from './components/shared/PageFooter'
import { WhatsAppFloat } from './components/home/FloatingActions'
import './home.css'
import './site.css'

export default function App() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const isAdmin = pathname.startsWith('/admin')

  // Home and Admin bring their own layout; category/product pages share the site navbar + footer
  if (isHome) return <Home />
  if (isAdmin) return <Admin />

  return (
    <div className="mh-home pg">
      <HomeNavbar inner />
      <main className="pg__main">
        <Routes>
          <Route path="/c/:slug" element={<Category />} />
          <Route path="/p/:id" element={<Product />} />
          <Route path="*" element={<div className="mh-container pg__empty"><h1>Page not found</h1></div>} />
        </Routes>
      </main>
      <PageFooter />
      <WhatsAppFloat />
    </div>
  )
}
