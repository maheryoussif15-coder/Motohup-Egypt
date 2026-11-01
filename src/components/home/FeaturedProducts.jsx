import { useState } from 'react'
import ProductCard from '../shared/ProductCard'
import useReveal from './useReveal'

const CONDITION_FILTERS = [
  { key: 'all', label: 'New & Used' },
  { key: 'new', label: 'New' },
  { key: 'used', label: 'Used' },
]

/*
 * Featured products grid rendered from Supabase.
 * Category chips come from the categories table (hidden ones never show up);
 * the New / Used switch filters by the product condition set in the dashboard.
 */
export default function FeaturedProducts({ products, categories, filter, onFilter }) {
  const [cond, setCond] = useState('all')
  // cards that appear after switching New / Used must be revealed too
  useReveal([products, categories, filter, cond])

  const byCategory = filter === 'all' ? products : products.filter((p) => p.categories?.slug === filter)
  const visible = cond === 'all' ? byCategory : byCategory.filter((p) => (p.condition || 'new') === cond)

  const emptyText = !products.length ? 'Products coming soon.' : 'No products match this filter yet.'

  return (
    <section className="section featured" id="featured">
      <div className="mh-container">
        <header className="section__head" data-reveal>
          <p className="section__eyebrow">Top Machines &amp; Components</p>
          <h2 className="section__title">Featured <span className="text-gradient">Products</span></h2>
          <p className="section__desc">A curated mix of our most demanded vehicles, gear and spare parts.</p>
        </header>

        <div className="filter" role="group" aria-label="Filter products by category" data-reveal>
          <button type="button" className={`filter__btn${filter === 'all' ? ' is-active' : ''}`} onClick={() => onFilter('all')}>
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`filter__btn${filter === c.slug ? ' is-active' : ''}`}
              onClick={() => onFilter(c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="seg" role="group" aria-label="Filter by condition" data-reveal>
          {CONDITION_FILTERS.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`seg__btn${cond === c.key ? ' is-active' : ''}`}
              onClick={() => setCond(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {visible.length ? (
          <div className="products-grid">
            {visible.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
          </div>
        ) : (
          <p className="filter-empty" data-reveal>{emptyText}</p>
        )}
      </div>
    </section>
  )
}
