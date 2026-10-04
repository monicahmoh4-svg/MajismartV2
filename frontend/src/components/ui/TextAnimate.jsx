import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Word-by-word cinematic reveal: rise + de-blur, staggered.
export function WordReveal({ text, delay = 0, stagger = 0.07, className = '', style }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const words = String(text || '').split(' ').filter(Boolean)
  return (
    <span ref={ref} className={className} style={style}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          aria-hidden={i > 0}
          style={{ display: 'inline-block', willChange: 'transform, opacity, filter' }}
          initial={{ opacity: 0, y: '0.4em', filter: 'blur(8px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.55, delay: delay + i * stagger, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {w}{i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </span>
  )
}

// Streaming reply effect for the assistant: characters flow like typing,
// with a glowing caret. Instant when reduced-motion is preferred.
export function Typewriter({ text, speed = 12, chunk = 3, onDone, className = '', style }) {
  const full = String(text || '')
  const [n, setN] = useState(() => (prefersReduced() ? full.length : 0))
  useEffect(() => {
    setN(prefersReduced() ? full.length : 0)
    if (!full || prefersReduced()) return undefined
    const id = setInterval(() => {
      setN((v) => {
        if (v >= full.length) {
          clearInterval(id)
          if (onDone) setTimeout(onDone, 0)
          return v
        }
        return Math.min(full.length, v + chunk)
      })
    }, speed)
    return () => clearInterval(id)
  }, [full])
  const done = n >= full.length
  return (
    <span className={className} style={{ whiteSpace: 'pre-wrap', ...style }}>
      {full.slice(0, n)}
      {!done && <span className="type-caret" aria-hidden />}
    </span>
  )
}

// Animated counter for KPI figures: eases 0 → value on first view.
export function CountUp({ value, duration = 900, format, className = '', style }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })
  const target = Number(value) || 0
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return undefined
    if (prefersReduced()) {
      setN(target)
      return undefined
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(target * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, target, duration])
  const fmt = format || ((v) => Math.round(v).toLocaleString('en-KE'))
  return (
    <span ref={ref} className={`tnum ${className}`} style={style}>
      {fmt(n)}
    </span>
  )
}
