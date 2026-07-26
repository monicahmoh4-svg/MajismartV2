import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, MapPin, Smartphone, Shield, TrendingUp, Users, Wifi, CheckCircle, ArrowRight, Activity, Globe, Zap, Menu, X, Phone, Heart, BarChart3, CloudRain } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Home() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Preload background image
    const img = new Image();
    img.src = 'https://images.unsplash.com/photo-1516026672771-29f0a8008ac6?w=1920&q=80';
    img.onload = () => setImageLoaded(true);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const features = [
    {
      icon: Activity,
      title: "Real-Time Water Monitoring",
      description: "Access live water quality data, pressure levels, and flow rates from IoT sensors deployed across Kenya.",
      color: "#0891b2",
      image: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800&q=80"
    },
    {
      icon: MapPin,
      title: "Find Nearest Water Points",
      description: "Locate functional water points near you with real-time availability status and directions.",
      color: "#06b6d4",
      image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80"
    },
    {
      icon: Smartphone,
      title: "USSD Access - No Internet",
      description: "Dial *384*99# from any phone to check water status. Perfect for areas with limited connectivity.",
      color: "#22d3ee",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80"
    },
    {
      icon: Users,
      title: "Community Reporting",
      description: "Report water leaks, contamination, or infrastructure issues. Track resolution progress.",
      color: "#3b82f6",
      image: "https://images.unsplash.com/photo-1573167243872-43c6433b9d40?w=800&q=80"
    },
    {
      icon: Shield,
      title: "Transparent & Verified",
      description: "Blockchain-verified water usage records ensure no falsified readings or inflated bills.",
      color: "#8b5cf6",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f413757?w=800&q=80"
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description: "Track consumption patterns, spending history, and get AI-powered recommendations.",
      color: "#10b981",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
    }
  ];

  const stats = [
    { number: "10M+", label: "Kenyans Served", icon: Users, color: "#0891b2" },
    { number: "47", label: "Counties Covered", icon: Globe, color: "#06b6d4" },
    { number: "100%", label: "Real-Time Data", icon: Activity, color: "#22d3ee" },
    { number: "24/7", label: "Monitoring", icon: Zap, color: "#3b82f6" }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', overflowX: 'hidden' }}>
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          background: scrollY > 50 ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          padding: '16px 0',
          position: 'fixed',
          top: 0,
          width: '100%',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} 
            onClick={() => window.scrollTo(0, 0)}
          >
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)' }}>
              <Droplets style={{ color: 'white', width: '22px', height: '22px' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>MajiSmart</span>
          </motion.div>
          
          <div className="hide-mobile" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')} 
              style={{ padding: '10px 20px', background: 'transparent', border: '1.5px solid #0891b2', color: '#0891b2', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
            >Sign In</motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')} 
              style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)', fontSize: '14px' }}
            >Get Started</motion.button>
          </div>

          <button 
            className="show-mobile"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}
          >
            {mobileMenuOpen ? <X style={{ width: '24px', height: '24px' }} /> : <Menu style={{ width: '24px', height: '24px' }} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="show-mobile" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            borderBottom: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} 
              style={{ padding: '12px', background: 'transparent', border: '2px solid #0891b2', color: '#0891b2', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '15px' }}
            >Sign In</motion.button>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => { navigate('/register'); setMobileMenuOpen(false); }} 
              style={{ padding: '12px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '15px' }}
            >Get Started</motion.button>
          </div>
        )}
      </motion.nav>

      {/* Hero Section with HD Kenya Background */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        paddingTop: '80px',
        background: imageLoaded 
          ? `linear-gradient(135deg, rgba(8, 145, 178, 0.85) 0%, rgba(6, 182, 212, 0.80) 50%, rgba(186, 230, 253, 0.85) 100%), url('https://images.unsplash.com/photo-1516026672771-29f0a8008ac6?w=1920&q=80')`
          : 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #bae6fd 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        {/* Animated Blobs */}
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: 'absolute', top: '10%', right: '10%', width: '400px', height: '400px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 1 }} 
        />
        <motion.div 
          animate={{ x: [0, -30, 0], y: [0, 50, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: 'absolute', bottom: '10%', left: '5%', width: '300px', height: '300px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 1 }} 
        />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 2, width: '100%' }}>
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            style={{ maxWidth: '800px' }}
          >
            <motion.div variants={fadeInUp} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.95)', padding: '8px 16px', borderRadius: '50px',
              marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
              <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: '600' }}>Trusted by 10M+ Kenyans</span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} style={{
              margin: '0 0 24px 0', fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: '800', lineHeight: '1.1', color: 'white',
              textShadow: '0 2px 20px rgba(0,0,0,0.2)'
            }}>
              Smart Water Intelligence for{' '}
              <span style={{ display: 'inline-block', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Kenya</span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} style={{
              margin: '0 0 40px 0', fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'rgba(255,255,255,0.95)', lineHeight: '1.6', maxWidth: '600px',
              textShadow: '0 1px 10px rgba(0,0,0,0.1)'
            }}>
              Real-time monitoring, transparent data, and community-driven water management. Access clean water information from any device.
            </motion.p>
            
            <motion.div variants={fadeInUp} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }} 
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')} 
                style={{ padding: '18px 36px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 30px rgba(251, 191, 36, 0.4)' }}
              >
                Get Started Free <ArrowRight style={{ width: '20px', height: '20px' }} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.95)" }} 
                whileTap={{ scale: 0.95 }}
                style={{ padding: '18px 36px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
              >
                Explore Features
              </motion.button>
            </motion.div>

            <motion.div variants={fadeInUp} style={{ marginTop: '48px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {[
                { icon: CheckCircle, text: "Free to use" },
                { icon: CheckCircle, text: "No credit card" },
                { icon: CheckCircle, text: "Works on any phone" }
              ].map((badge, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.95)' }}>
                  <badge.icon style={{ width: '20px', height: '20px', color: '#4ade80' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{badge.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            opacity: 0.8,
            zIndex: 2,
            cursor: 'pointer'
          }}
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span style={{ fontSize: '14px', fontWeight: '600' }}>Scroll to explore</span>
          <div style={{ width: '24px', height: '40px', border: '2px solid white', borderRadius: '12px', display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>
            <div style={{ width: '4px', height: '8px', background: 'white', borderRadius: '2px' }}></div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '80px 20px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}
          >
            {stats.map((stat, i) => (
              <motion.div 
                key={i} 
                variants={fadeInUp}
                whileHover={{ scale: 1.03, boxShadow: "0px 15px 40px rgba(8, 145, 178, 0.15)" }}
                style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', transition: 'all 0.3s' }}
              >
                <div style={{ width: '56px', height: '56px', background: `${stat.color}15`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <stat.icon style={{ width: '28px', height: '28px', color: stat.color }} />
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '36px', fontWeight: '800', color: '#0f172a' }}>{stat.number}</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* USSD Section */}
      <section style={{ padding: '80px 20px', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'center' }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(8, 145, 178, 0.1)', padding: '8px 16px', borderRadius: '50px',
                marginBottom: '16px'
              }}>
                <Phone style={{ width: '16px', height: '16px', color: '#0891b2' }} />
                <span style={{ color: '#0891b2', fontSize: '13px', fontWeight: '700' }}>NO SMARTPHONE? NO PROBLEM</span>
              </div>
              
              <h2 style={{ margin: '0 0 16px 0', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>
                Access MajiSmart on{' '}
                <span style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Any Phone</span>
              </h2>
              
              <p style={{ margin: '0 0 32px 0', fontSize: '16px', color: '#475569', lineHeight: '1.6' }}>
                Dial *384*99# from any phone to check water status, report issues, and manage your account.
              </p>
              
              <div style={{
                background: 'white', borderRadius: '16px', padding: '32px 24px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)', marginBottom: '24px'
              }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>How to Use</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { step: '1', text: 'Dial *384*99# on your phone' },
                    { step: '2', text: 'Select Check Water Status or Report Issue' },
                    { step: '3', text: 'Get instant information or submit report' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '40px', height: '40px',
                        background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                        borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '800', flexShrink: 0
                      }}>{item.step}</div>
                      <p style={{ margin: 0, fontSize: '15px', color: '#475569', paddingTop: '6px' }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{
                background: '#0f172a', color: 'white',
                padding: '20px 24px', borderRadius: '12px', textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '12px', opacity: 0.8 }}>USSD Code</p>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '2px' }}>*384*99#</p>
              </div>
            </div>
            
            <div style={{
              borderRadius: '20px', overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              height: '500px',
              backgroundImage: 'url("https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)',
                display: 'flex', alignItems: 'flex-end', padding: '32px 24px'
              }}>
                <div style={{ color: 'white', textAlign: 'center', width: '100%' }}>
                  <Smartphone style={{ width: '48px', height: '48px', margin: '0 auto 12px', opacity: 0.9 }} />
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Available on all networks</p>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13px', opacity: 0.8 }}>Safaricom • Airtel • Telkom</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '100px 20px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '60px' }}
          >
            <span style={{ display: 'inline-block', padding: '6px 16px', background: '#eff6ff', color: '#0891b2', borderRadius: '50px', fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>POWERFUL FEATURES</span>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: '800', color: '#0f172a' }}>The Complete Water Ecosystem</h2>
            <p style={{ margin: '0 auto', fontSize: '18px', color: '#64748b', maxWidth: '600px' }}>Everything you need to monitor, manage, and conserve water.</p>
          </motion.div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}
          >
            {features.map((feature, i) => (
              <motion.div 
                key={i} 
                variants={fadeInUp}
                whileHover={{ scale: 1.03, boxShadow: "0px 15px 40px rgba(8, 145, 178, 0.15)" }}
                style={{ 
                  background: 'white', borderRadius: '20px', 
                  border: '1px solid #f1f5f9', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                  transition: 'all 0.3s' 
                }}
              >
                <div style={{
                  height: '200px',
                  backgroundImage: `url("${feature.image}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(135deg, ${feature.color}dd, ${feature.color}88)`
                  }}></div>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'white', padding: '16px',
                    borderRadius: '14px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                  }}>
                    <feature.icon style={{ width: '32px', height: '32px', color: feature.color }} />
                  </div>
                </div>
                <div style={{ padding: '28px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{feature.title}</h3>
                  <p style={{ margin: 0, fontSize: '15px', color: '#64748b', lineHeight: '1.6' }}>{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '100px 20px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 50% 50%, rgba(8, 145, 178, 0.2) 0%, transparent 70%)' }}></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}
        >
          <h2 style={{ margin: '0 0 20px 0', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: '800', color: 'white', lineHeight: '1.2' }}>Ready to transform water access?</h2>
          <p style={{ margin: '0 0 40px 0', fontSize: '18px', color: '#94a3b8' }}>Join thousands of Kenyans already using MajiSmart.</p>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(8, 145, 178, 0.4)" }} 
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/register')} 
            style={{ padding: '18px 40px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 30px rgba(8, 145, 178, 0.3)' }}
          >
            Create Free Account
          </motion.button>
          <p style={{ margin: '24px 0 0 0', fontSize: '14px', color: '#64748b' }}>✓ Free forever ✓ No credit card ✓ Cancel anytime</p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', borderTop: '1px solid #1e293b', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplets style={{ color: 'white', width: '18px', height: '18px' }} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>MajiSmart Kenya</span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>© 2024 MajiSmart Kenya. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
