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
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif', 
      color: '#1e293b', overflowX: 'hidden', background: '#f8fafc',
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
          
          {/* Desktop Navigation */}
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
            <button onClick={() => navigate('/register')} className="btn-primary" style={{
              padding: '12px 24px',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '15px'
            }}>Get Started</button>
          </div>

          {/* Mobile Menu Button */}
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

        {/* Mobile Menu */}
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

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: isMobile ? '90vh' : '90vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)',
        padding: isMobile ? '80px 20px 60px' : '0'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=2574&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.2,
          filter: 'blur(2px)'
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
                background: 'rgba(255,255,255,0.2)',
                padding: '8px 16px',
                borderRadius: '50px',
                marginBottom: isMobile ? '20px' : '24px',
                backdropFilter: 'blur(10px)',
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
                fontSize: isMobile ? 'clamp(32px, 8vw, 48px)' : 'clamp(40px, 8vw, 72px)',
                fontWeight: '900',
                lineHeight: '1.1',
                color: 'white',
              }}
            >
              Smart Water Intelligence for{' '}
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
                margin: '0 0 40px 0',
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              style={{ display: 'flex', gap: isMobile ? '12px' : '20px', flexWrap: 'wrap' }}
            >
              <button onClick={() => navigate('/register')} className="btn-primary" style={{
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
              }} onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.25)'; e.target.style.transform = 'translateY(-4px)'; }}
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
                <p style={{ margin: '0 0 8px 0', fontSize: isMobile ? '36px' : '56px', fontWeight: '900', background: `linear-gradient(135deg, ${stat.color}, ${stat.color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.number}</p>
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
                <p style={{ margin: 0, fontSize: isMobile ? '16px' : '20px', opacity: 0.95, maxWidth: '600px', margin: '0 auto' }}>Bridging the gap between advanced IoT monitoring and everyday water access needs across Kenya</p>
              </div>
            </div>
          </motion.div>
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
            <p style={{ margin: 0, fontSize: isMobile ? '16px' : '20px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>See how MajiSmart is making a difference in communities nationwide</p>
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
            <p style={{ margin: 0, fontSize: isMobile ? '16px' : '20px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>Everything you need to monitor, manage, and conserve water in a smart world.</p>
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
            style={{ margin: '0 0 40px 0', fontSize: isMobile ? '16px' : '22px', opacity: '0.95', maxWidth: '600px', margin: '0 auto' }}
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
            }}>
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
            }} onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.25)'; }}
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
                {['Features', 'USSD Service', 'Pricing', 'API'].map((item) => (
                  <a key={item} href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}>{item}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700' }}>Company</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <a key={item} href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}>{item}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700' }}>Legal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Privacy', 'Terms', 'Security'].map((item) => (
                  <a key={item} href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}>{item}</a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: isMobile ? 'center' : 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>© 2026 MajiSmart Kenya. All rights reserved.</p>
            <div style={{ display: 'flex', gap: '20px' }}>
              {['Twitter', 'Facebook', 'LinkedIn', 'Instagram'].map((social) => (
                <a key={social} href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}>{social}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
