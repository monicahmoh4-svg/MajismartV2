import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Droplets, ArrowRight, CheckCircle, MapPin, ShieldCheck, Wallet, Bell, Smartphone, Waves, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'

const PROBLEMS = [
  {
    emoji: '😴',
    problem: 'Waking up at 3am to fill tanks',
    solution: 'Get a notification the moment water comes back on — so you sleep through the night.',
    color: '#1a7fd4',
  },
  {
    emoji: '💸',
    problem: 'Paying 5× the normal price during shortages',
    solution: 'See every working water point near you and their prices before you leave the house.',
    color: '#d93025',
  },
  {
    emoji: '🤢',
    problem: 'Not knowing if the water is safe to drink',
    solution: 'Plain-language safety status for your area. "Safe to drink" or "Boil first" — nothing complicated.',
    color: '#0d9e75',
  },
  {
    emoji: '',
    problem: 'Running out of water without warning',
    solution: 'Know your tank level and get an alert before it runs dry.',
    color: '#7a3fb5',
  },
  {
    emoji: '📄',
    problem: 'Water bills you can\'t understand or dispute',
    solution: 'See exactly what you\'ve spent on water this month and whether you\'re paying a fair price.',
    color: '#e8a020',
  },
  {
    emoji: '🔧',
    problem: 'No plumber at night when a pipe bursts',
    solution: 'Report the problem instantly and have it routed to the right county team immediately.',
    color: '#0d6e56',
  },
]

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 }
  }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
}

export default function Landing() {
  const [activeFeature, setActiveFeature] = useState(0)
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif', color: '#202124', overflowX: 'hidden', background: '#f8f9fa' }}>

      <style>{`
        @keyframes float { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-15px); } }
        @keyframes pulse-glow { 0%,100%{ box-shadow: 0 0 20px rgba(13,158,117,0.4); } 50%{ box-shadow: 0 0 40px rgba(13,158,117,0.7); } }
        @keyframes shimmer { 0%{ background-position: -1000px 0; } 100%{ background-position: 1000px 0; } }
        .glass-card { 
          background: rgba(255,255,255,0.7); 
          backdrop-filter: blur(20px) saturate(180%); 
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.3);
        }
        .glass-dark {
          background: rgba(8,17,30,0.7);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .gradient-text {
          background: linear-gradient(135deg, #1a7fd4 0%, #0d9e75 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .card-hover {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
      `}</style>

      {/* NAV */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, 
          background: 'rgba(8,17,30,.85)', backdropFilter: 'blur(20px)', 
          padding: '0 28px', height: 70, display: 'flex', alignItems: 'center', 
          justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <motion.div 
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <div style={{ 
            background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', 
            borderRadius: 12, width: 38, height: 38, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(26,127,212,0.4)'
          }}>
            <Droplets size={20} color="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 20, letterSpacing: -0.5 }}>MajiSmart</span>
        </motion.div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/login" style={{ 
            color: 'rgba(255,255,255,.8)', fontSize: 14, fontWeight: 500, 
            textDecoration: 'none', padding: '8px 16px', borderRadius: 8,
            transition: 'all 0.3s ease'
          }}>Sign In</Link>
          <Link to="/register" style={{ 
            background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', 
            color: 'white', padding: '10px 22px', borderRadius: 10, 
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 4px 15px rgba(26,127,212,0.4)',
            transition: 'all 0.3s ease'
          }}>
            Get Started Free
          </Link>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <motion.section 
        style={{ 
          minHeight: '100vh', 
          background: 'linear-gradient(135deg,#060e1a 0%,#0a2040 40%,#052818 100%)', 
          display: 'flex', alignItems: 'center', 
          paddingTop: 70, position: 'relative', overflow: 'hidden'
        }}
      >
        {/* HD Background Image - Kenyan Water Infrastructure */}
        <motion.div 
          style={{ 
            position: 'absolute', inset: 0, 
            backgroundImage: "url('https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=2574&auto=format&fit=crop')",
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.25, zIndex: 0
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Overlay gradient */}
        <div style={{ 
          position: 'absolute', inset: 0, 
          background: 'linear-gradient(135deg, rgba(6,14,26,0.9) 0%, rgba(10,32,64,0.8) 50%, rgba(5,40,24,0.85) 100%)',
          zIndex: 1
        }} />

        {/* Animated water wave SVG */}
        <motion.div 
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2 }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            <path d="M0,60 C360,100 720,20 1080,60 C1260,80 1350,90 1440,85 L1440,120 L0,120 Z" fill="#f8f9fa" opacity="0.9" />
          </svg>
        </motion.div>

        {/* Hero Content */}
        <motion.div 
          style={{ 
            position: 'relative', zIndex: 10, padding: '100px 28px 140px', 
            maxWidth: 1100, margin: '0 auto', width: '100%'
          }}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Live badge with pulse animation */}
          <motion.div 
            variants={fadeInUp}
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 8, 
              background: 'rgba(13,158,117,0.15)', 
              border: '1px solid rgba(13,158,117,0.4)', 
              borderRadius: 99, padding: '8px 20px', marginBottom: 32,
              animation: 'pulse-glow 3s ease-in-out infinite'
            }}
          >
            <div style={{ 
              width: 8, height: 8, borderRadius: '50%', background: '#0d9e75',
              boxShadow: '0 0 0 0 rgba(13,158,117,0.7)',
              animation: 'pulse 1.8s ease-in-out infinite'
            }} />
            <span style={{ color: '#4dd0a8', fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>
              Live in Kenya — Free to Join
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1 
            variants={fadeInUp}
            style={{ 
              fontSize: 'clamp(36px,6vw,72px)', fontWeight: 900, 
              color: 'white', lineHeight: 1.05, marginBottom: 16, 
              letterSpacing: -1.5, maxWidth: 750
            }}
          >
            Never wake up at 3am<br />
            <span style={{ 
              background: 'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              to fill your tank again.
            </span>
          </motion.h1>

          <motion.p 
            variants={fadeInUp}
            style={{ 
              fontSize: 'clamp(17px,2.2vw,21px)', color: 'rgba(255,255,255,.75)', 
              maxWidth: 600, lineHeight: 1.75, marginBottom: 40 
            }}
          >
            MajiSmart tells you the moment water comes back on in your area, 
            shows you the cheapest water point nearby, and alerts you before your tank runs dry.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            variants={fadeInUp}
            style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 60 }}
          >
            <Link to="/register" style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 10, 
              background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', 
              color: 'white', padding: '16px 32px', borderRadius: 12, 
              fontWeight: 700, fontSize: 16, textDecoration: 'none', 
              boxShadow: '0 8px 30px rgba(26,127,212,0.5)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(26,127,212,0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(26,127,212,0.5)'
            }}
            >
              Get water alerts free <ArrowRight size={18} />
            </Link>
            <Link to="/login" style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 10, 
              background: 'rgba(255,255,255,0.1)', color: 'white', 
              padding: '16px 32px', borderRadius: 12, fontWeight: 600, 
              fontSize: 16, textDecoration: 'none', 
              border: '1px solid rgba(255,255,255,0.25)',
              backdropFilter: 'blur(10px)'
            }}>
              Sign In
            </Link>
          </motion.div>

          {/* Feature badges */}
          <motion.div 
            variants={fadeInUp}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}
          >
            {[
              { icon: Bell, label: 'Real-time water alerts' },
              { icon: MapPin, label: 'Find water near you' },
              { icon: ShieldCheck, label: 'Water safety status' },
              { icon: Wallet, label: 'Track spending' },
            ].map(({ icon: Icon, label }, index) => (
              <motion.div 
                key={label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + (index * 0.1), duration: 0.4 }}
                style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: 8, 
                  background: 'rgba(255,255,255,0.1)', borderRadius: 99, 
                  padding: '8px 16px', border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <Icon size={16} color="#4dd0a8" />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', fontWeight: 500 }}>{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* PROBLEMS SECTION */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        style={{ padding: '100px 28px', background: '#f8f9fa' }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div 
            style={{ textAlign: 'center', marginBottom: 64 }}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.span 
              variants={fadeInUp}
              style={{ 
                color: '#d93025', fontWeight: 700, fontSize: 13, 
                textTransform: 'uppercase', letterSpacing: 2,
                display: 'inline-block', padding: '6px 16px',
                background: 'rgba(217,48,37,0.1)', borderRadius: 99
              }}
            >
              Real Problems. Real Solutions.
            </motion.span>
            <motion.h2 
              variants={fadeInUp}
              style={{ 
                fontSize: 'clamp(28px,4.5vw,44px)', fontWeight: 900, 
                margin: '16px 0 16px', lineHeight: 1.2, color: '#202124'
              }}
            >
              Water problems every Kenyan knows
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              style={{ 
                color: '#5f6368', maxWidth: 560, margin: '0 auto', 
                lineHeight: 1.75, fontSize: 16
              }}
            >
              We designed MajiSmart around the six water problems that cost Kenyans 
              money, time, and sleep every single week.
            </motion.p>
          </motion.div>

          <motion.div 
            style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', 
              gap: 24
            }}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {PROBLEMS.map((p, i) => (
              <motion.div 
                key={i}
                variants={scaleIn}
                className="card card-hover"
                style={{ 
                  padding: 28, borderRadius: 16, 
                  borderLeft: `5px solid ${p.color}`,
                  background: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 14, display: 'inline-block', animation: 'float 3s ease-in-out infinite' }}>{p.emoji}</div>
                <div style={{ 
                  fontSize: 16, fontWeight: 800, color: '#202124', 
                  marginBottom: 12, lineHeight: 1.4 
                }}>
                  "{p.problem}"
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle size={18} color={p.color} style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 14, color: '#5f6368', lineHeight: 1.65, margin: 0 }}>
                    {p.solution}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* HOW IT WORKS */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{ padding: '100px 28px', background: 'white', position: 'relative', overflow: 'hidden' }}
      >
        {/* Background decorative elements */}
        <div style={{
          position: 'absolute', top: -100, right: -100, width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(26,127,212,0.05) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: -100, left: -100, width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(13,158,117,0.05) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              style={{ 
                fontSize: 'clamp(28px,4.5vw,44px)', fontWeight: 900, 
                marginBottom: 16, color: '#202124'
              }}
            >
              How it works
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              style={{ 
                color: '#5f6368', marginBottom: 64, lineHeight: 1.75, fontSize: 16
              }}
            >
              Three steps and you're done. No hardware. No technical setup.
            </motion.p>
          </motion.div>

          <motion.div 
            style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', 
              gap: 32
            }}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {[
              { 
                step: '1', color: '#1a7fd4', bg: '#e8f4fd', 
                icon: Smartphone,
                title: 'Create a free account', 
                desc: 'Sign up with your phone number and tell us which county you live in. Takes 30 seconds.' 
              },
              { 
                step: '2', color: '#0d9e75', bg: '#e1f5ee', 
                icon: MapPin,
                title: 'Set your area', 
                desc: 'Pick your county. We\'ll monitor every water point in your area and keep you updated.' 
              },
              { 
                step: '3', color: '#7a3fb5', bg: '#f0e8fc', 
                icon: Bell,
                title: 'Stay informed', 
                desc: 'Get alerts when water comes back, find the nearest working point, and track your spending.' 
              },
            ].map((s, i) => (
              <motion.div 
                key={s.step} 
                variants={scaleIn}
                style={{ textAlign: 'center', position: 'relative' }}
              >
                {/* Connector line */}
                {i < 2 && (
                  <div style={{
                    position: 'absolute', top: 28, left: '60%', width: '80%', height: 2,
                    background: `linear-gradient(90deg, ${s.color}40, transparent)`,
                    display: 'none', '@media (min-width: 768px)': { display: 'block' }
                  }} />
                )}
                <motion.div 
                  style={{ 
                    width: 64, height: 64, borderRadius: '50%', 
                    background: s.bg, color: s.color, 
                    fontWeight: 900, fontSize: 26, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    margin: '0 auto 20px', 
                    border: `3px solid ${s.color}30`,
                    boxShadow: `0 8px 24px ${s.color}25`
                  }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  {s.step}
                </motion.div>
                <div style={{ 
                  fontSize: 17, fontWeight: 800, marginBottom: 10, color: '#202124'
                }}>{s.title}</div>
                <div style={{ 
                  fontSize: 14, color: '#5f6368', lineHeight: 1.7 
                }}>{s.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* FEATURES SHOWCASE */}
      <motion.section 
        style={{ 
          padding: '100px 28px', 
          background: 'linear-gradient(135deg,#060e1a 0%,#0a2a50 100%)',
          position: 'relative', overflow: 'hidden'
        }}
      >
        {/* Background pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2576&auto=format&fit=crop')",
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.1, zIndex: 0
        }} />
        
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div 
            style={{ textAlign: 'center', marginBottom: 64 }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              style={{ 
                fontSize: 'clamp(28px,4.5vw,44px)', fontWeight: 900, 
                color: 'white', marginBottom: 16
              }}
            >
              Everything you need to<br />
              <span className="gradient-text">master your water</span>
            </motion.h2>
          </motion.div>

          <motion.div 
            style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', 
              gap: 24
            }}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {[
              { icon: Waves, title: 'Smart Alerts', desc: 'Instant notifications when water supply changes in your area' },
              { icon: TrendingUp, title: 'Usage Analytics', desc: 'Track your water consumption patterns over time' },
              { icon: ShieldCheck, title: 'Quality Checks', desc: 'Real-time water safety status for your neighborhood' },
              { icon: Wallet, title: 'Cost Tracking', desc: 'Monitor spending and find the most affordable options' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                className="glass-card"
                style={{
                  padding: 32, borderRadius: 20, textAlign: 'center',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div style={{
                  width: 60, height: 60, borderRadius: 16,
                  background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 24px rgba(26,127,212,0.3)'
                }}>
                  <feature.icon size={28} color="white" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#202124', marginBottom: 8 }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: 14, color: '#5f6368', lineHeight: 1.6 }}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA SECTION */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{ 
          padding: '100px 28px', 
          background: 'linear-gradient(135deg,#060e1a,#0a2a50)', 
          textAlign: 'center', position: 'relative', overflow: 'hidden'
        }}
      >
        {/* Animated background circles */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{
            position: 'absolute', top: -200, right: -200, width: 600, height: 600,
            background: 'radial-gradient(circle, rgba(13,158,117,0.3) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none'
          }}
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          style={{
            position: 'absolute', bottom: -200, left: -200, width: 600, height: 600,
            background: 'radial-gradient(circle, rgba(26,127,212,0.3) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none'
          }}
        />

        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 12px 40px rgba(26,127,212,0.4)',
              animation: 'float 4s ease-in-out infinite'
            }}>
              <Droplets size={40} color="white" />
            </div>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{ 
              fontSize: 'clamp(28px,4.5vw,44px)', fontWeight: 900, 
              color: 'white', marginBottom: 16 
            }}
          >
            Stop guessing. Start knowing.
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ 
              color: 'rgba(255,255,255,.7)', lineHeight: 1.8, 
              marginBottom: 40, fontSize: 16 
            }}
          >
            Join thousands of Kenyans using MajiSmart to take control of their water — for free.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Link to="/register" style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 10, 
              background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', 
              color: 'white', padding: '18px 40px', borderRadius: 14, 
              fontWeight: 800, fontSize: 17, textDecoration: 'none',
              boxShadow: '0 10px 35px rgba(26,127,212,0.5)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'
              e.currentTarget.style.boxShadow = '0 15px 45px rgba(26,127,212,0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 10px 35px rgba(26,127,212,0.5)'
            }}
            >
              Create Free Account <ArrowRight size={20} />
            </Link>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            style={{ 
              color: 'rgba(255,255,255,.35)', fontSize: 13, marginTop: 20 
            }}
          >
            Demo: admin@majismart.ke / admin123
          </motion.p>
        </div>
      </motion.section>

      {/* FOOTER */}
      <footer style={{ 
        background: '#040a10', padding: '40px 28px', textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          gap: 10, marginBottom: 12 
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Droplets size={18} color="white" />
          </div>
          <span style={{ 
            color: 'rgba(255,255,255,.7)', fontWeight: 800, fontSize: 16 
          }}>MajiSmart</span>
        </div>
        <p style={{ 
          color: 'rgba(255,255,255,.35)', fontSize: 13, lineHeight: 1.6 
        }}>
          © 2026 MajiSmart Kenya · Water intelligence for every citizen
        </p>
      </footer>
    </div>
  )
}
