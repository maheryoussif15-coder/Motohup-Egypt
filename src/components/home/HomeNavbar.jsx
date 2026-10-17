import { useEffect, useState } from 'react'
import { scrollToId } from './util'

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'categories', label: 'Categories' },
  { id: 'featured', label: 'Featured' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

/* Sticky glassmorphism navbar for the home page */
export default function HomeNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('home')

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30)
      // Highlight the section currently in view
      const pos = window.scrollY + 140
      let current = 'home'
      LINKS.forEach(({ id }) => {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= pos) current = id
      })
      setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (e, id) => {
    e.preventDefault()
    setOpen(false)
    scrollToId(id)
  }

  return (
    <header className={`navbar${scrolled ? ' is-scrolled' : ''}`}>
      <nav className="nav mh-container" aria-label="Main navigation">
        <a href="#home" className="nav__logo" aria-label="MOTO HUB home" onClick={(e) => go(e, 'home')}>
          <img src="/logo.png" alt="MOTO HUB" style={{ height: '45px', width: 'auto', display: 'block' }} />
        </a>

        <ul className={`nav__menu${open ? ' is-open' : ''}`}>
          {LINKS.map(({ id, label }) => (
            <li key={id}>
              <a href={`#${id}`} className={`nav__link${active === id ? ' is-active' : ''}`} onClick={(e) => go(e, id)}>
                {label}
              </a>
            </li>
          ))}
          <li className="nav__menu-cta">
            <a href="#featured" className="btn btn--primary btn--sm" onClick={(e) => go(e, 'featured')}>Shop Now</a>
          </li>
        </ul>

        <a href="#featured" className="btn btn--primary btn--sm nav__shop-btn" onClick={(e) => go(e, 'featured')}>Shop Now</a>

        <button
          className={`nav__toggle${open ? ' is-active' : ''}`}
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span /><span /><span />
        </button>
      </nav>
    </header>
  )
}
