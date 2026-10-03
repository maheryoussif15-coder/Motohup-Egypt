import { useEffect, useRef, useState } from 'react'

/*
 * Cinematic intro: a neon motorcycle rides in, brakes at the glowing
 * MOTO HUB station sign, the sign pulses, the credit types in and the
 * intro fades out to reveal the website. Skippable, ~6.6s total.
 * Locks page scroll while playing.
 */
export default function Intro({ onDone }) {
  const [stopped, setStopped] = useState(false) // bike has braked
  const [lit, setLit] = useState(false)         // sign glow pulse
  const [leaving, setLeaving] = useState(false) // fading out
  const [typed, setTyped] = useState('')
  const timers = useRef([])

  const CREDIT = 'Setup by ABO-MAHER'

  useEffect(() => {
    const later = (fn, ms) => timers.current.push(setTimeout(fn, ms))

    // Users who prefer reduced motion skip the intro entirely
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDone()
      return undefined
    }

    document.body.classList.add('mh-locked')

    // t=2.6s — bike brakes (wheels stop, dust puff, headlight flicker)
    later(() => setStopped(true), 2600)
    // t=3.3s — the MOTO HUB sign lights up brighter
    later(() => setLit(true), 3300)
    // t=4.0s — type the credit line
    later(() => {
      let i = 0
      const tick = () => {
        setTyped(CREDIT.slice(0, (i += 1)))
        if (i <= CREDIT.length) timers.current.push(setTimeout(tick, 65))
      }
      tick()
    }, 4000)
    // t=6.6s — fade out and reveal the site
    later(() => finish(), 6600)

    return () => {
      timers.current.forEach(clearTimeout)
      document.body.classList.remove('mh-locked')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function finish() {
    timers.current.forEach(clearTimeout)
    setLeaving(true)
    document.body.classList.remove('mh-locked')
    setTimeout(onDone, 800) // wait for the CSS fade before unmounting
  }

  return (
    <div className={`intro${lit ? ' sign-lit' : ''}${stopped ? ' is-stopped' : ''}${leaving ? ' is-leaving' : ''}`} role="presentation">
      <button className="intro__skip" type="button" onClick={finish}>Skip &rarr;</button>

      <div className="intro__scene">
        {/* Station sign (bus-stop style) */}
        <div className="intro__station" aria-hidden="true">
          <div className="intro__sign">MOTO&nbsp;HUB</div>
          <div className="intro__post" />
        </div>

        {/* Speed / motion-blur streaks */}
        <div className="intro__speedlines" aria-hidden="true">
          <span /><span /><span /><span /><span /><span />
        </div>

        {/* Motorcycle (inline SVG silhouette, purple neon) */}
        <div className={`intro__bike${stopped ? ' is-stopped' : ''}`} aria-hidden="true">
          <svg viewBox="0 0 340 200" width="340" height="200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#A855F7" />
                <stop offset="1" stopColor="#7C3AED" />
              </linearGradient>
            </defs>

            {/* Headlight beam */}
            <polygon className="bike__beam" points="284,86 340,64 340,110" />

            {/* Rear wheel */}
            <g className="bike__wheel" style={{ transformOrigin: '88px 146px' }}>
              <circle cx="88" cy="146" r="36" className="bike__tire" />
              <circle cx="88" cy="146" r="21" className="bike__rim" />
              <g className="bike__spokes">
                <line x1="88" y1="127" x2="88" y2="165" />
                <line x1="69" y1="146" x2="107" y2="146" />
                <line x1="74" y1="132" x2="102" y2="160" />
                <line x1="102" y1="132" x2="74" y2="160" />
              </g>
            </g>

            {/* Front wheel */}
            <g className="bike__wheel" style={{ transformOrigin: '262px 146px' }}>
              <circle cx="262" cy="146" r="36" className="bike__tire" />
              <circle cx="262" cy="146" r="21" className="bike__rim" />
              <g className="bike__spokes">
                <line x1="262" y1="127" x2="262" y2="165" />
                <line x1="243" y1="146" x2="281" y2="146" />
                <line x1="248" y1="132" x2="276" y2="160" />
                <line x1="276" y1="132" x2="248" y2="160" />
              </g>
            </g>

            {/* Swingarm + fork */}
            <line x1="88" y1="146" x2="152" y2="132" className="bike__frame" strokeWidth="9" />
            <line x1="262" y1="146" x2="240" y2="76" className="bike__frame" strokeWidth="8" />

            {/* Body silhouette */}
            <path className="bike__body" fill="url(#bodyGrad)"
              d="M104,128 C108,98 132,76 164,68 L196,60 C218,55 234,63 241,78 L254,100 L270,108 L266,120 L244,112 L224,122 L146,128 Z" />
            <path className="bike__body" fill="url(#bodyGrad)" d="M104,128 L90,104 L122,98 L142,110 Z" />
            <path className="bike__body" fill="url(#bodyGrad)" d="M240,76 L262,70 L272,84 L256,94 Z" />
            <rect x="132" y="132" width="60" height="10" rx="5" className="bike__body" />
            <line x1="240" y1="76" x2="254" y2="62" className="bike__frame" strokeWidth="6" />
          </svg>
        </div>

        {/* Dust puff at the braking point */}
        <div className="intro__dust" aria-hidden="true"><span /><span /><span /></div>

        {/* Road */}
        <div className="intro__road" aria-hidden="true"><div className="intro__roadline" /></div>
      </div>

      {/* Credit line (typed) */}
      <p className="intro__credit"><span>{typed}</span><span className="intro__caret" /></p>
    </div>
  )
}
