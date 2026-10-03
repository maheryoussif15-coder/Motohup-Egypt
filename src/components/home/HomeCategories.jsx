import { scrollToId } from './util'

/*
 * Static 5-category section (design copy, intentionally NOT loaded from Supabase).
 * Images are served from /public/img/categories/.
 */
const CATEGORIES = [
  {
    slug: 'motorcycles',
    name: 'Motorcycles',
    desc: 'Track-bred racing bikes and street rockets with uncompromising performance.',
    img: '/img/categories/motorcycles.jpg',
    alt: 'Red racing sport motorcycle in a dark garage',
  },
  {
    slug: 'atv',
    name: 'ATV',
    desc: 'Quad bikes built to dominate dunes, trails and mud.',
    img: '/img/categories/atv.jpg',
    alt: 'Orange quad ATVs standing in the open desert',
  },
  {
    slug: 'utv',
    name: 'UTV',
    desc: 'Side-by-side machines with serious power for work and wild terrain.',
    img: '/img/categories/utv.jpg',
    alt: 'Black UTV side-by-side vehicle with aggressive off-road tires',
  },
  {
    slug: 'marine',
    name: 'Marine',
    desc: 'High-performance jet skis and watercraft for thrill-seekers on the water.',
    img: '/img/categories/marine.jpg',
    alt: 'Rider carving waves on a red and white jet ski',
  },
  {
    slug: 'parts',
    name: 'Accessories & Spare Parts',
    desc: 'Genuine OEM and racing-grade components to keep every machine at peak power.',
    img: '/img/categories/parts.jpg',
    alt: 'Close-up of engine belts, pulleys and spare parts',
  },
]

/*
 * Category cards. "Explore" applies the matching product filter and
 * scrolls to the Featured Products section.
 */
export default function HomeCategories({ onExplore }) {
  function explore(e, slug) {
    e.preventDefault()
    onExplore(slug)
    scrollToId('featured')
  }

  return (
    <section className="section categories" id="categories">
      <div className="mh-container">
        <header className="section__head" data-reveal>
          <p className="section__eyebrow">Browse The Garage</p>
          <h2 className="section__title">Our <span className="text-gradient">Categories</span></h2>
          <p className="section__desc">
            Hand-picked machines and components for riders who demand nothing but the best.
          </p>
        </header>

        <div className="categories__grid">
          {CATEGORIES.map((c, i) => (
            <article className="cat-card" data-reveal data-reveal-delay={i % 3} key={c.slug}>
              <figure className="cat-card__media">
                <img src={c.img} alt={c.alt} loading="lazy" width="900" height="1100" />
              </figure>
              <div className="cat-card__overlay" aria-hidden="true" />
              <div className="cat-card__content">
                <h3>{c.name}</h3>
                <p>{c.desc}</p>
                <a href="#featured" className="btn btn--ghost btn--sm" onClick={(e) => explore(e, c.slug)}>
                  Explore
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
