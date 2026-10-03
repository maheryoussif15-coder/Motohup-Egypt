import { useState } from 'react'
import { wa } from '../../lib'
import { scrollToId } from './util'
import { WhatsIcon, InstaIcon } from './icons'

const INSTAGRAM_URL = 'https://www.instagram.com/hossam_said94?stkn=b2plaGlzZjdtaXVp'

/* Static 5-category list (matches the categories section) */
const CATEGORIES = [
  { slug: 'motorcycles', label: 'Motorcycles' },
  { slug: 'atv', label: 'ATV' },
  { slug: 'utv', label: 'UTV' },
  { slug: 'marine', label: 'Marine' },
  { slug: 'parts', label: 'Accessories & Spare Parts' },
]

const QUICK_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'categories', label: 'Categories' },
  { id: 'featured', label: 'Featured' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

/* Home page footer: brand, quick links, static categories, newsletter, socials */
export default function HomeFooter({ onExplore }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

  function subscribe(e) {
    e.preventDefault()
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setStatus('Please enter a valid email address.')
      return
    }
    setStatus('Thank you! You are on the list.')
    setEmail('')
  }

  return (
    <footer className="footer">
      <div className="mh-container">
        <div className="footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <a href="#home" className="nav__logo" onClick={(e) => { e.preventDefault(); scrollToId('home') }}>
              MOTO<span>HUB</span>
            </a>
            <p>
              Your premium destination for motorcycles, ATVs, UTVs, marine
              watercraft and genuine spare parts. Ride beyond limits.
            </p>
            <div className="contact__socials">
              <a href={wa('Hello MOTO HUB')} target="_blank" rel="noreferrer" className="social-btn social-btn--wa" aria-label="WhatsApp">
                <WhatsIcon size={18} />
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="social-btn" aria-label="Instagram">
                <InstaIcon size={18} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <nav className="footer__col" aria-label="Quick links">
            <h4>Quick Links</h4>
            <ul>
              {QUICK_LINKS.map(({ id, label }) => (
                <li key={id}>
                  <a href={`#${id}`} onClick={(e) => { e.preventDefault(); scrollToId(id) }}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Categories (static, applies filter + scrolls to featured) */}
          <nav className="footer__col" aria-label="Categories">
            <h4>Categories</h4>
            <ul>
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <a
                    href="#featured"
                    onClick={(e) => { e.preventDefault(); onExplore(c.slug); scrollToId('featured') }}
                  >
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Newsletter */}
          <div className="footer__col footer__news">
            <h4>Newsletter</h4>
            <p>Get fresh drops, races and exclusive offers straight to your inbox.</p>
            <form className="news-form" onSubmit={subscribe} noValidate>
              <label className="visually-hidden" htmlFor="newsEmail">Email address</label>
              <input
                id="newsEmail"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn btn--primary btn--sm" aria-label="Subscribe">&rarr;</button>
            </form>
            <p className="form-status" role="status" aria-live="polite">{status}</p>
          </div>
        </div>

        <div className="footer__bottom">
          <p>&copy; 2025 MOTO HUB. All rights reserved. | Setup by ABO-MAHER</p>
        </div>
      </div>
    </footer>
  )
}
