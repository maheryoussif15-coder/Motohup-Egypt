import { timeAgo } from './ui'

export default function Overview({ feed, cats, prods, go }) {
  const { orders } = feed
  const newOrders = orders.filter((o) => (o.status || 'new') === 'new')
  const today = orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString())
  const stats = [
    { label: 'New orders', value: newOrders.length, hot: newOrders.length > 0, to: 'orders' },
    { label: 'Orders today', value: today.length, to: 'orders' },
    { label: 'Products live', value: prods.filter((p) => !p.hidden).length, sub: `${prods.filter((p) => p.hidden).length} hidden`, to: 'products' },
    { label: 'Categories live', value: cats.filter((c) => !c.hidden).length, sub: `${cats.filter((c) => c.hidden).length} hidden`, to: 'categories' },
  ]
  return (
    <>
      <header className="adm-head"><div><h1>Overview</h1><p>What needs your attention right now.</p></div></header>
      <div className="adm-stats">
        {stats.map((s) => (
          <button key={s.label} className={`adm-stat${s.hot ? ' is-hot' : ''}`} onClick={() => go(s.to)}>
            <span>{s.label}</span><strong>{s.value}</strong>{s.sub && <em>{s.sub}</em>}
          </button>
        ))}
      </div>

      <section className="adm-panel">
        <div className="adm-panel__head"><h2>Latest orders</h2><button className="adm-link" onClick={() => go('orders')}>See all orders</button></div>
        {!orders.length && <p className="adm-muted">No orders yet. When a customer orders from the site you will see it here and hear a sound.</p>}
        {orders.slice(0, 6).map((o) => (
          <div className="adm-row" key={o.id}>
            <span className={`adm-pill adm-pill--${o.status || 'new'}`}>{o.status || 'new'}</span>
            <div className="adm-row__main"><strong>{o.product_name}</strong><span>{o.customer_name} · {o.phone}</span></div>
            <time>{timeAgo(o.created_at)}</time>
          </div>
        ))}
      </section>
    </>
  )
}
