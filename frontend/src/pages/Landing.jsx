import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { 
  Droplets, ArrowRight, CheckCircle, MapPin, ShieldCheck, Wallet, Bell, 
  Smartphone, Waves, TrendingUp, Users, Clock, AlertCircle, Heart,
  Phone, BarChart3, Zap, Globe, Award, Activity, Thermometer, 
  Droplet, Gauge, Server, Database, Lock, CreditCard, MessageSquare
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
    transition: { staggerChildren: 0.12, delayChildren: 0.2 }
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
      color: '#1e293b', overflowX: 'hidden', background: '#f0f9ff' 
    }}>

      <style>{`
        @keyframes float { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-20px); } }
        @keyframes pulse-glow { 0%,100%{ box-shadow: 0 0 30px rgba(14,165,233,0.5); } 50%{ box-shadow: 0 0 60px rgba(14,165,233,0.8); } }
        @keyframes wave { 0%{ transform: translateX(0) translateZ(0) scaleY(1); } 50%{ transform: translateX(-25%) translateZ(0) scaleY(0.8); } 100%{ transform: translateX(-50%) translateZ(0) scaleY(1); } }
        .glass-card { 
          background: rgba(255,255,255,0.9); 
          backdrop-filter: blur(20px) saturate(180%); 
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.5);
        }
        .glass-dark {
          background: rgba(15,23,42,0.85);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .gradient-text {
          background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #14b8a6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200% auto;
          animation: gradient 6s ease infinite;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }
        .card-hover {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(14,165,233,0.2);
        }
        .water-wave {
          background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
        }
      `}</style>

      {/* NAV */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7 }}
        style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, 
          background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)', 
          padding: '0 32px', height: 75, display: 'flex', alignItems: 'center', 
          justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.2)'
        }}
      >
        <motion.div 
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
          whileHover={{ scale: 1.05 }}
        >
          <div style={{ 
            background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', 
            borderRadius: 14, width: 42, height: 42, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(14,165,233,0.4)'
          }}>
            <Droplets size={22} color="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 22 }}>MajiSmart</span>
        </motion.div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Link to="/login" style={{ 
            color: 'rgba(255,255,255,.9)', fontSize: 14, fontWeight: 600, 
            textDecoration: 'none', padding: '10px 18px', borderRadius: 10,
            transition: 'all 0.3s ease'
          }}>Sign In</Link>
          <Link to="/register" style={{ 
            background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', 
            color: 'white', padding: '12px 26px', borderRadius: 12, 
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 6px 20px rgba(14,165,233,0.4)'
          }}>
            Get Started Free
          </Link>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <motion.section 
        style={{ 
          minHeight: '100vh', 
          background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 40%,#0c4a6e 100%)', 
          display: 'flex', alignItems: 'center', 
          paddingTop: 75, position: 'relative', overflow: 'hidden'
        }}
      >
        {/* HD Background Image - Water Infrastructure */}
        <motion.div 
          style={{ 
            position: 'absolute', inset: 0, 
            backgroundImage: "url('https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=2670&auto=format&fit=crop')",
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.25, zIndex: 0
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        
        {/* Overlay */}
        <div style={{ 
          position: 'absolute', inset: 0, 
          background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,58,95,0.9) 50%, rgba(12,74,110,0.92) 100%)',
          zIndex: 1
        }} />

        {/* Animated waves */}
        <motion.div 
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2 }}
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <svg viewBox="0 0 1440 150" fill="none" style={{ display: 'block' }}>
            <path d="M0,75 C360,115 720,35 1080,75 C1260,95 1350,105 1440,100 L1440,150 L0,150 Z" fill="#f0f9ff" opacity="0.95" />
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
          <motion.div 
            variants={fadeInUp}
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 10, 
              background: 'rgba(6,182,212,0.15)', 
              border: '1.5px solid rgba(6,182,212,0.5)', 
              borderRadius: 99, padding: '10px 24px', marginBottom: 36,
              animation: 'pulse-glow 3.5s ease-in-out infinite'
            }}
          >
            <div style={{ 
              width: 10, height: 10, borderRadius: '50%', background: '#06b6d4',
              boxShadow: '0 0 0 0 rgba(6,182,212,0.7)',
              animation: 'pulse 2s ease-in-out infinite'
            }} />
            <span style={{ color: '#22d3ee', fontSize: 14, fontWeight: 700 }}>
              🇰🇪 Live Across Kenya — 50,000+ Users
            </span>
          </motion.div>

          <motion.h1 
            variants={fadeInUp}
            style={{ 
              fontSize: 'clamp(40px,7vw,80px)', fontWeight: 900, 
              color: 'white', lineHeight: 1.02, marginBottom: 20, 
              letterSpacing: -2, maxWidth: 850
            }}
          >
            Smart Water Intelligence<br />
            <span className="gradient-text">
              For Every Kenyan
            </span>
          </motion.h1>

          <motion.p 
            variants={fadeInUp}
            style={{ 
              fontSize: 'clamp(18px,2.4vw,22px)', color: 'rgba(255,255,255,.85)', 
              maxWidth: 650, lineHeight: 1.75, marginBottom: 16
            }}
          >
            19 million Kenyans lack access to basic water. We're changing that with IoT, AI, and blockchain.
          </motion.p>

          <motion.p 
            variants={fadeInUp}
            style={{ 
              fontSize: 'clamp(17px,2.2vw,20px)', color: 'rgba(255,255,255,.75)', 
              maxWidth: 650, lineHeight: 1.75, marginBottom: 48 
            }}
          >
            Real-time alerts, AI-powered leak detection, water quality monitoring, and seamless mobile payments — all in one platform.
          </motion.p>

          <motion.div 
            variants={fadeInUp}
            style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 72 }}
          >
            <Link to="/register" style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 12, 
              background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', 
              color: 'white', padding: '18px 36px', borderRadius: 14, 
              fontWeight: 800, fontSize: 17, textDecoration: 'none', 
              boxShadow: '0 10px 35px rgba(14,165,233,0.5)'
            }}>
              Start Free Today <ArrowRight size={20} />
            </Link>
            <Link to="/login" style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 12, 
              background: 'rgba(255,255,255,0.1)', color: 'white', 
              padding: '18px 36px', borderRadius: 14, fontWeight: 700, 
              fontSize: 17, textDecoration: 'none', 
              border: '1.5px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(12px)'
            }}>
              <Phone size={18} />
              USSD: *384*99#
            </Link>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}
          >
            {[
              { icon: ShieldCheck, label: 'Enterprise-grade Security', color: '#22d3ee' },
              { icon: Award, label: '47 Counties Covered', color: '#34d399' },
              { icon: Zap, label: 'Real-time Updates', color: '#fbbf24' },
            ].map(({ icon: Icon, label, color }) => (
              <motion.div 
                key={label}
                style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: 10, 
                  background: 'rgba(255,255,255,0.1)', borderRadius: 99, 
                  padding: '10px 20px', border: '1px solid rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(12px)'
                }}
              >
                <Icon size={18} color={color} />
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,.9)', fontWeight: 600 }}>{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* STATISTICS */}
      <motion.section 
        style={{ padding: '100px 32px', background: '#f0f9ff' }}
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
                color: '#0ea5e9', fontWeight: 800, fontSize: 14, 
                textTransform: 'uppercase', letterSpacing: 2.5,
                display: 'inline-block', padding: '8px 20px',
                background: 'rgba(14,165,233,0.1)', borderRadius: 99
              }}
            >
              The Water Crisis
            </motion.span>
            <motion.h2 
              variants={fadeInUp}
              style={{ 
                fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, 
                margin: '16px 0', color: '#1e293b'
              }}
            >
              Why Kenya Needs MajiSmart
            </motion.h2>
          </motion.div>

          <motion.div 
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 28 }}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { number: '19M', label: 'Kenyans lack basic water', icon: AlertCircle, color: '#0ea5e9' },
              { number: '63%', label: 'Experience water deprivation', icon: Users, color: '#06b6d4' },
              { number: '9.9M', label: 'Drink contaminated water', icon: Droplet, color: '#14b8a6' },
              { number: '1/3 day', label: 'Women spend fetching water', icon: Clock, color: '#0d9488' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                variants={scaleIn}
                className="card-hover"
                style={{ 
                  padding: 36, borderRadius: 20, background: 'white',
                  border: '1.5px solid rgba(14,165,233,0.15)',
                  textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
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
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                  {stat.number}
                </div>
                <p style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CORE FEATURES WITH IMAGES */}
      <motion.section 
        style={{ padding: '100px 32px', background: 'white' }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div 
            style={{ textAlign: 'center', marginBottom: 72 }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2 
              style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, color: '#1e293b', marginBottom: 16 }}
            >
              Comprehensive Water<br />
              <span className="gradient-text">Management Platform</span>
            </motion.h2>
          </motion.div>

          {/* Feature 1: IoT Monitoring */}
          <motion.div 
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', marginBottom: 80 }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24, boxShadow: '0 8px 24px rgba(14,165,233,0.35)'
              }}>
                <Gauge size={30} color="white" />
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, color: '#1e293b' }}>
                Real-Time IoT Monitoring
              </h3>
              <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.75, marginBottom: 24 }}>
                Smart sensors track water levels, flow rates, pressure, and quality 24/7. 
                Get instant alerts when water comes back on or when anomalies are detected.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Water level tracking', 'Flow rate monitoring', 'Pressure sensors', 'Quality metrics'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, color: '#334155' }}>
                    <CheckCircle size={18} color="#0ea5e9" />
                    <span style={{ fontSize: 15 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div 
              variants={scaleIn}
              style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', height: 420 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=2670&auto=format&fit=crop"
                alt="IoT water monitoring sensors"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </motion.div>
          </motion.div>

          {/* Feature 2: AI Analytics */}
          <motion.div 
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', marginBottom: 80 }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div 
              variants={scaleIn}
              style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', height: 420, order: 1 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1655720828006-7ae6b841fa0d?q=80&w=2574&auto=format&fit=crop"
                alt="AI-powered water analytics dashboard"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: 'linear-gradient(135deg,#8b5cf6,#a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24, boxShadow: '0 8px 24px rgba(139,92,246,0.35)'
              }}>
                <Activity size={30} color="white" />
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, color: '#1e293b' }}>
                AI-Powered Analytics
              </h3>
              <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.75, marginBottom: 24 }}>
                Machine learning algorithms detect leaks before they happen, forecast demand, 
                and provide actionable insights to optimize water distribution.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Leak detection', 'Demand forecasting', 'Anomaly detection', 'Predictive maintenance'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, color: '#334155' }}>
                    <CheckCircle size={18} color="#8b5cf6" />
                    <span style={{ fontSize: 15 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          {/* Feature 3: Mobile Payments */}
          <motion.div 
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', marginBottom: 40 }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: 'linear-gradient(135deg,#10b981,#34d399)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24, boxShadow: '0 8px 24px rgba(16,185,129,0.35)'
              }}>
                <CreditCard size={30} color="white" />
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, color: '#1e293b' }}>
                Seamless Mobile Payments
              </h3>
              <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.75, marginBottom: 24 }}>
                Pay for water using M-Pesa, Airtel Money, or credit cards. 
                Track spending, view bills, and manage subscriptions all in one place.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['M-Pesa integration', 'Airtel Money support', 'Card payments', 'Transaction history'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, color: '#334155' }}>
                    <CheckCircle size={18} color="#10b981" />
                    <span style={{ fontSize: 15 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div 
              variants={scaleIn}
              style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', height: 420 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2574&auto=format&fit=crop"
                alt="Mobile payment for water services"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* ALL FEATURES GRID */}
      <motion.section 
        style={{ 
          padding: '100px 32px', 
          background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)',
          position: 'relative'
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop')",
          backgroundSize: 'cover', opacity: 0.08
        }} />
        
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div 
            style={{ textAlign: 'center', marginBottom: 72 }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2 
              style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, color: 'white', marginBottom: 16 }}
            >
              Everything You Need to<br />
              <span className="gradient-text">Master Water Management</span>
            </motion.h2>
            <motion.p 
              style={{ fontSize: 17, color: 'rgba(255,255,255,.7)', maxWidth: 600, margin: '0 auto' }}
            >
              Comprehensive features for households, water vendors, and county governments
            </motion.p>
          </motion.div>

          <motion.div 
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { icon: MapPin, title: 'Water Point Mapping', desc: 'Find all working water points near you with real-time availability and pricing', color: '#0ea5e9' },
              { icon: Bell, title: 'Smart Alerts', desc: 'Instant notifications when water supply changes, leaks detected, or quality issues arise', color: '#06b6d4' },
              { icon: ShieldCheck, title: 'Quality Monitoring', desc: 'Real-time water safety status with pH, turbidity, and contamination alerts', color: '#14b8a6' },
              { icon: BarChart3, title: 'Usage Analytics', desc: 'Track consumption patterns, identify waste, and optimize usage over time', color: '#10b981' },
              { icon: Wallet, title: 'Cost Tracking', desc: 'Monitor spending, compare prices, and find the most affordable water options', color: '#8b5cf6' },
              { icon: Smartphone, title: 'USSD Access', desc: 'No smartphone? Dial *384*99# on any phone. Works on basic feature phones', color: '#f59e0b' },
              { icon: Database, title: 'Blockchain Records', desc: 'Tamper-proof transaction records and water credits on secure blockchain', color: '#0ea5e9' },
              { icon: Server, title: 'Cloud Infrastructure', desc: 'Enterprise-grade cloud hosting with 99.9% uptime and automatic backups', color: '#06b6d4' },
              { icon: Lock, title: 'Bank-Level Security', desc: 'End-to-end encryption, two-factor authentication, and secure data storage', color: '#14b8a6' },
              { icon: MessageSquare, title: 'AI Chat Assistant', desc: '24/7 AI-powered support to answer questions and provide insights', color: '#8b5cf6' },
              { icon: Thermometer, title: 'Water Quality', desc: 'Monitor temperature, pH levels, turbidity, and contamination indicators', color: '#10b981' },
              { icon: Globe, title: 'Multi-County Support', desc: 'Available across all 47 Kenyan counties with localized data and support', color: '#f59e0b' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                className="glass-card card-hover"
                style={{
                  padding: 32, borderRadius: 20, background: 'rgba(255,255,255,0.95)'
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: `linear-gradient(135deg,${feature.color},${feature.color}88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, boxShadow: `0 8px 20px ${feature.color}40`
                }}>
                  <feature.icon size={26} color="white" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* HOW IT WORKS */}
      <motion.section 
        style={{ padding: '100px 32px', background: '#f0f9ff' }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <motion.h2 
            style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, marginBottom: 16, color: '#1e293b' }}
          >
            How It Works
          </motion.h2>
          <motion.p 
            style={{ color: '#64748b', marginBottom: 72, fontSize: 17 }}
          >
            Three simple steps. No hardware. No technical setup. Free forever.
          </motion.p>

          <motion.div 
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 40 }}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { step: '1', color: '#0ea5e9', bg: '#e0f2fe', icon: Smartphone, title: 'Create Account', desc: 'Sign up with your phone number and select your county. Takes 30 seconds.' },
              { step: '2', color: '#06b6d4', bg: '#cffafe', icon: MapPin, title: 'Set Location', desc: 'Pick your area. We monitor every water point automatically.' },
              { step: '3', color: '#14b8a6', bg: '#ccfbf1', icon: Bell, title: 'Stay Informed', desc: 'Get alerts, find water, track spending. Control at your fingertips.' },
            ].map((s) => (
              <motion.div key={s.step} variants={scaleIn} style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: 80, height: 80, borderRadius: '50%', background: s.bg, color: s.color, 
                  fontWeight: 900, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  margin: '0 auto 24px', border: `3px solid ${s.color}40`, boxShadow: `0 12px 30px ${s.color}30`
                }}>
                  {s.step}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: '#1e293b' }}>{s.title}</div>
                <div style={{ fontSize: 15, color: '#64748b', lineHeight: 1.75 }}>{s.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section 
        style={{ 
          padding: '120px 32px', 
          background: 'linear-gradient(135deg,#0f172a,#1e3a5f)', 
          textAlign: 'center', position: 'relative'
        }}
      >
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div style={{
              width: 100, height: 100, borderRadius: 28,
              background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 32px', boxShadow: '0 15px 50px rgba(14,165,233,0.5)',
              animation: 'float 5s ease-in-out infinite'
            }}>
              <Droplets size={50} color="white" />
            </div>
          </motion.div>
          
          <motion.h2 
            style={{ fontSize: 'clamp(32px,5.5vw,52px)', fontWeight: 900, color: 'white', marginBottom: 20 }}
          >
            Ready to Transform<br />Water Access?
          </motion.h2>
          
          <motion.p 
            style={{ color: 'rgba(255,255,255,.75)', lineHeight: 1.85, marginBottom: 48, fontSize: 17 }}
          >
            Join 50,000+ Kenyans using MajiSmart to save time, money, and stress. 
            Free forever. No credit card required.
          </motion.p>
          
          <motion.div style={{ display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 12, 
              background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', 
              color: 'white', padding: '20px 44px', borderRadius: 16, 
              fontWeight: 800, fontSize: 18, textDecoration: 'none',
              boxShadow: '0 12px 40px rgba(14,165,233,0.5)'
            }}>
              Create Free Account <ArrowRight size={22} />
            </Link>
            <Link to="/login" style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 10, 
              background: 'rgba(255,255,255,0.1)', color: 'white', 
              padding: '20px 44px', borderRadius: 16, fontWeight: 700, 
              fontSize: 18, textDecoration: 'none', 
              border: '2px solid rgba(255,255,255,0.3)'
            }}>
              Sign In
            </Link>
          </motion.div>
          
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14, marginTop: 28 }}>
            Demo: admin@majismart.ke / admin123
          </p>
        </div>
      </motion.section>

      {/* FOOTER */}
      <footer style={{ background: '#020617', padding: '50px 32px 30px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Droplets size={22} color="white" />
          </div>
          <span style={{ color: 'rgba(255,255,255,.85)', fontWeight: 800, fontSize: 20 }}>MajiSmart</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 14, marginBottom: 8 }}>
          Water intelligence for every Kenyan citizen
        </p>
        <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
          © 2026 MajiSmart Kenya · Building a water-secure future
        </p>
      </footer>
    </div>
  )
}
