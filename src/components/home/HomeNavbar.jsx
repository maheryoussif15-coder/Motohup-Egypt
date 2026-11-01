import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { scrollToId } from './util'
import Logo from './Logo'

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'categories', label: 'Categories' },
  { id: 'featured', label: 'Featured' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

/* Sticky glassmorphism navbar for the home page */
export default function HomeNavbar({ inner = false }) {
  const [scrolled, setScrolled] = useState(inner)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('home')

  useEffect(() => {
    if (inner) return undefined
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
  }, [inner])

  const go = (e, id) => {
    e.preventDefault()
    setOpen(false)
    scrollToId(id)
  }

  /* On inner pages (category / product) the links go back to the matching home section */
  const link = (id, label, cls) =>
    inner ? (
      <Link to={id === 'home' ? '/' : `/#${id}`} className={cls} onClick={() => setOpen(false)}>{label}</Link>
    ) : (
      <a href={`#${id}`} className={cls} onClick={(e) => go(e, id)}>{label}</a>
    )

  return (
    <header className={`navbar${scrolled ? ' is-scrolled' : ''}`}>
      <nav className="nav mh-container" aria-label="Main navigation">
        {inner ? (
          <Link to="/" className="nav__logo" aria-label="MOTO HUB home"><Logo /></Link>
        ) : (
          <a href="#home" className="nav__logo" aria-label="MOTO HUB home" onClick={(e) => go(e, 'home')}>
            <Logo />
          </a>
        )}

        <ul className={`nav__menu${open ? ' is-open' : ''}`}>
          {LINKS.map(({ id, label }) => (
            <li key={id}>
              {link(id, label, `nav__link${!inner && active === id ? ' is-active' : ''}`)}
            </li>
          ))}
          <li className="nav__menu-cta">
            {link('featured', 'Shop Now', 'btn btn--primary btn--sm')}
          </li>
        </ul>

        {link('featured', 'Shop Now', 'btn btn--primary btn--sm nav__shop-btn')}

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
