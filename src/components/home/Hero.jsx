import { wa } from '../../lib'
import { scrollToId } from './util'
import { StarIcon } from './icons'

const HERO_IMG = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=75'

/* Full-screen hero with headline, CTAs and glowing motorcycle image */
export default function Hero() {
  return (
    <section className="hero" id="home" aria-label="Intro">
      <div className="hero__bg" aria-hidden="true" />

      <div className="mh-container hero__inner">
        <div className="hero__content">
          <p className="hero__eyebrow" data-reveal><span className="dot" /> Premium Racing Store</p>

          <h1 className="hero__title" data-reveal>
            RIDE <span className="text-gradient">BEYOND</span> LIMITS
          </h1>

          <p className="hero__subtitle" data-reveal>
            Racing motorcycles, powerful ATVs and 100% genuine spare parts —
            engineered for speed, built for champions. Your journey starts at MOTO HUB.
          </p>

          <div className="hero__actions" data-reveal>
            <a href="#categories" className="btn btn--primary" onClick={(e) => { e.preventDefault(); scrollToId('categories') }}>
              Explore Collection
            </a>
            <a href={wa('Hello MOTO HUB')} target="_blank" rel="noreferrer" className="btn btn--ghost">
              Contact Us
            </a>
          </div>
        </div>

        {/* Motorcycle image with purple glow */}
        <div className="hero__media" data-reveal>
          <div className="hero__glow" aria-hidden="true" />
          <img src={HERO_IMG} alt="Black and orange racing motorcycle parked against a dark wall" width="900" height="600" />
          <div className="hero__badge" aria-hidden="true">
            <span className="hero__badge-icon"><StarIcon size={20} /></span>
            <span>100% Genuine<br />Products</span>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <a
        href="#categories"
        className="hero__scroll"
        aria-label="Scroll to categories"
        onClick={(e) => { e.preventDefault(); scrollToId('categories') }}
      >
        <span />
      </a>
    </section>
  )
}
