import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { sb } from '../lib'
import ProductCard from '../components/shared/ProductCard'

const CONDS = [['all', 'New & Used'], ['new', 'New'], ['used', 'Used']]

export default function Category() {
  const { slug } = useParams()
  const [cat, setCat] = useState(null)
  const [items, setItems] = useState(null)
  const [cond, setCond] = useState('all')

  useEffect(() => {
    window.scrollTo(0, 0)
    setItems(null)
    setCond('all')
    ;(async () => {
      const { data: c } = await sb.from('categories').select('*').eq('slug', slug).eq('hidden', false).maybeSingle()
      setCat(c)
      if (!c) return setItems([])
      const { data } = await sb
        .from('products')
        .select('*,categories(name,slug,hidden)')
        .eq('category_id', c.id)
        .eq('hidden', false)
        .order('created_at', { ascending: false })
      setItems(data || [])
    })()
  }, [slug])

  const shown = (items || []).filter((p) => cond === 'all' || (p.condition || 'new') === cond)

  return (
    <section className="mh-container pg__section">
      <Link to="/#categories" className="crumb">← All categories</Link>
      <h1 className="pg__title">{cat ? cat.name : items ? 'Category not available' : ' '}</h1>
      {cat?.description && <p className="pg__lead">{cat.description}</p>}

      {cat && (
        <div className="seg seg--left" role="group" aria-label="Filter by condition">
          {CONDS.map(([k, l]) => (
            <button key={k} type="button" className={`seg__btn${cond === k ? ' is-active' : ''}`} onClick={() => setCond(k)}>{l}</button>
          ))}
        </div>
      )}

      {items && !shown.length && <p className="filter-empty">{cat ? 'No products here yet.' : 'This category is not available right now.'}</p>}
      <div className="products-grid">
        {shown.map((p) => <ProductCard key={p.id} p={p} reveal={false} />)}
      </div>
    </section>
  )
}
