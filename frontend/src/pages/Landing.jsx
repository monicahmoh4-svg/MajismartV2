import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { 
  Droplets, ArrowRight, CheckCircle, MapPin, ShieldCheck, Wallet, Bell, 
  Smartphone, Waves, TrendingUp, Users, Clock, AlertCircle, Heart,
  Phone, BarChart3, Zap, Globe, Award, Activity, Thermometer, 
  Droplet, Gauge, Server, Database, Lock, CreditCard, MessageSquare,
  Wifi, ChevronRight, Play, Shield
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
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
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
      { threshold: 0.1 }
    )

    document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

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
      `}</style>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7 }}
        style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          padding: '20px 0',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: scrollY > 50 ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => window.scrollTo(0, 0)}>
            <div style={{
              width: '44px',
              height: '44px',
              background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)',
              animation: 'pulse 2s infinite'
            }}>
              <Droplets style={{ color: 'white', width: '26px', height: '26px' }} />
            </div>
            <span style={{ fontSize: '22px', fontWeight: '800', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MajiSmart</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/login" style={{
              padding: '12px 24px',
              background: 'transparent',
              border: '2px solid #0891b2',
              color: '#0891b2',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontSize: '15px',
              textDecoration: 'none'
            }} onMouseEnter={(e) => { e.target.style.background = '#0891b2'; e.target.style.color = 'white'; }}
              onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#0891b2'; }}>Sign In</Link>
            <Link to="/register" style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)',
              transition: 'all 0.3s',
              fontSize: '15px',
              textDecoration: 'none'
            }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(8, 145, 178, 0.4)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(8, 145, 178, 0.3)'; }}>Get Started</Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)'
      }}>
        {/* Background Image */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=1920&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.2,
          filter: 'blur(2px)'
        }}></div>
        
        {/* Animated Circles */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '400px',
          height: '400px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: '300px',
          height: '300px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ maxWidth: '850px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.2)',
              padding: '8px 16px',
              borderRadius: '50px',
              marginBottom: '24px',
              backdropFilter: 'blur(10px)',
              animation: 'fadeInDown 0.8s ease'
            }}>
              <span style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
              <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Trusted by 50,000+ Kenyans</span>
            </div>
            
            <h1 style={{
              margin: '0 0 24px 0',
              fontSize: 'clamp(40px, 8vw, 72px)',
              fontWeight: '900',
              lineHeight: '1.1',
              color: 'white',
              animation: 'fadeInUp 0.8s ease 0.2s both'
            }}>
              Smart Water Intelligence for{' '}
              <span style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                animation: 'glow 3s ease-in-out infinite'
              }}>Kenya</span>
            </h1>
            
            <p style={{
              margin: '0 0 40px 0',
              fontSize: '22px',
              opacity: '0.95',
              lineHeight: '1.7',
              color: 'white',
              maxWidth: '700px',
              animation: 'fadeInUp 0.8s ease 0.4s both'
            }}>
              Real-time monitoring, transparent data, and community-driven water management. Access clean water information from any device — smartphone or feature phone.
            </p>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', animation: 'fadeInUp 0.8s ease 0.6s both' }}>
              <Link to="/register" style={{
                padding: '18px 40px',
                background: 'white',
                color: '#0891b2',
                border: 'none',
                borderRadius: '12px',
                fontSize: '17px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                transition: 'all 0.3s',
                textDecoration: 'none'
              }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-4px)'; e.target.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)'; }}>
                Get Started Free <ArrowRight style={{ width: '22px', height: '22px' }} />
              </Link>
              <button style={{
                padding: '18px 40px',
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: '12px',
                fontSize: '17px',
                fontWeight: '700',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s'
              }} onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.25)'; e.target.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.15)'; e.target.style.transform = 'translateY(0)'; }}>
                <Play style={{ width: '20px', height: '20px', fill: 'white' }} /> Watch Demo
              </button>
            </div>

            {/* Trust Badges */}
            <div style={{ marginTop: '60px', display: 'flex', gap: '40px', flexWrap: 'wrap', animation: 'fadeInUp 0.8s ease 0.8s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.9)' }}>
                <CheckCircle style={{ width: '24px', height: '24px', color: '#4ade80' }} />
                <span style={{ fontSize: '15px', fontWeight: '600' }}>Free to use</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.9)' }}>
                <CheckCircle style={{ width: '24px', height: '24px', color: '#4ade80' }} />
                <span style={{ fontSize: '15px', fontWeight: '600' }}>No credit card required</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.9)' }}>
                <CheckCircle style={{ width: '24px', height: '24px', color: '#4ade80' }} />
                <span style={{ fontSize: '15px', fontWeight: '600' }}>Works on any phone</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
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
          opacity: 0.8
        }}>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>Scroll to explore</span>
          <ChevronRight style={{ width: '24px', height: '24px', transform: 'rotate(90deg)' }} />
        </div>
      </section>

      {/* Stats Section */}
      <section className="animate-on-scroll" id="stats" style={{
        padding: '100px 24px',
        background: 'white',
        position: 'relative',
        transform: `translateY(${isVisible['stats'] ? 0 : '50px'})`,
        opacity: isVisible['stats'] ? 1 : 0,
        transition: 'all 0.8s ease'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '40px',
            marginBottom: '80px'
          }}>
            {[
              { number: '50K+', label: 'Kenyans served', icon: Users, color: '#0891b2' },
              { number: '47', label: 'Counties covered', icon: Globe, color: '#06b6d4' },
              { number: '100%', label: 'Real-time data', icon: Activity, color: '#22d3ee' },
              { number: '24/7', label: 'Monitoring', icon: Clock, color: '#3b82f6' }
            ].map((stat, i) => (
              <div key={i} style={{
                textAlign: 'center',
                padding: '40px',
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s',
                transform: `translateY(${isVisible['stats'] ? 0 : '30px'})`,
                opacity: isVisible['stats'] ? 1 : 0,
                transitionDelay: `${i * 0.1}s`
              }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                <stat.icon style={{ width: '48px', height: '48px', color: stat.color, margin: '0 auto 20px' }} />
                <p style={{ margin: '0 0 8px 0', fontSize: '56px', fontWeight: '900', background: `linear-gradient(135deg, ${stat.color}, ${stat.color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.number}</p>
                <p style={{ margin: 0, fontSize: '16px', color: '#64748b', fontWeight: '600' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Image Showcase */}
          <div style={{
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            position: 'relative',
            height: '500px',
            backgroundImage: 'url("https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=1200&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.9), rgba(6, 182, 212, 0.8))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ textAlign: 'center', color: 'white', padding: '40px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '42px', fontWeight: '800' }}>Technology Meets Community</h3>
                <p style={{ margin: 0, fontSize: '20px', opacity: 0.95, maxWidth: '600px', margin: '0 auto' }}>Bridging the gap between advanced IoT monitoring and everyday water access needs across Kenya</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* USSD Section */}
      <section className="animate-on-scroll" id="ussd" style={{
        padding: '100px 24px',
        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
        position: 'relative',
        overflow: 'hidden',
        transform: `translateY(${isVisible['ussd'] ? 0 : '50px'})`,
        opacity: isVisible['ussd'] ? 1 : 0,
        transition: 'all 0.8s ease'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(8, 145, 178, 0.1)',
                padding: '8px 16px',
                borderRadius: '50px',
                marginBottom: '20px'
              }}>
                <Smartphone style={{ width: '18px', height: '18px', color: '#0891b2' }} />
                <span style={{ color: '#0891b2', fontSize: '14px', fontWeight: '700' }}>NO SMARTPHONE? NO PROBLEM</span>
              </div>
              
              <h2 style={{ margin: '0 0 20px 0', fontSize: '42px', fontWeight: '900', color: '#0f172a', lineHeight: '1.2' }}>
                Access MajiSmart on{' '}
                <span className="gradient-text">Any Phone</span>
              </h2>
              
              <p style={{ margin: '0 0 40px 0', fontSize: '18px', color: '#475569', lineHeight: '1.7' }}>
                Access MajiSmart via basic feature phones using USSD. Check water levels, report issues, and manage your account from any phone — no internet required.
              </p>
              
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                marginBottom: '30px'
              }}>
                <h3 style={{ margin: '0 0 30px 0', fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>How to Use MajiSmart on Any Phone</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {[
                    { step: '1', text: 'Dial *384*99# on your phone', icon: Phone },
                    { step: '2', text: 'Select Check Water Status or Report Issue', icon: MapPin },
                    { step: '3', text: 'Get instant information or submit your report', icon: CheckCircle }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '800',
                        fontSize: '18px',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)'
                      }}>{item.step}</div>
                      <div style={{ paddingTop: '8px' }}>
                        <p style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '600' }}>{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{
                background: '#0f172a',
                color: 'white',
                padding: '24px 32px',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.3)'
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.8 }}>USSD Code</p>
                <p style={{ margin: 0, fontSize: '42px', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '2px' }}>*384*99#</p>
              </div>
            </div>
            
            <div style={{
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              height: '700px',
              backgroundImage: 'url("https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '40px'
              }}>
                <div style={{ color: 'white', textAlign: 'center', width: '100%' }}>
                  <Smartphone style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.9 }} />
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Available on all networks</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.8 }}>Safaricom • Airtel • Telkom</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="animate-on-scroll" id="features" style={{
        padding: '100px 24px',
        background: 'white',
        transform: `translateY(${isVisible['features'] ? 0 : '50px'})`,
        opacity: isVisible['features'] ? 1 : 0,
        transition: 'all 0.8s ease'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
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
            <h2 style={{ margin: '0 0 16px 0', fontSize: '48px', fontWeight: '900', color: '#0f172a' }}>The Complete Water Ecosystem</h2>
            <p style={{ margin: 0, fontSize: '20px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>Everything you need to monitor, manage, and conserve water in a smart world.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
            {[
              { icon: Activity, title: 'Real-Time Monitoring', desc: 'Live water quality, pressure, and flow data from IoT sensors across the network.', color: '#0891b2', image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=600&q=80' },
              { icon: Shield, title: 'Transparent Data', desc: 'Blockchain-verified water usage records. No falsified readings or inflated bills.', color: '#06b6d4', image: 'https://images.unsplash.com/photo-1639762681485-074b7f413757?w=600&q=80' },
              { icon: MapPin, title: 'Find Water Points', desc: 'Locate nearest functional water points with real-time availability status.', color: '#22d3ee', image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80' },
              { icon: Users, title: 'Community Reports', desc: 'Report leaks, contamination, or infrastructure issues. Track resolution progress.', color: '#3b82f6', image: 'https://images.unsplash.com/photo-1573167243872-43c6433b9d40?w=600&q=80' },
              { icon: Wifi, title: 'Smart Metering', desc: 'IoT meters record data automatically. Pay only for what you use.', color: '#8b5cf6', image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80' },
              { icon: TrendingUp, title: 'Usage Analytics', desc: 'Track your consumption patterns, spending history, and conservation goals.', color: '#10b981', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80' }
            ].map((feature, i) => (
              <div key={i} style={{
                padding: '0',
                background: 'white',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                transition: 'all 0.3s',
                transform: `translateY(${isVisible['features'] ? 0 : '30px'})`,
                opacity: isVisible['features'] ? 1 : 0,
                transitionDelay: `${i * 0.1}s`
              }} className="card-hover" onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{
                  height: '200px',
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
                    padding: '16px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                  }}>
                    <feature.icon style={{ width: '32px', height: '32px', color: feature.color }} />
                  </div>
                </div>
                <div style={{ padding: '32px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{feature.title}</h3>
                  <p style={{ margin: 0, fontSize: '16px', color: '#64748b', lineHeight: '1.6' }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="animate-on-scroll" id="trust" style={{
        padding: '100px 24px',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        transform: `translateY(${isVisible['trust'] ? 0 : '50px'})`,
        opacity: isVisible['trust'] ? 1 : 0,
        transition: 'all 0.8s ease'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.1
        }}></div>
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(34, 211, 238, 0.2)',
              padding: '8px 16px',
              borderRadius: '50px',
              marginBottom: '20px'
            }}>
              <Award style={{ width: '18px', height: '18px', color: '#22d3ee' }} />
              <span style={{ color: '#22d3ee', fontSize: '14px', fontWeight: '700' }}>WHY CHOOSE US</span>
            </div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '48px', fontWeight: '900' }}>Trustless Water Management</h2>
            <p style={{ margin: 0, fontSize: '20px', opacity: '0.9', maxWidth: '700px', margin: '0 auto' }}>Every feature is anchored in transparency and accountability because water is a fundamental right.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            {[
              { icon: CheckCircle, title: 'Tamper-Proof Records', desc: 'Immutable water quality and usage data. No manipulation, no corruption.', stat: '99.9%', statLabel: 'Accuracy' },
              { icon: Globe, title: 'Nationwide Coverage', desc: 'From Nairobi to rural villages — connected infrastructure across all 47 counties.', stat: '47', statLabel: 'Counties' },
              { icon: Zap, title: 'Instant Alerts', desc: 'Real-time notifications for outages, contamination, or maintenance schedules.', stat: '<1s', statLabel: 'Response' },
              { icon: Heart, title: 'Community First', desc: 'Built by Kenyans, for Kenyans. Local insights, global technology.', stat: '50K+', statLabel: 'Users' }
            ].map((item, i) => (
              <div key={i} style={{
                padding: '40px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s'
              }} className="card-hover" onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <item.icon style={{ width: '48px', height: '48px', color: '#22d3ee', marginBottom: '20px' }} />
                <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '800' }}>{item.title}</h3>
                <p style={{ margin: '0 0 24px 0', fontSize: '16px', opacity: '0.85', lineHeight: '1.6' }}>{item.desc}</p>
                <div style={{
                  padding: '16px',
                  background: 'rgba(34, 211, 238, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(34, 211, 238, 0.2)'
                }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '32px', fontWeight: '900', color: '#22d3ee' }}>{item.stat}</p>
                  <p style={{ margin: 0, fontSize: '13px', opacity: '0.7' }}>{item.statLabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '120px 24px',
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
          <h2 style={{ margin: '0 0 20px 0', fontSize: '56px', fontWeight: '900', color: 'white', lineHeight: '1.1' }}>Ready to transform water access?</h2>
          <p style={{ margin: '0 0 40px 0', fontSize: '22px', opacity: '0.95', maxWidth: '600px', margin: '0 auto' }}>Join thousands of Kenyans already using MajiSmart for reliable water information.</p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              padding: '20px 48px',
              background: 'white',
              color: '#0891b2',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              transition: 'all 0.3s',
              textDecoration: 'none'
            }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-4px)'; e.target.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)'; }}>
              Create Free Account
            </Link>
            <button style={{
              padding: '20px 48px',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.5)',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s'
            }} onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.15)'; }}>
              Contact Sales
            </button>
          </div>
          <p style={{ margin: '24px 0 0 0', fontSize: '14px', opacity: '0.8' }}>✓ Free forever for citizens ✓ No credit card required ✓ Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', color: 'white', padding: '60px 24px 30px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '60px' }}>
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
          <div style={{ paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
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
