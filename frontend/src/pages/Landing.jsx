import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { 
  Droplets, ArrowRight, CheckCircle, MapPin, ShieldCheck, Wallet, Bell, 
  Smartphone, Waves, TrendingUp, Users, Clock, AlertCircle, Heart,
  Phone, BarChart3, Zap, Globe, Award
} from 'lucide-react'
import { useState, useEffect } from 'react'

const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
}

export default function Landing() {
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95])

  return (
    <div style={{ 
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif', 
      color: '#202124', overflowX: 'hidden', background: '#f8f9fa' 
    }}>

      <style>{`
        @keyframes float { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-20px); } }
        @keyframes pulse-glow { 0%,100%{ box-shadow: 0 0 30px rgba(13,158,117,0.5); } 50%{ box-shadow: 0 0 60px rgba(13,158,117,0.8); } }
        @keyframes wave { 0%{ transform: translateX(0) translateZ(0) scaleY(1); } 50%{ transform: translateX(-25%) translateZ(0) scaleY(0.8); } 100%{ transform: translateX(-50%) translateZ(0) scaleY(1); } }
        .glass-card { 
          background: rgba(255,255,255,0.75); 
          backdrop-filter: blur(24px) saturate(180%); 
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.4);
        }
        .glass-dark {
          background: rgba(8,17,30,0.75);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .gradient-text {
          background: linear-gradient(135deg, #1a7fd4 0%, #0d9e75 50%, #4dd0a8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200% auto;
          animation: gradient 5s ease infinite;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }
        .card-hover {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-12px) scale(1.03);
          box-shadow: 0 25px 50px rgba(0,0,0,0.15);
        }
        .stat-counter {
          background: linear-gradient(135deg, #1a7fd4, #0d9e75);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* NAV */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, 
          background: 'rgba(8,17,30,.9)', backdropFilter: 'blur(24px)', 
          padding: '0 32px', height: 75, display: 'flex', alignItems: 'center', 
          justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.15)'
        }}
      >
        <motion.div 
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <div style={{ 
            background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', 
            borderRadius: 14, width: 42, height: 42, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(26,127,212,0.45)'
          }}>
            <Droplets size={22} color="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>MajiSmart</span>
        </motion.div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Link to="/login" style={{ 
            color: 'rgba(255,255,255,.85)', fontSize: 14, fontWeight: 600, 
            textDecoration: 'none', padding: '10px 18px', borderRadius: 10,
            transition: 'all 0.3s ease'
          }}>Sign In</Link>
          <Link to="/register" style={{ 
            background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', 
            color: 'white', padding: '12px 26px', borderRadius: 12, 
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 6px 20px rgba(26,127,212,0.45)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
          paddingTop: 75, position: 'relative', overflow: 'hidden'
        }}
      >
        {/* HD Background Image - Kenyan community water point */}
        <motion.div 
          style={{ 
            position: 'absolute', inset: 0, 
            backgroundImage: "url('https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=2574&auto=format&fit=crop')",
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.3, zIndex: 0
          }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Overlay gradient */}
        <div style={{ 
          position: 'absolute', inset: 0, 
          background: 'linear-gradient(135deg, rgba(6,14,26,0.92) 0%, rgba(10,32,64,0.85) 50%, rgba(5,40,24,0.88) 100%)',
          zIndex: 1
        }} />

        {/* Animated water waves */}
        <motion.div 
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2 }}
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 1440 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            <path d="M0,75 C360,115 720,35 1080,75 C1260,95 1350,105 1440,100 L1440,150 L0,150 Z" fill="#f8f9fa" opacity="0.95" />
          </svg>
        </motion.div>

        {/* Hero Content */}
        <motion.div 
          style={{ 
            position: 'relative', zIndex: 10, padding: '120px 32px 160px', 
            maxWidth: 1200, margin: '0 auto', width: '100%'
          }}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Live badge */}
          <motion.div 
            variants={fadeInUp}
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 10, 
              background: 'rgba(13,158,117,0.18)', 
              border: '1.5px solid rgba(13,158,117,0.5)', 
              borderRadius: 99, padding: '10px 24px', marginBottom: 36,
              animation: 'pulse-glow 3.5s ease-in-out infinite'
            }}
          >
            <div style={{ 
              width: 10, height: 10, borderRadius: '50%', background: '#0d9e75',
              boxShadow: '0 0 0 0 rgba(13,158,117,0.7)',
              animation: 'pulse 2s ease-in-out infinite'
            }} />
            <span style={{ color: '#4dd0a8', fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>
              🇪 Live Across Kenya — Join 50,000+ Users
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1 
            variants={fadeInUp}
            style={{ 
              fontSize: 'clamp(40px,7vw,80px)', fontWeight: 900, 
              color: 'white', lineHeight: 1.02, marginBottom: 20, 
              letterSpacing: -2, maxWidth: 850
            }}
          >
            Water intelligence<br />
            <span className="gradient-text">
              for every Kenyan
            </span>
          </motion.h1>

          <motion.p 
            variants={fadeInUp}
            style={{ 
              fontSize: 'clamp(18px,2.4vw,22px)', color: 'rgba(255,255,255,.8)', 
              maxWidth: 650, lineHeight: 1.75, marginBottom: 16, fontWeight: 400
            }}
          >
            19 million Kenyans lack access to basic water. We're changing that.
          </motion.p>

          <motion.p 
            variants={fadeInUp}
            style={{ 
              fontSize: 'clamp(17px,2.2vw,20px)', color: 'rgba(255,255,255,.7)', 
              maxWidth: 650, lineHeight: 1.75, marginBottom: 48 
            }}
          >
            Get instant alerts when water comes back, find the nearest working water point, 
            track your spending, and never wake up at 3am to fill tanks again.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            variants={fadeInUp}
            style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 72 }}
          >
            <Link to="/register" style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 12, 
              background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', 
              color: 'white', padding: '18px 36px', borderRadius: 14, 
              fontWeight: 800, fontSize: 17, textDecoration: 'none', 
              boxShadow: '0 10px 35px rgba(26,127,212,0.55)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'
              e.currentTarget.style.boxShadow = '0 15px 45px rgba(26,127,212,0.65)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 10px 35px rgba(26,127,212,0.55)'
            }}
            >
              Start Free Today <ArrowRight size={20} />
            </Link>
            <Link to="/login" style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 12, 
              background: 'rgba(255,255,255,0.12)', color: 'white', 
              padding: '18px 36px', borderRadius: 14, fontWeight: 700, 
              fontSize: 17, textDecoration: 'none', 
              border: '1.5px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.3s ease'
            }}>
              <Phone size={18} />
              Try USSD: *384*99#
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div 
            variants={fadeInUp}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}
          >
            {[
              { icon: ShieldCheck, label: 'Trusted by 50K+ users', color: '#4dd0a8' },
              { icon: Award, label: 'Available in 47 counties', color: '#4facfe' },
              { icon: Zap, label: 'Real-time updates', color: '#ffd93d' },
            ].map(({ icon: Icon, label, color }, index) => (
              <motion.div 
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + (index * 0.15), duration: 0.5 }}
                style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: 10, 
                  background: 'rgba(255,255,255,0.12)', borderRadius: 99, 
                  padding: '10px 20px', border: '1px solid rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(12px)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                  e.currentTarget.style.transform = 'translateY(-3px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <Icon size={18} color={color} />
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,.9)', fontWeight: 600 }}>{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* STATISTICS SECTION */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9 }}
        style={{ padding: '100px 32px', background: 'white', position: 'relative' }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div 
            style={{ textAlign: 'center', marginBottom: 72 }}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.span 
              variants={fadeInUp}
              style={{ 
                color: '#d93025', fontWeight: 800, fontSize: 14, 
                textTransform: 'uppercase', letterSpacing: 2.5,
                display: 'inline-block', padding: '8px 20px',
                background: 'rgba(217,48,37,0.12)', borderRadius: 99,
                marginBottom: 16
              }}
            >
              The Water Crisis
            </motion.span>
            <motion.h2 
              variants={fadeInUp}
              style={{ 
                fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, 
                margin: '0 0 20px', lineHeight: 1.2, color: '#202124'
              }}
            >
              Why Kenya needs MajiSmart
            </motion.h2>
          </motion.div>

          <motion.div 
            style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', 
              gap: 28
            }}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {[
              { number: '19M', label: 'Kenyans lack basic water access', icon: AlertCircle, color: '#d93025' },
              { number: '63%', label: 'Experience water deprivation', icon: Users, color: '#1a7fd4' },
              { number: '9.9M', label: 'Drink from contaminated sources', icon: Droplets, color: '#0d9e75' },
              { number: '1/3 day', label: 'Women spend fetching water', icon: Clock, color: '#7a3fb5' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                variants={scaleIn}
                className="card-hover"
                style={{ 
                  padding: 36, borderRadius: 20, 
                  background: 'linear-gradient(135deg,#f8f9fa,#ffffff)',
                  border: '1.5px solid rgba(26,127,212,0.15)',
                  textAlign: 'center',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: `${stat.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <stat.icon size={32} color={stat.color} />
                </div>
                <div style={{ 
                  fontSize: 42, fontWeight: 900, marginBottom: 8,
                  background: `linear-gradient(135deg,${stat.color},${stat.color}88)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {stat.number}
                </div>
                <p style={{ fontSize: 15, color: '#5f6368', lineHeight: 1.6, fontWeight: 500 }}>
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* PROBLEM/SOLUTION SECTION WITH IMAGES */}
      <motion.section 
        style={{ padding: '100px 32px', background: '#f8f9fa' }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div 
            style={{ textAlign: 'center', marginBottom: 72 }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              style={{ 
                fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, 
                marginBottom: 20, color: '#202124'
              }}
            >
              Real problems.<br />
              <span className="gradient-text">Real solutions.</span>
            </motion.h2>
          </motion.div>

          {/* Problem 1 */}
          <motion.div 
            style={{ 
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, 
              alignItems: 'center', marginBottom: 80
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
                boxShadow: '0 8px 24px rgba(26,127,212,0.35)'
              }}>
                <Clock size={30} color="white" />
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, color: '#202124' }}>
                Wake up at 3am to fill tanks?
              </h3>
              <p style={{ fontSize: 16, color: '#5f6368', lineHeight: 1.75, marginBottom: 24 }}>
                Women and children spend up to one-third of their day fetching water in the hot sun. 
                MajiSmart sends you instant notifications the moment water comes back on — so you sleep through the night.
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 20, background: 'rgba(13,158,117,0.1)', borderRadius: 14, borderLeft: '4px solid #0d9e75' }}>
                <CheckCircle size={20} color="#0d9e75" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 15, color: '#0d6e56', lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
                  Get alerts before water arrives. Plan your day. Rest better.
                </p>
              </div>
            </motion.div>
            <motion.div 
              variants={scaleIn}
              style={{ 
                borderRadius: 24, overflow: 'hidden', 
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                height: 400
              }}
            >
              <img 
                src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=2570&auto=format&fit=crop"
                alt="Woman fetching water in Kenya"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </motion.div>
          </motion.div>

          {/* Problem 2 */}
          <motion.div 
            style={{ 
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, 
              alignItems: 'center', marginBottom: 80
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div 
              variants={scaleIn}
              style={{ 
                borderRadius: 24, overflow: 'hidden', 
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                height: 400, order: 1
              }}
            >
              <img 
                src="https://images.unsplash.com/photo-1605218427306-022ba6c5545f?q=80&w=2574&auto=format&fit=crop"
                alt="Water vendor in Kenya"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: 'linear-gradient(135deg,#d93025,#ff6b6b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
                boxShadow: '0 8px 24px rgba(217,48,37,0.35)'
              }}>
                <Wallet size={30} color="white" />
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, color: '#202124' }}>
                Paying 5× more during shortages?
              </h3>
              <p style={{ fontSize: 16, color: '#5f6368', lineHeight: 1.75, marginBottom: 24 }}>
                When water is scarce, prices skyrocket. MajiSmart shows you every working water point near you 
                with their current prices before you leave home — saving you money every single day.
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 20, background: 'rgba(217,48,37,0.1)', borderRadius: 14, borderLeft: '4px solid #d93025' }}>
                <CheckCircle size={20} color="#d93025" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 15, color: '#a52820', lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
                  Compare prices. Find the cheapest option. Save up to 80% on water costs.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Problem 3 */}
          <motion.div 
            style={{ 
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, 
              alignItems: 'center', marginBottom: 40
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: 'linear-gradient(135deg,#0d9e75,#4dd0a8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
                boxShadow: '0 8px 24px rgba(13,158,117,0.35)'
              }}>
                <ShieldCheck size={30} color="white" />
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, color: '#202124' }}>
                Is the water safe to drink?
              </h3>
              <p style={{ fontSize: 16, color: '#5f6368', lineHeight: 1.75, marginBottom: 24 }}>
                9.9 million Kenyans drink directly from contaminated sources. MajiSmart provides 
                plain-language safety status for your area: "Safe to drink" or "Boil first" — nothing complicated.
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 20, background: 'rgba(13,158,117,0.1)', borderRadius: 14, borderLeft: '4px solid #0d9e75' }}>
                <CheckCircle size={20} color="#0d9e75" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 15, color: '#0d6e56', lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
                  Protect your family. Know before you drink. Stay healthy.
                </p>
              </div>
            </motion.div>
            <motion.div 
              variants={scaleIn}
              style={{ 
                borderRadius: 24, overflow: 'hidden', 
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                height: 400
              }}
            >
              <img 
                src="https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=2574&auto=format&fit=crop"
                alt="Clean water access in Kenya"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* FEATURES GRID */}
      <motion.section 
        style={{ 
          padding: '100px 32px', 
          background: 'linear-gradient(135deg,#060e1a 0%,#0a2a50 100%)',
          position: 'relative', overflow: 'hidden'
        }}
      >
        {/* Background pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2576&auto=format&fit=crop')",
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.08, zIndex: 0
        }} />
        
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div 
            style={{ textAlign: 'center', marginBottom: 72 }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              style={{ 
                fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, 
                color: 'white', marginBottom: 20
              }}
            >
              Everything you need to<br />
              <span className="gradient-text">master your water</span>
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              style={{ 
                fontSize: 17, color: 'rgba(255,255,255,.7)', 
                maxWidth: 600, margin: '0 auto', lineHeight: 1.7
              }}
            >
              Powerful features designed for Kenyan households
            </motion.p>
          </motion.div>

          <motion.div 
            style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', 
              gap: 28
            }}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {[
              { 
                icon: Bell, 
                title: 'Smart Alerts', 
                desc: 'Instant notifications when water supply changes in your area. Never miss a drop.',
                color: '#4facfe'
              },
              { 
                icon: MapPin, 
                title: 'Find Water Near You', 
                desc: 'Real-time map showing all working water points with prices and distance.',
                color: '#0d9e75'
              },
              { 
                icon: BarChart3, 
                title: 'Usage Analytics', 
                desc: 'Track your water consumption patterns and identify waste over time.',
                color: '#4dd0a8'
              },
              { 
                icon: Wallet, 
                title: 'Cost Tracking', 
                desc: 'Monitor spending and find the most affordable water options in your area.',
                color: '#ffd93d'
              },
              { 
                icon: ShieldCheck, 
                title: 'Quality Checks', 
                desc: 'Real-time water safety status for your neighborhood with clear recommendations.',
                color: '#ff6b6b'
              },
              { 
                icon: Smartphone, 
                title: 'USSD Access', 
                desc: 'No smartphone? Dial *384*99# on any phone. Works on basic feature phones.',
                color: '#7a3fb5'
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                className="glass-card card-hover"
                style={{
                  padding: 36, borderRadius: 20, textAlign: 'center',
                  background: 'rgba(255,255,255,0.95)',
                  border: '1.5px solid rgba(255,255,255,0.5)'
                }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div style={{
                  width: 68, height: 68, borderRadius: 18,
                  background: `linear-gradient(135deg,${feature.color},${feature.color}88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: `0 10px 30px ${feature.color}40`
                }}>
                  <feature.icon size={32} color="white" />
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: '#202124', marginBottom: 12 }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: 14, color: '#5f6368', lineHeight: 1.7 }}>
                  {feature.desc}
                </p>
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
        transition={{ duration: 0.9 }}
        style={{ padding: '100px 32px', background: 'white', position: 'relative' }}
      >
        {/* Background decorative elements */}
        <div style={{
          position: 'absolute', top: -100, right: -100, width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(26,127,212,0.06) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: -100, left: -100, width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(13,158,117,0.06) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              style={{ 
                fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, 
                marginBottom: 16, color: '#202124'
              }}
            >
              How it works
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              style={{ 
                color: '#5f6368', marginBottom: 72, lineHeight: 1.75, fontSize: 17
              }}
            >
              Three simple steps. No hardware. No technical setup. Free forever.
            </motion.p>
          </motion.div>

          <motion.div 
            style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', 
              gap: 40
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
                title: 'Create free account', 
                desc: 'Sign up with your phone number and select your county. Takes 30 seconds.' 
              },
              { 
                step: '2', color: '#0d9e75', bg: '#e1f5ee', 
                icon: MapPin,
                title: 'Set your location', 
                desc: 'Pick your area. We monitor every water point and keep you updated automatically.' 
              },
              { 
                step: '3', color: '#7a3fb5', bg: '#f0e8fc', 
                icon: Bell,
                title: 'Stay informed', 
                desc: 'Get instant alerts, find water points, track spending. Control at your fingertips.' 
              },
            ].map((s, i) => (
              <motion.div 
                key={s.step} 
                variants={scaleIn}
                style={{ textAlign: 'center', position: 'relative' }}
              >
                <motion.div 
                  style={{ 
                    width: 80, height: 80, borderRadius: '50%', 
                    background: s.bg, color: s.color, 
                    fontWeight: 900, fontSize: 32, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    margin: '0 auto 24px', 
                    border: `3px solid ${s.color}40`,
                    boxShadow: `0 12px 30px ${s.color}30`
                  }}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  {s.step}
                </motion.div>
                <div style={{ 
                  fontSize: 20, fontWeight: 800, marginBottom: 12, color: '#202124'
                }}>{s.title}</div>
                <div style={{ 
                  fontSize: 15, color: '#5f6368', lineHeight: 1.75 
                }}>{s.desc}</div>
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
        transition={{ duration: 0.9 }}
        style={{ 
          padding: '120px 32px', 
          background: 'linear-gradient(135deg,#060e1a,#0a2a50)', 
          textAlign: 'center', position: 'relative', overflow: 'hidden'
        }}
      >
        {/* Animated background circles */}
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          style={{
            position: 'absolute', top: -250, right: -250, width: 700, height: 700,
            background: 'radial-gradient(circle, rgba(13,158,117,0.35) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none'
          }}
        />
        <motion.div 
          animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.18, 0.1] }}
          transition={{ duration: 12, repeat: Infinity, delay: 3 }}
          style={{
            position: 'absolute', bottom: -250, left: -250, width: 700, height: 700,
            background: 'radial-gradient(circle, rgba(26,127,212,0.35) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none'
          }}
        />

        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, type: "spring" }}
          >
            <div style={{
              width: 100, height: 100, borderRadius: 28,
              background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 32px',
              boxShadow: '0 15px 50px rgba(26,127,212,0.5)',
              animation: 'float 5s ease-in-out infinite'
            }}>
              <Droplets size={50} color="white" />
            </div>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.7 }}
            style={{ 
              fontSize: 'clamp(32px,5.5vw,52px)', fontWeight: 900, 
              color: 'white', marginBottom: 20, lineHeight: 1.15
            }}
          >
            Ready to take control<br />of your water?
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7 }}
            style={{ 
              color: 'rgba(255,255,255,.75)', lineHeight: 1.85, 
              marginBottom: 48, fontSize: 17, maxWidth: 550, margin: '0 auto 48px'
            }}
          >
            Join 50,000+ Kenyans using MajiSmart to save time, money, and stress. 
            Free forever. No credit card required.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.7 }}
            style={{ display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link to="/register" style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 12, 
              background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', 
              color: 'white', padding: '20px 44px', borderRadius: 16, 
              fontWeight: 800, fontSize: 18, textDecoration: 'none',
              boxShadow: '0 12px 40px rgba(26,127,212,0.55)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px) scale(1.06)'
              e.currentTarget.style.boxShadow = '0 18px 50px rgba(26,127,212,0.65)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(26,127,212,0.55)'
            }}
            >
              Create Free Account <ArrowRight size={22} />
            </Link>
            <Link to="/login" style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 10, 
              background: 'rgba(255,255,255,0.12)', color: 'white', 
              padding: '20px 44px', borderRadius: 16, fontWeight: 700, 
              fontSize: 18, textDecoration: 'none', 
              border: '2px solid rgba(255,255,255,0.35)',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.3s ease'
            }}>
              Sign In
            </Link>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.7 }}
            style={{ 
              color: 'rgba(255,255,255,.4)', fontSize: 14, marginTop: 28 
            }}
          >
            Demo: admin@majismart.ke / admin123
          </motion.p>
        </div>
      </motion.section>

      {/* FOOTER */}
      <footer style={{ 
        background: '#040a10', padding: '50px 32px 30px', textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.12)'
      }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          gap: 12, marginBottom: 16 
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(26,127,212,0.4)'
          }}>
            <Droplets size={22} color="white" />
          </div>
          <span style={{ 
            color: 'rgba(255,255,255,.85)', fontWeight: 800, fontSize: 20 
          }}>MajiSmart</span>
        </div>
        <p style={{ 
          color: 'rgba(255,255,255,.5)', fontSize: 14, lineHeight: 1.7, marginBottom: 8
        }}>
          Water intelligence for every Kenyan citizen
        </p>
        <p style={{ 
          color: 'rgba(255,255,255,.3)', fontSize: 13
        }}>
          © 2026 MajiSmart Kenya · Building a water-secure future
        </p>
      </footer>
    </div>
  )
}
