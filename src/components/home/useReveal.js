import { useEffect } from 'react'

/*
 * Scroll-reveal: fades up every [data-reveal] element inside the home
 * page as it enters the viewport. Re-runs whenever `deps` change (e.g.
 * after products/categories load from Supabase) so dynamic cards animate too.
 */
export default function useReveal(deps) {
  useEffect(() => {
    const els = document.querySelectorAll('.mh-home [data-reveal]')
    if (!els.length) return undefined

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('is-visible'))
      return undefined
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
