import { Link } from 'react-router-dom'
import { wa, CONDITIONS } from '../../lib'
import { WhatsIcon } from '../home/icons'
import FramedImage from './FramedImage'

/* One product card — used on the home page, category pages and "related products" */
export default function ProductCard({ p, index = 0, reveal = true }) {
  const cond = p.condition === 'used' ? 'used' : 'new'
  return (
    <article
      className="product-card is-popping"
      data-category={p.categories?.slug}
      {...(reveal ? { 'data-reveal': true, 'data-reveal-delay': index % 4 } : {})}
    >
      <Link to={`/p/${p.id}`} className="product-card__link product-card__link--media" aria-label={`View ${p.name}`}>
        <figure className="product-card__media">
          <FramedImage src={p.images?.[0]} style={p.image_style} alt={p.name} />
          <span className="product-card__tag">{p.categories?.name || 'Product'}</span>
          <span className={`cond-badge cond-badge--${cond}`}>{CONDITIONS[cond]}</span>
        </figure>
      </Link>
      <div className="product-card__body">
        <h3><Link to={`/p/${p.id}`} className="product-card__link">{p.name}</Link></h3>
        <p className="product-card__spec">{(p.specs || '').split('\n')[0] || '\u00A0'}</p>
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
  )
}
