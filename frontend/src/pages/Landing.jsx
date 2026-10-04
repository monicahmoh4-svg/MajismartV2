import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { 
  Droplets, ArrowRight, CheckCircle, MapPin, ShieldCheck, Wallet, Bell, 
  Smartphone, Waves, TrendingUp, Users, Clock, AlertCircle, Heart,
  Phone, BarChart3, Zap, Globe, Award, Activity, Thermometer, 
  Droplet, Gauge, Server, Database, Lock, CreditCard, MessageSquare,
  Wifi, ChevronRight, Play, Shield, Star, Quote, Building2, Menu, X
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { WordReveal, Rotator, CountUp } from '../components/ui/TextAnimate'

const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 }
  }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
}

// Animated impact figure: "50K+" counts 0→50 then keeps its suffix.
function StatNumber({ value }) {  const m = String(value).match(/^([\d.]+)(.*)$/)
  if (!m) return <>{value}</>
  const target = Number(m[1])
  const decimals = m[1].includes('.') ? 1 : 0
  return (
    <>
      <CountUp
        value={target}
        duration={1400}
        format={(v) => (decimals ? v.toFixed(1) : Math.round(v).toLocaleString('en-KE'))}
      />
      {m[2]}
    </>
  )
}

function FaqList({ isMobile }) {
  const [open, setOpen] = useState(-1)
  const items = [
    {
      q: 'How do I pay for water?',
      a: 'Pick a water point, enter your Safaricom number and litres, then confirm the M-Pesa prompt on your phone. A 20-digit token appears instantly — type it on the meter keypad. One 20L jerrican costs about Ksh 2.50.',
    },
    {
      q: 'What does it cost?',
      a: 'Citizens pay per use (about Ksh 105/m³ piped, Ksh 2.50 per 20L at kiosks). Estates pay from Ksh 150 per meter per month; utilities from Ksh 45,000 per month. Exact tariffs follow each provider’s WASREB-approved schedule.',
    },
    {
      q: 'I lost my token SMS. Now what?',
      a: 'Open My Water → Token recovery, enter the same M-Pesa number, and your last 5 tokens reappear with one-tap copy. Tokens never expire until used.',
    },
    {
      q: 'No smartphone?',
      a: 'Dial *384*99# on any phone to buy water, check balances and get help over USSD and SMS. Nothing to install.',
    },
    {
      q: 'Who sees my data and reports?',
      a: 'Your county water office triages reports; technicians see only jobs assigned to them. Signup consent follows Kenya’s Data Protection Act, and location is used only to match you with nearby help.',
    },
    {
      q: 'How do technicians join and earn?',
      a: 'Operators and technicians sign up with national ID, documents and a work base. An admin verifies them before they can accept dispatched jobs, and completed jobs build a visible earnings record settled by the county.',
    },
  ]
  return (
    <div>
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i} style={{ borderBottom: '1px solid var(--hairline)' }}>
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 16, padding: '18px 4px', background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', fontSize: isMobile ? 15 : 17, fontWeight: 700, color: 'var(--ink)',
              }}
            >
              {item.q}
              <span style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                border: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .25s ease',
              }}>
                <ChevronRight size={16} style={{ transform: 'rotate(90deg)' }} />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <p style={{ margin: '0 0 18px 0', fontSize: isMobile ? 14 : 15.5, lineHeight: 1.65, color: 'var(--ash)', maxWidth: '68ch' }}>
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

function CountySpotlight({ isMobile }) {
  const [rows, setRows] = useState([])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    let alive = true
    import('../api').then(({ default: api }) => {
      api.get('/wasreb/water-balance').then((r) => {
        if (!alive || !Array.isArray(r)) return
        const top = [...r]
          .sort((a, b) => Number(b.revenue_ksh || 0) - Number(a.revenue_ksh || 0))
          .slice(0, 6)
        if (top.length) setRows(top)
      }).catch(() => {})
    })
    return () => { alive = false }
  }, [])
  useEffect(() => {
    if (paused || rows.length < 2) return undefined
    const id = setInterval(() => setIndex((i) => (i + 1) % rows.length), 4500)
    return () => clearInterval(id)
  }, [paused, rows.length])
  if (!rows.length) {
    return (
      <div className="ledger-card">
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ash)' }}>
          County figures appear here once utility data flows in.
        </p>
      </div>
    )
  }
  const c = rows[index % rows.length]
  return (
    <div
      className="ledger-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ padding: isMobile ? 20 : 28 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <span className="micro-label">{c.county} county</span>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 28 : 38, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.1, marginTop: 6 }}>
            Ksh {Number(c.revenue_ksh || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ash)', marginTop: 4 }}>collected · {c.points || 0} water points</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: Number(c.nrw_pct) > 25 ? '#d93025' : '#0d9e75' }} className="tnum">
            {c.nrw_pct}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--ash)' }}>non-revenue water</div>
        </div>
      </div>
      <div style={{ marginTop: 14, height: 8, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.max(0, Math.min(100, Number(c.nrw_pct) || 0))}%`,
          background: Number(c.nrw_pct) > 25 ? '#d93025' : '#0d9e75', borderRadius: 99,
          transition: 'width .6s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {rows.map((r, i) => (
            <button key={r.county + i} onClick={() => setIndex(i)} aria-label={`Show ${r.county}`}
              style={{
                width: i === index % rows.length ? 22 : 8, height: 8, borderRadius: 99, border: 'none',
                cursor: 'pointer', background: i === index % rows.length ? 'var(--ink)' : 'var(--smoke)',
                transition: 'all .25s ease', padding: 0,
              }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setIndex((index - 1 + rows.length) % rows.length)} aria-label="Previous county"
            style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--hairline)', background: 'white', cursor: 'pointer', fontSize: 15 }}>‹</button>
          <button onClick={() => setIndex((index + 1) % rows.length)} aria-label="Next county"
            style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--hairline)', background: 'white', cursor: 'pointer', fontSize: 15 }}>›</button>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  // Owner: replace with your real sales inbox. Used by every contact CTA.
  const CONTACT_EMAIL = 'info@majismart.co.ke'
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { scrollYProgress } = useScroll()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    handleResize()
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }))
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  return (
    <div style={{
      fontFamily: 'var(--font-sans)',
      color: 'var(--ink)', overflowX: 'hidden', background: 'var(--bone)',
      minHeight: '100vh'
    }}>

      <style>{`
        @keyframes float { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-20px); } }
        @keyframes pulse { 0%,100%{ opacity:1; } 50%{ opacity:0.5; } }
        @keyframes glow { 0%,100%{ filter:brightness(1); } 50%{ filter:brightness(1.2); } }
        @keyframes bounce { 0%,100%{ transform:translateX(-50%) translateY(0); } 50%{ transform:translateX(-50%) translateY(-10px); } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-30px); } to { opacity:1; transform:translateY(0); } }
        .glass-card { 
          background: rgba(255,255,255,0.9); 
          backdrop-filter: blur(20px) saturate(180%); 
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.5);
        }
        .gradient-text {
          background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .btn-primary {
          background: linear-gradient(135deg, #0891b2, #06b6d4);
          transition: all 0.3s ease;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(8, 145, 178, 0.4);
        }
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .hide-mobile { display: flex !important; }
          .show-mobile { display: none !important; }
        }
      `}</style>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7 }}
        style={{ 
          background: scrollY > 50 ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          padding: isMobile ? '16px 20px' : '20px 0',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: scrollY > 50 ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div style={{
              width: isMobile ? '36px' : '44px',
              height: isMobile ? '36px' : '44px',
              background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)',
              animation: 'pulse 2s infinite'
            }}>
              <Droplets style={{ color: 'white', width: isMobile ? '18px' : '26px', height: isMobile ? '18px' : '26px' }} />
            </div>
            {!isMobile && (
              <span style={{ fontSize: '22px', fontWeight: '800', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MajiSmart</span>
            )}
          </div>
          
          <div className="hide-mobile" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={() => navigate('/login')} style={{
              padding: '12px 24px',
              background: 'transparent',
              border: '2px solid #0891b2',
              color: '#0891b2',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontSize: '15px'
            }} onMouseEnter={(e) => { e.target.style.background = '#0891b2'; e.target.style.color = 'white'; }}
              onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#0891b2'; }}>Sign In</button>
            <button onClick={() => navigate('/register')} className="btn btn-primary" style={{
              padding: '12px 24px',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '15px'
            }}>Get Started</button>
          </div>

          <button 
            className="show-mobile"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px'
            }}
          >
            {mobileMenuOpen ? <X style={{ width: '24px', height: '24px', color: '#0f172a' }} /> : <Menu style={{ width: '24px', height: '24px', color: '#0f172a' }} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background: 'white',
                borderTop: '1px solid #e2e8f0',
                marginTop: '16px',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={() => { scrollToSection('features'); setMobileMenuOpen(false) }} style={{
                  padding: '12px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer',
                  borderRadius: '8px'
                }}>Features</button>
                <button onClick={() => { scrollToSection('ussd'); setMobileMenuOpen(false) }} style={{
                  padding: '12px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer',
                  borderRadius: '8px'
                }}>USSD Service</button>
                <button onClick={() => { scrollToSection('impact'); setMobileMenuOpen(false) }} style={{
                  padding: '12px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer',
                  borderRadius: '8px'
                }}>Impact</button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <button onClick={() => { navigate('/login'); setMobileMenuOpen(false) }} style={{
                    padding: '12px',
                    background: 'transparent',
                    border: '2px solid #0891b2',
                    color: '#0891b2',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '15px'
                  }}>Sign In</button>
                  <button onClick={() => { navigate('/register'); setMobileMenuOpen(false) }} className="btn-primary" style={{
                    padding: '12px',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '15px'
                  }}>Get Started</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section — real photography + liquid glass */}
      <section className="mesh-dark" style={{
        position: 'relative',
        minHeight: isMobile ? '92vh' : '94vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        padding: isMobile ? '80px 20px 60px' : '0'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("/images/landing-hero.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          opacity: 0.5,
          animation: 'ms-kenburns 32s ease-in-out infinite alternate'
        }} role="img" aria-label="Glass of clean drinking water"></div>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(100deg, rgba(6,18,31,0.95) 15%, rgba(6,18,31,0.62) 55%, rgba(11,59,63,0.30) 100%)'
        }}></div>
        
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: isMobile ? '200px' : '400px',
          height: isMobile ? '200px' : '400px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: isMobile ? '150px' : '300px',
          height: isMobile ? '150px' : '300px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '0 20px' : '0 24px', position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ maxWidth: '850px' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.12)',
                padding: '8px 16px',
                borderRadius: '50px',
                marginBottom: isMobile ? '20px' : '24px',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
                animation: 'fadeInDown 0.8s ease'
              }}
            >
              <span style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
              <span style={{ color: 'white', fontSize: isMobile ? '12px' : '14px', fontWeight: '600' }}>Trusted by 50,000+ Kenyans</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                margin: '0 0 24px 0',
                fontSize: isMobile ? 'clamp(34px, 8vw, 50px)' : 'clamp(44px, 7vw, 76px)',
                fontWeight: '600',
                lineHeight: '1.06',
                color: 'white',
                fontFamily: "'Fraunces', Georgia, serif",
                letterSpacing: '-0.01em',
              }}
            >
              <WordReveal text="Smart Water Intelligence for" delay={0.35} />{' '}
              <span style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                animation: 'glow 3s ease-in-out infinite'
              }}>Kenya</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{
                margin: '0 0 16px 0',
                fontSize: isMobile ? '16px' : '22px',
                opacity: '0.95',
                lineHeight: '1.7',
                color: 'white',
                maxWidth: '700px',
              }}
            >
              Real-time monitoring, transparent data, and community-driven water management. Access clean water information from any device — smartphone or feature phone.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 32px 0',
                fontSize: isMobile ? '14px' : '16px', color: 'white', fontWeight: 600,
              }}
            >
              <span style={{
                fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: '#0b3b3f', background: '#e4f222', borderRadius: 6, padding: '4px 10px',
              }}>
                Live now
              </span>
              <Rotator
                items={['Leak detection', 'M-Pesa billing', 'NRW analytics', 'Prepaid tokens', 'Vendor permits', 'AI forecasting']}
                style={{ color: '#fde68a' }}
              />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              style={{ display: 'flex', gap: isMobile ? '12px' : '20px', flexWrap: 'wrap' }}
            >
              <button onClick={() => navigate('/register')} className="btn btn-glow" style={{
                padding: isMobile ? '14px 28px' : '18px 40px',
                background: 'white',
                color: '#0891b2',
                border: 'none',
                borderRadius: '12px',
                fontSize: isMobile ? '15px' : '17px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                textDecoration: 'none'
              }}>
                Get Started Free <ArrowRight style={{ width: isMobile ? '18px' : '22px', height: isMobile ? '18px' : '22px' }} />
              </button>
              <button style={{
                padding: isMobile ? '14px 28px' : '18px 40px',
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: '12px',
                fontSize: isMobile ? '15px' : '17px',
                fontWeight: '700',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s'
              }} onClick={() => scrollToSection('features')} onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.25)'; e.target.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.15)'; e.target.style.transform = 'translateY(0)'; }}>
                <Play style={{ width: isMobile ? '16px' : '20px', height: isMobile ? '16px' : '20px', fill: 'white' }} /> Watch Demo
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              style={{ marginTop: isMobile ? '40px' : '60px', display: 'flex', gap: isMobile ? '20px' : '40px', flexWrap: 'wrap' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.9)' }}>
                <CheckCircle style={{ width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px', color: '#4ade80' }} />
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: '600' }}>Free to use</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.9)' }}>
                <CheckCircle style={{ width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px', color: '#4ade80' }} />
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: '600' }}>No credit card required</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.9)' }}>
                <CheckCircle style={{ width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px', color: '#4ade80' }} />
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: '600' }}>Works on any phone</span>
              </div>
            </motion.div>
          </div>
        </div>

        {!isMobile && (
          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'bounce 2s infinite',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            opacity: 0.8,
            cursor: 'pointer'
          }} onClick={() => scrollToSection('stats')}>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Scroll to explore</span>
            <ChevronRight style={{ width: '24px', height: '24px', transform: 'rotate(90deg)' }} />
          </div>
        )}
      </section>

      {/* Live facts ticker — obsidian band, honest static facts */}
      <div className="ticker" aria-label="MajiSmart facts">
        <div className="ticker-track">
          {[0, 1].map(copy => (
            <span key={copy} style={{ display: 'inline-flex' }} aria-hidden={copy === 1}>
              <span className="ticker-item"><span className="k">Non-revenue water</span><span className="v v-hi">48% nationally</span></span>
              <span className="ticker-item"><span className="k">Collection</span><span className="v">M-Pesa native</span></span>
              <span className="ticker-item"><span className="k">Fallback</span><span className="v">*384*99# USSD</span></span>
              <span className="ticker-item"><span className="k">Coverage</span><span className="v">47 counties</span></span>
              <span className="ticker-item"><span className="k">Standard</span><span className="v">WASREB-aligned KPIs</span></span>
              <span className="ticker-item"><span className="k">Tariff</span><span className="v v-hi">Ksh 2.50 / 20L</span></span>
            </span>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <section id="stats" className="animate-on-scroll" style={{
        padding: isMobile ? '60px 20px' : '100px 24px',
        background: 'white',
        position: 'relative',
        transform: `translateY(${isVisible['stats'] ? 0 : '50px'})`,
        opacity: isVisible['stats'] ? 1 : 0,
        transition: 'all 0.8s ease'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: isMobile ? '16px' : '40px',
            marginBottom: isMobile ? '40px' : '80px'
          }}>
            {[
              { number: '50K+', label: 'Kenyans served', icon: Users, color: '#0891b2' },
              { number: '47', label: 'Counties covered', icon: Globe, color: '#06b6d4' },
              { number: '100%', label: 'Real-time data', icon: Activity, color: '#22d3ee' },
              { number: '24/7', label: 'Monitoring', icon: Clock, color: '#3b82f6' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible['stats'] ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                style={{
                  textAlign: 'center',
                  padding: isMobile ? '24px' : '40px',
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s',
                }} 
                onMouseEnter={(e) => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'; } }}
                onMouseLeave={(e) => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(0)'; } }}
              >
                <stat.icon style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', color: stat.color, margin: '0 auto 20px' }} />
                <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '36px' : '56px', fontWeight: '900', background: `linear-gradient(135deg, ${stat.color}, ${stat.color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}><StatNumber value={stat.number} /></p>
                <p style={{ margin: 0, fontSize: isMobile ? '14px' : '16px', color: '#64748b', fontWeight: '600' }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible['stats'] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              position: 'relative',
              height: isMobile ? '300px' : '500px',
              backgroundImage: 'url("https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=1200&q=80")',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.9), rgba(6, 182, 212, 0.8))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: isMobile ? '20px' : '40px'
            }}>
              <div style={{ textAlign: 'center', color: 'white' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: isMobile ? '28px' : '42px', fontWeight: '800' }}>Technology Meets Community</h3>
                <p style={{ margin: '0 auto', fontSize: isMobile ? '16px' : '20px', opacity: 0.95, maxWidth: '600px' }}>Bridging the gap between advanced IoT monitoring and everyday water access needs across Kenya</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Field gallery — real photography from water work */}
      <section style={{
        padding: isMobile ? '60px 20px' : '100px 24px',
        background: 'white',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <span className="micro-label">From the field</span>
          <h2 className="font-display" style={{ margin: '8px 0 12px 0', fontSize: isMobile ? '30px' : '44px', fontWeight: '600', color: 'var(--ink)', lineHeight: 1.1 }}>
            Built where the water flows
          </h2>
          <p style={{ margin: '0 0 32px 0', fontSize: isMobile ? '15px' : '17px', color: 'var(--ash)', maxWidth: '640px' }}>
            Yard taps, vendor storage and safe handling — the everyday infrastructure MajiSmart keeps visible and billable.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '16px' : '24px' }}>
            {[
              { src: '/images/field-tap.jpg', alt: 'Person drawing water from a yard tap', caption: 'Yard taps & kiosk points' },
              { src: '/images/field-vendor.jpg', alt: 'Vendor with stored water barrels', caption: 'Vendors & licensed resellers' },
              { src: '/images/field-hands.jpg', alt: 'Hands receiving clean poured water', caption: 'Safe water at point of use' },
            ].map((g) => (
              <figure key={g.src} style={{ margin: 0, borderRadius: 16, overflow: 'hidden', position: 'relative', height: isMobile ? 200 : 240, border: '1px solid var(--hairline)' }}>
                <img src={g.src} alt={g.alt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <figcaption style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0, padding: '28px 16px 14px',
                  background: 'linear-gradient(transparent, rgba(6,18,31,0.82))',
                  color: 'white', fontSize: 14, fontWeight: 700,
                }}>
                  {g.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* County spotlight — live water-balance carousel */}
      <section style={{ padding: isMobile ? '60px 20px' : '96px 24px', background: 'var(--bone)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <span className="micro-label">Live network snapshot</span>
          <h2 className="font-display" style={{ margin: '8px 0 12px 0', fontSize: isMobile ? '30px' : '44px', fontWeight: '600', color: 'var(--ink)', lineHeight: 1.1 }}>
            Counties moving water today
          </h2>
          <p style={{ margin: '0 0 28px 0', fontSize: isMobile ? '15px' : '17px', color: 'var(--ash)', maxWidth: '620px' }}>
            Real production vs billed volumes per county — refreshed from live utility data.
          </p>
          <CountySpotlight isMobile={isMobile} />
        </div>
      </section>

      {/* USSD Section */}
      <section id="ussd" className="animate-on-scroll" style={{
        padding: isMobile ? '60px 20px' : '100px 24px',
        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
        position: 'relative',
        overflow: 'hidden',
        transform: `translateY(${isVisible['ussd'] ? 0 : '50px'})`,
        opacity: isVisible['ussd'] ? 1 : 0,
        transition: 'all 0.8s ease'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '40px' : '80px', alignItems: 'center' }}>
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={isVisible['ussd'] ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(8, 145, 178, 0.1)',
                  padding: '8px 16px',
                  borderRadius: '50px',
                  marginBottom: '20px'
                }}
              >
                <Smartphone style={{ width: '18px', height: '18px', color: '#0891b2' }} />
                <span style={{ color: '#0891b2', fontSize: '14px', fontWeight: '700' }}>NO SMARTPHONE? NO PROBLEM</span>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible['ussd'] ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{ margin: '0 0 20px 0', fontSize: isMobile ? '32px' : '42px', fontWeight: '900', color: '#0f172a', lineHeight: '1.2' }}
              >
                Access MajiSmart on{' '}
                <span className="gradient-text">Any Phone</span>
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible['ussd'] ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{ margin: '0 0 40px 0', fontSize: isMobile ? '16px' : '18px', color: '#475569', lineHeight: '1.7' }}
              >
                Access MajiSmart via basic feature phones using USSD. Check water levels, report issues, and manage your account from any phone — no internet required.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible['ussd'] ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: isMobile ? '24px' : '40px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  marginBottom: '30px'
                }}
              >
                <h3 style={{ margin: '0 0 30px 0', fontSize: isMobile ? '18px' : '22px', fontWeight: '800', color: '#0f172a' }}>How to Use MajiSmart on Any Phone</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
                  {[
                    { step: '1', text: 'Dial *384*99# on your phone', icon: Phone },
                    { step: '2', text: 'Select Check Water Status or Report Issue', icon: MapPin },
                    { step: '3', text: 'Get instant information or submit your report', icon: CheckCircle }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: isMobile ? '40px' : '48px',
                        height: isMobile ? '40px' : '48px',
                        background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '800',
                        fontSize: isMobile ? '16px' : '18px',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)'
                      }}>{item.step}</div>
                      <div style={{ paddingTop: isMobile ? '4px' : '8px' }}>
                        <p style={{ margin: 0, fontSize: isMobile ? '14px' : '16px', color: '#0f172a', fontWeight: '600' }}>{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible['ussd'] ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                style={{
                  background: '#0f172a',
                  color: 'white',
                  padding: isMobile ? '20px 24px' : '24px 32px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.3)'
                }}
              >
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.8 }}>USSD Code</p>
                <p style={{ margin: 0, fontSize: isMobile ? '32px' : '42px', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '2px' }}>*384*99#</p>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isVisible['ussd'] ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                height: isMobile ? '400px' : '700px',
                backgroundImage: 'url("https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}
            >
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: isMobile ? '24px' : '40px'
              }}>
                <div style={{ color: 'white', textAlign: 'center', width: '100%' }}>
                  <Smartphone style={{ width: isMobile ? '48px' : '64px', height: isMobile ? '48px' : '64px', margin: '0 auto 16px', opacity: 0.9 }} />
                  <p style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: '600' }}>Available on all networks</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: isMobile ? '13px' : '14px', opacity: 0.8 }}>Safaricom • Airtel • Telkom</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Impact Stories Section */}
      <section id="impact" className="animate-on-scroll" style={{
        padding: isMobile ? '60px 20px' : '100px 24px',
        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
        position: 'relative',
        transform: `translateY(${isVisible['impact'] ? 0 : '50px'})`,
        opacity: isVisible['impact'] ? 1 : 0,
        transition: 'all 0.8s ease'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible['impact'] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: isMobile ? '40px' : '80px' }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(8, 145, 178, 0.1)',
              padding: '8px 16px',
              borderRadius: '50px',
              marginBottom: '20px'
            }}>
              <Heart style={{ width: '18px', height: '18px', color: '#0891b2' }} />
              <span style={{ color: '#0891b2', fontSize: '14px', fontWeight: '700' }}>REAL IMPACT</span>
            </div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: isMobile ? '32px' : '48px', fontWeight: '900', color: '#0f172a' }}>Transforming Lives Across Kenya</h2>
            <p style={{ margin: '0 auto', fontSize: isMobile ? '16px' : '20px', color: '#64748b', maxWidth: '600px' }}>See how MajiSmart is making a difference in communities nationwide</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))', gap: isMobile ? '24px' : '32px' }}>
            {[
              {
                image: 'https://images.unsplash.com/photo-1594708723806-f5e7d4e04e7b?q=80&w=2574&auto=format&fit=crop',
                name: 'Mary Wanjiku',
                location: 'Kibera, Nairobi',
                quote: 'Before MajiSmart, I woke up at 3am daily to fetch water. Now I get alerts and sleep peacefully. It has changed my life.',
                role: 'Mother of 3'
              },
              {
                image: 'https://images.unsplash.com/photo-1531384441850-786b2da70a3c?q=80&w=2574&auto=format&fit=crop',
                name: 'James Ochieng',
                location: 'Kisumu County',
                quote: 'As a water vendor, MajiSmart helps me know when water is available. I save time and serve more customers efficiently.',
                role: 'Water Vendor'
              },
              {
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2574&auto=format&fit=crop',
                name: 'Grace Muthoni',
                location: 'Machakos',
                quote: 'The USSD service is a lifesaver. I dont need internet to check water status. Every Kenyan should use this.',
                role: 'Farmer'
              }
            ].map((story, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible['impact'] ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                style={{
                  background: 'white',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s'
                }} 
                className="card-hover"
                onMouseEnter={(e) => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.15)'; } }}
                onMouseLeave={(e) => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(0)'; } }}
              >
                <div style={{
                  height: isMobile ? '200px' : '280px',
                  backgroundImage: `url("${story.image}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: 'white',
                    padding: '8px 16px',
                    borderRadius: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Quote style={{ width: '16px', height: '16px', color: '#0891b2' }} />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0891b2' }}>Testimonial</span>
                  </div>
                </div>
                <div style={{ padding: isMobile ? '24px' : '32px' }}>
                  <p style={{ margin: '0 0 24px 0', fontSize: isMobile ? '14px' : '16px', color: '#475569', lineHeight: '1.7', fontStyle: 'italic' }}>"{story.quote}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: isMobile ? '48px' : '56px',
                      height: isMobile ? '48px' : '56px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '800',
                      fontSize: isMobile ? '18px' : '20px'
                    }}>{story.name.charAt(0)}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: '800', color: '#0f172a' }}>{story.name}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: isMobile ? '13px' : '14px', color: '#64748b' }}>{story.role} • {story.location}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="animate-on-scroll" style={{
        padding: isMobile ? '60px 20px' : '100px 24px',
        background: 'white',
        transform: `translateY(${isVisible['features'] ? 0 : '50px'})`,
        opacity: isVisible['features'] ? 1 : 0,
        transition: 'all 0.8s ease'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible['features'] ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: isMobile ? '40px' : '80px' }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(8, 145, 178, 0.1)',
              padding: '8px 16px',
              borderRadius: '50px',
              marginBottom: '20px'
            }}>
              <Zap style={{ width: '18px', height: '18px', color: '#0891b2' }} />
              <span style={{ color: '#0891b2', fontSize: '14px', fontWeight: '700' }}>POWERFUL FEATURES</span>
            </div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: isMobile ? '32px' : '48px', fontWeight: '900', color: '#0f172a' }}>The Complete Water Ecosystem</h2>
            <p style={{ margin: '0 auto', fontSize: isMobile ? '16px' : '20px', color: '#64748b', maxWidth: '600px' }}>Everything you need to monitor, manage, and conserve water in a smart world.</p>
          </motion.div>
          
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))', gap: isMobile ? '24px' : '32px' }}>
            {[
              { icon: Activity, title: 'Real-Time Monitoring', desc: 'Live water quality, pressure, and flow data from IoT sensors across the network.', color: '#0891b2', image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=600&q=80' },
              { icon: Shield, title: 'Transparent Data', desc: 'Blockchain-verified water usage records. No falsified readings or inflated bills.', color: '#06b6d4', image: 'https://images.unsplash.com/photo-1639762681485-074b7f413757?w=600&q=80' },
              { icon: MapPin, title: 'Find Water Points', desc: 'Locate nearest functional water points with real-time availability status.', color: '#22d3ee', image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80' },
              { icon: Users, title: 'Community Reports', desc: 'Report leaks, contamination, or infrastructure issues. Track resolution progress.', color: '#3b82f6', image: 'https://images.unsplash.com/photo-1573167243872-43c6433b9d40?w=600&q=80' },
              { icon: Wifi, title: 'Smart Metering', desc: 'IoT meters record data automatically. Pay only for what you use.', color: '#8b5cf6', image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80' },
              { icon: TrendingUp, title: 'Usage Analytics', desc: 'Track your consumption patterns, spending history, and conservation goals.', color: '#10b981', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80' }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible['features'] ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                style={{
                  padding: '0',
                  background: 'white',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                }} 
                className="card-hover"
                onMouseEnter={(e) => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)'; } }}
                onMouseLeave={(e) => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(0)'; } }}
              >
                <div style={{
                  height: isMobile ? '160px' : '200px',
                  backgroundImage: `url("${feature.image}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(135deg, ${feature.color}dd, ${feature.color}88)`
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'white',
                    padding: isMobile ? '12px' : '16px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                  }}>
                    <feature.icon style={{ width: isMobile ? '24px' : '32px', height: isMobile ? '24px' : '32px', color: feature.color }} />
                  </div>
                </div>
                <div style={{ padding: isMobile ? '24px' : '32px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: isMobile ? '18px' : '22px', fontWeight: '800', color: '#0f172a' }}>{feature.title}</h3>
                  <p style={{ margin: 0, fontSize: isMobile ? '14px' : '16px', color: '#64748b', lineHeight: '1.6' }}>{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section — real commercial tiers */}
      <section id="pricing" style={{
        padding: isMobile ? '60px 20px' : '100px 24px',
        background: 'var(--bone)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '48px' }}>
            <span className="micro-label">Commercial model</span>
            <h2 className="font-display" style={{ margin: '8px 0 12px 0', fontSize: isMobile ? '30px' : '44px', fontWeight: '600', color: 'var(--ink)', lineHeight: 1.1 }}>Pays for itself in recovered revenue</h2>
            <p style={{ margin: 0, fontSize: isMobile ? '15px' : '17px', color: 'var(--ash)', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>
              Citizens always free. Estates and utilities pay from the cash the platform recovers — not from new budgets.
            </p>
            <div style={{ marginTop: 18 }}>
              <button
                onClick={async () => {
                  const { generatePilotProposal } = await import('../lib/pilotProposal')
                  generatePilotProposal({ contactEmail: CONTACT_EMAIL })
                }}
                className="btn btn-outline btn-sm"
              >
                Download 90-day pilot proposal (PDF)
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '16px' : '24px' }}>
            {[
              { name: 'Citizens', price: 'Free', per: 'forever', blurb: 'Find water, report issues, track spending, recover tokens — smartphone or USSD.', cta: 'Create free account', act: () => navigate('/register'), featured: false },
              { name: 'Estates & Landlords', price: 'Ksh 150', per: '/ meter / month', blurb: 'Prepaid meters, Paybill auto-split, tenant tokens, zero-arrears billing. Hardware from Ksh 11,500 installed.', cta: 'Talk to sales', act: () => { window.location.href = `mailto:${CONTACT_EMAIL}?subject=Estate%20onboarding` }, featured: false },
              { name: 'Utilities & Counties', price: 'Ksh 45,000', per: '/ month', blurb: 'NRW analytics, WASREB KPIs, vendor permits, work orders. NRW Pro with 15% gain-share pilots.', cta: 'Talk to sales', act: () => { window.location.href = `mailto:${CONTACT_EMAIL}?subject=Utility%20pilot` }, featured: true },
            ].map(t => (
              <div key={t.name} className="ledger-card" style={t.featured ? { border: '2px solid var(--ink)', position: 'relative' } : undefined}>
                {t.featured && (
                  <span style={{ position: 'absolute', top: 16, right: 16, background: 'var(--hi)', color: 'var(--ink)', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 6 }}>MOST IMPACT</span>
                )}
                <div className="micro-label" style={{ marginBottom: 8 }}>{t.name}</div>
                <div style={{ fontSize: isMobile ? 30 : 36, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{t.price}</div>
                <div style={{ fontSize: 13, color: 'var(--ash)', marginBottom: 12 }}>{t.per}</div>
                <p style={{ fontSize: 14, color: 'var(--ash)', lineHeight: 1.6, margin: '0 0 20px 0' }}>{t.blurb}</p>
                <button onClick={t.act} className={t.featured ? 'btn btn-money' : 'btn btn-outline'} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>{t.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section — straight answers */}
      <section id="faq" style={{
        padding: isMobile ? '60px 20px' : '100px 24px',
        background: 'white',
      }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '28px' : '40px' }}>
            <span className="micro-label">Straight answers</span>
            <h2 className="font-display" style={{ margin: '8px 0 12px 0', fontSize: isMobile ? '30px' : '44px', fontWeight: '600', color: 'var(--ink)', lineHeight: 1.1 }}>Questions, answered honestly</h2>
          </div>
          <FaqList isMobile={isMobile} />
        </div>
      </section>

      {/* Rollout process — dark navy band, gold numerals */}
      <section style={{ background: 'var(--navy)', padding: isMobile ? '60px 20px' : '96px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <span className="eyebrow-gold rise-1">How rollout works</span>
          <h2 className="font-display rise-2" style={{ margin: '10px 0 12px 0', fontSize: isMobile ? '30px' : '44px', fontWeight: '600', color: 'white', lineHeight: 1.1 }}>
            From first call to flowing revenue in weeks
          </h2>
          <p className="rise-3" style={{ margin: '0 0 40px 0', fontSize: isMobile ? '15px' : '17px', color: 'rgba(255,255,255,.65)', maxWidth: '620px' }}>
            The same path behind every live deployment — scoped in days, proven in one DMA, then scaled county-wide.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: isMobile ? '14px' : '20px' }}>
            {[
              { n: '01', t: 'Scope', d: 'One call to agree the DMA, users and what is out of scope. Fixed written quote.' },
              { n: '02', t: 'Pilot', d: '90-day paid pilot: billing, mobile reading, M-Pesa reconciliation, WASREB reports.' },
              { n: '03', t: 'Prove', d: '−5 pts NRW in the pilot DMA in 90 days, or the SaaS fee is refunded.' },
              { n: '04', t: 'Scale', d: 'Annual plan, more DMAs, gain-share on incremental collection. Handover included.' },
            ].map((s, i) => (
              <div key={s.n} className={`rise-${Math.min(i + 1, 3)}`} style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: 22, background: 'rgba(255,255,255,.03)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'var(--gold)', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: '10px 0 6px 0' }}>{s.t}</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,.6)' }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: isMobile ? '80px 20px' : '120px 24px',
        background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          opacity: 0.3
        }}></div>
        
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ margin: '0 0 20px 0', fontSize: isMobile ? '32px' : '56px', fontWeight: '900', color: 'white', lineHeight: '1.1' }}
          >
            Ready to transform water access?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ margin: '0 auto 40px', fontSize: isMobile ? '16px' : '22px', opacity: '0.95', maxWidth: '600px' }}
          >
            Join thousands of Kenyans already using MajiSmart for reliable water information.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ display: 'flex', gap: isMobile ? '12px' : '20px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <button onClick={() => navigate('/register')} className="btn-primary" style={{
              padding: isMobile ? '16px 32px' : '20px 48px',
              background: 'white',
              color: '#0891b2',
              border: 'none',
              borderRadius: '12px',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              textDecoration: 'none'
            }} onClick={() => navigate('/register')}>
              Create Free Account
            </button>
            <button style={{
              padding: isMobile ? '16px 32px' : '20px 48px',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.5)',
              borderRadius: '12px',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '700',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s'
            }} onClick={() => { window.location.href = `mailto:${CONTACT_EMAIL}?subject=Sales%20enquiry` }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.15)'; }}>
              Contact Sales
            </button>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ margin: '24px 0 0 0', fontSize: isMobile ? '13px' : '14px', opacity: '0.8' }}
          >
            ✓ Free forever for citizens ✓ No credit card required ✓ Cancel anytime
          </motion.p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', color: 'white', padding: isMobile ? '40px 20px 30px' : '60px 24px 30px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', gap: isMobile ? '40px' : '40px', marginBottom: isMobile ? '40px' : '60px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplets style={{ color: 'white', width: '22px', height: '22px' }} />
                </div>
                <span style={{ fontSize: '20px', fontWeight: '800' }}>MajiSmart Kenya</span>
              </div>
              <p style={{ margin: 0, fontSize: '15px', opacity: 0.8, lineHeight: '1.6' }}>Empowering communities with real-time water intelligence across Kenya.</p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700' }}>Product</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Features', act: () => scrollToSection('features') },
                  { label: 'USSD Service', act: () => scrollToSection('ussd') },
                  { label: 'Pricing', act: () => scrollToSection('pricing') },
                  { label: 'Find Water', act: () => navigate('/find-water') },
                ].map((item) => (
                  <button key={item.label} onClick={item.act} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '14px', cursor: 'pointer' }} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}>{item.label}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700' }}>Get started</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Create account', act: () => navigate('/register') },
                  { label: 'Sign in', act: () => navigate('/login') },
                  { label: 'Contact sales', act: () => { window.location.href = `mailto:${CONTACT_EMAIL}?subject=Sales%20enquiry` } },
                  { label: 'Source code', act: () => window.open('https://github.com/monicahmoh4-svg/MajismartV2', '_blank', 'noopener') },
                ].map((item) => (
                  <button key={item.label} onClick={item.act} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '14px', cursor: 'pointer' }} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}>{item.label}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700' }}>Regulators</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'WASREB', href: 'https://wasreb.go.ke' },
                  { label: 'Data Protection (ODPC)', href: 'https://odpc.go.ke' },
                ].map((item) => (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}>{item.label}</a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: isMobile ? 'center' : 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>© 2026 MajiSmart Kenya. All rights reserved.</p>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <a href="https://github.com/monicahmoh4-svg/MajismartV2" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}>Open source</a>
              <span style={{ fontSize: '14px', opacity: 0.7 }}>
                Built for Kenya · 47 counties
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
