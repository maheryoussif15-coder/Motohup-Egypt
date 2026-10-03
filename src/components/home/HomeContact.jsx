import { useState } from 'react'
import { wa } from '../../lib'
import { WhatsIcon, InstaIcon } from './icons'

const INSTAGRAM_URL = 'https://www.instagram.com/hossam_said94?stkn=b2plaGlzZjdtaXVp'

/*
 * Contact section: the form opens WhatsApp with the message pre-filled
 * (no backend), and the info panel lists the real channels only.
 */
export default function HomeContact() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!name.trim() || !message.trim()) {
      setStatus('Please fill in your name and a message.')
      return
    }
    const text = `Hello MOTO HUB, my name is ${name.trim()}.${phone.trim() ? ` My phone: ${phone.trim()}.` : ''} ${message.trim()}`
    window.open(wa(text), '_blank', 'noopener')
    setStatus('Opening WhatsApp with your message...')
    setName(''); setPhone(''); setMessage('')
  }

  return (
    <section className="section contact" id="contact">
      <div className="mh-container">
        <header className="section__head" data-reveal>
          <p className="section__eyebrow">Get In Touch</p>
          <h2 className="section__title">Let&rsquo;s <span className="text-gradient">Talk Speed</span></h2>
        </header>

        <div className="contact__inner">
          {/* Form → opens WhatsApp with the data pre-filled */}
          <form className="contact__form glass" onSubmit={submit} noValidate data-reveal>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cf-name">Name</label>
                <input id="cf-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
              </div>
              <div className="form-group">
                <label htmlFor="cf-phone">Phone</label>
                <input id="cf-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone number" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="cf-message">Message</label>
              <textarea id="cf-message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what you are looking for..." required />
            </div>

            <button type="submit" className="btn btn--primary btn--block">Send via WhatsApp</button>
            <p className="form-status" role="status" aria-live="polite">{status}</p>
          </form>

          {/* Real contact channels only */}
          <aside className="contact__info glass" data-reveal data-reveal-delay="1">
            <h3>Talk To Us</h3>

            <ul className="info-list">
              <li>
                <span className="info-icon info-icon--wa" aria-hidden="true"><WhatsIcon size={20} /></span>
                <span>
                  <strong>WhatsApp</strong><br />
                  <a href={wa('Hello MOTO HUB')} target="_blank" rel="noreferrer">01061921764</a>
                </span>
              </li>
              <li>
                <span className="info-icon" aria-hidden="true"><InstaIcon size={20} /></span>
                <span>
                  <strong>Instagram</strong><br />
                  <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">@hossam_said94</a>
                </span>
              </li>
            </ul>

            <div className="contact__socials">
              <a href={wa('Hello MOTO HUB')} target="_blank" rel="noreferrer" className="social-btn social-btn--wa" aria-label="WhatsApp">
                <WhatsIcon size={18} />
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="social-btn" aria-label="Instagram">
                <InstaIcon size={18} />
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
