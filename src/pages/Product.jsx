import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { sb, wa, CONDITIONS, isPublic } from '../lib'
import { WhatsIcon } from '../components/home/icons'
import FramedImage from '../components/shared/FramedImage'
import ProductCard from '../components/shared/ProductCard'
import OrderModal from '../components/shared/OrderModal'

export default function Product() {
  const { id } = useParams()
  const [p, setP] = useState(null)
  const [missing, setMissing] = useState(false)
  const [i, setI] = useState(0)
  const [ordering, setOrdering] = useState(false)
  const [related, setRelated] = useState([])

  useEffect(() => {
    window.scrollTo(0, 0)
    setP(null); setMissing(false); setI(0); setRelated([])
    sb.from('products').select('*,categories(name,slug,hidden)').eq('id', id).maybeSingle().then(({ data }) => {
      if (!data || !isPublic(data)) return setMissing(true)
      setP(data)
      sb.from('products')
        .select('*,categories(name,slug,hidden)')
        .eq('category_id', data.category_id).eq('hidden', false).neq('id', data.id)
        .order('created_at', { ascending: false }).limit(4)
        .then(({ data: r }) => setRelated(r || []))
    })
  }, [id])

  if (missing) return <div className="mh-container pg__empty"><h1>Product not available</h1><Link to="/#featured" className="btn btn--primary btn--sm">Browse products</Link></div>
  if (!p) return <div className="mh-container pg__empty"><p>Loading…</p></div>

  const cond = p.condition === 'used' ? 'used' : 'new'
  const specs = (p.specs || '').split('\n').filter(Boolean).map((l) => {
    const k = l.indexOf(':')
    return k < 0 ? [l, ''] : [l.slice(0, k).trim(), l.slice(k + 1).trim()]
  })
  const imgs = p.images || []
  const msg = `Hello MOTO HUB, I'm interested in: ${p.name}${p.price ? ' (' + p.price + ')' : ''}\n${window.location.href}`

  return (
    <>
      <section className="mh-container pg__section">
        {p.categories && <Link to={`/c/${p.categories.slug}`} className="crumb">← {p.categories.name}</Link>}

        <div className="pdp">
          <div className="pdp__gallery">
            <div className="pdp__stage">
              <FramedImage src={imgs[i]} style={{ fit: 'contain' }} alt={p.name} loading="eager" />
              <span className={`cond-badge cond-badge--${cond}`}>{CONDITIONS[cond]}</span>
            </div>
            {imgs.length > 1 && (
              <div className="pdp__thumbs">
                {imgs.map((u, n) => (
                  <button key={n} className={`pdp__thumb${n === i ? ' is-active' : ''}`} onClick={() => setI(n)} aria-label={`Photo ${n + 1}`}>
                    <img src={u} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pdp__info">
            <p className="section__eyebrow pdp__eyebrow">{p.categories?.name}</p>
            <h1 className="pdp__title">{p.name}</h1>
            {p.price && <p className="pdp__price">{p.price}</p>}
            {p.description && <p className="pdp__desc">{p.description}</p>}

            {specs.length > 0 && (
              <dl className="specs">
                {specs.map(([k, v], n) => (
                  <div key={n} className="specs__row"><dt>{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            )}

            <div className="pdp__cta">
              <button className="btn btn--primary" onClick={() => setOrdering(true)}>Order now</button>
              <a className="btn btn--outline" href={wa(msg)} target="_blank" rel="noreferrer"><WhatsIcon size={18} /> Ask on WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mh-container pg__section pg__related">
          <h2 className="pg__h2">More in {p.categories?.name}</h2>
          <div className="products-grid">{related.map((r) => <ProductCard key={r.id} p={r} reveal={false} />)}</div>
        </section>
      )}

      {ordering && <OrderModal product={p} onClose={() => setOrdering(false)} />}
    </>
  )
}
