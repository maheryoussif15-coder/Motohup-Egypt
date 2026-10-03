/* "Why Choose Us" — four glass feature cards (design content) */
const FEATURES = [
  {
    title: 'Genuine Parts',
    text: 'Every component is 100% authentic and sourced directly from certified manufacturers.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Expert Support',
    text: 'Racing specialists guide you through setup, tuning and the right upgrade path.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
  },
  {
    title: 'Fast Delivery',
    text: 'Same-day dispatch and express nationwide shipping on every order.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="6" width="14" height="11" rx="1" /><path d="M15 10h4l3 3v4h-7z" />
        <circle cx="6" cy="19" r="2" /><circle cx="18" cy="19" r="2" />
      </svg>
    ),
  },
  {
    title: 'Warranty',
    text: 'Up to 24 months of official warranty coverage on bikes, ATVs and parts.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="9" r="6" /><path d="M8.5 14L7 22l5-3 5 3-1.5-8" />
      </svg>
    ),
  },
]

export default function WhyUs() {
  return (
    <section className="section why" id="why">
      <div className="mh-container">
        <header className="section__head" data-reveal>
          <p className="section__eyebrow">The MOTO HUB Standard</p>
          <h2 className="section__title">Why <span className="text-gradient">Choose Us</span></h2>
        </header>

        <div className="why__grid">
          {FEATURES.map((f, i) => (
            <article className="feature-card glass" data-reveal data-reveal-delay={i} key={f.title}>
              <div className="feature-card__icon" aria-hidden="true">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
