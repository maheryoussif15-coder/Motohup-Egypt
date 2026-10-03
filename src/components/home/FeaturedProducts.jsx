import { wa } from '../../lib'
import { WhatsIcon } from './icons'

/* Gray placeholder for products without an image yet */
const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="700" height="500"><rect width="100%25" height="100%25" fill="%23181623"/><text x="50%25" y="50%25" fill="%238E88A6" font-family="sans-serif" font-size="24" text-anchor="middle" dominant-baseline="middle">No photo</text></svg>'

/* Static category filter chips (matches the 5 fixed categories) */
const FILTERS = [
  { slug: 'all', label: 'All' },
  { slug: 'motorcycles', label: 'Motorcycles' },
  { slug: 'atv', label: 'ATV' },
  { slug: 'utv', label: 'UTV' },
  { slug: 'marine', label: 'Marine' },
  { slug: 'parts', label: 'Accessories & Parts' },
]

/*
 * Featured products grid rendered from the Supabase products table,
 * with a static category filter controlled from Home.jsx.
 * Every card carries an "Ask on WhatsApp" inquiry button.
 */
export default function FeaturedProducts({ products, filter, onFilter }) {
  const visible = filter === 'all'
    ? products
    : products.filter((p) => p.categories?.slug === filter)

  const emptyText = !products.length
    ? 'Products coming soon.'
    : 'No products in this category yet.'

  return (
    <section className="section featured" id="featured">
      <div className="mh-container">
        <header className="section__head" data-reveal>
          <p className="section__eyebrow">Top Machines &amp; Components</p>
          <h2 className="section__title">Featured <span className="text-gradient">Products</span></h2>
          <p className="section__desc">A curated mix of our most demanded bikes, ATVs and spare parts.</p>
        </header>

        {/* Category filter (All + the 5 fixed categories) */}
        <div className="filter" role="group" aria-label="Filter products by category" data-reveal>
          {FILTERS.map((f) => (
            <button
              key={f.slug}
              type="button"
              className={`filter__btn${filter === f.slug ? ' is-active' : ''}`}
              onClick={() => onFilter(f.slug)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visible.length ? (
          <div className="products-grid">
            {visible.map((p, i) => (
              <article className="product-card is-popping" data-category={p.categories?.slug} data-reveal data-reveal-delay={i % 4} key={p.id}>
                <figure className="product-card__media">
                  <img src={p.images?.[0] || PLACEHOLDER} alt={p.name} loading="lazy" width="700" height="500" />
                  <span className="product-card__tag">{p.categories?.name || 'Product'}</span>
                </figure>
                <div className="product-card__body">
                  <h3>{p.name}</h3>
                  <p className="product-card__spec">{(p.specs || '').split('\n')[0] || ''}</p>
                  <div className="product-card__foot">
                    <span className="product-card__price">{p.price || ''}</span>
                    <a
                      className="wa-btn"
                      href={wa(`Hello MOTO HUB, I am interested in the product: ${p.name}. Is it available?`)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Ask about ${p.name} on WhatsApp`}
                    >
                      <WhatsIcon size={16} />
                      Ask on WhatsApp
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="filter-empty" data-reveal>{emptyText}</p>
        )}
      </div>
    </section>
  )
}
