import { scrollToId } from './util'
import { CAT_FALLBACK } from '../../lib'
import FramedImage from '../shared/FramedImage'

const DEFAULT_DESC = 'Hand-picked selection from MOTO HUB — ask us for the latest arrivals.'

/*
 * Category cards loaded from Supabase (categories hidden in the dashboard are not shown).
 * "Explore" applies the matching product filter and scrolls to the Featured Products section.
 */
export default function HomeCategories({ categories, onExplore }) {
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
          {categories.map((c, i) => (
            <article className="cat-card" data-reveal data-reveal-delay={i % 3} key={c.id}>
              <figure className="cat-card__media">
                <FramedImage
                  src={c.image || CAT_FALLBACK[c.slug]}
                  style={{ fit: 'cover', ...(c.image_style || {}) }}
                  alt={c.name}
                />
              </figure>
              <div className="cat-card__overlay" aria-hidden="true" />
              <div className="cat-card__content">
                <h3>{c.name}</h3>
                <p>{c.description || DEFAULT_DESC}</p>
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
