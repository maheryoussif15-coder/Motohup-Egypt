const ABOUT_IMG = 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=800&q=70'

/* Brand story with image (design content) */
export default function HomeAbout() {
  return (
    <section className="section about" id="about">
      <div className="mh-container about__inner">
        <div className="about__media" data-reveal>
          <div className="about__frame" aria-hidden="true" />
          <img src={ABOUT_IMG} alt="Racing motorcycle standing on an open road" loading="lazy" width="800" height="1000" />
        </div>

        <div className="about__content">
          <p className="section__eyebrow" data-reveal>Who We Are</p>
          <h2 className="section__title" data-reveal>
            Built By Riders,<br /><span className="text-gradient">For Riders</span>
          </h2>
          <p data-reveal>
            MOTO HUB is a full-scale store serving professional racers, weekend
            warriors and off-road adventurers across Egypt.
          </p>
          <p data-reveal>
            From factory-spec superbikes to trail-dominating ATVs, UTVs, marine
            watercraft and a warehouse full of genuine spare parts — everything
            we sell is tested, tuned and trusted.
          </p>
        </div>
      </div>
    </section>
  )
}
