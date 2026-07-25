import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, MapPin, Smartphone, Shield, TrendingUp, Users, Wifi, CheckCircle, ArrowRight, Activity, Globe, Zap, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Home() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const cardHover = {
    rest: { scale: 1, boxShadow: "0px 4px 20px rgba(0,0,0,0.05)" },
    hover: { scale: 1.03, boxShadow: "0px 15px 40px rgba(8, 145, 178, 0.15)", transition: { duration: 0.3 } }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', overflowX: 'hidden' }}>
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          background: scrollY > 50 ? 'rgba(255, 255, 255, 0.85)' : 'transparent',
          backdropFilter: scrollY > 50 ? 'blur(12px)' : 'none',
          borderBottom: scrollY > 50 ? '1px solid rgba(226, 232, 240, 0.5)' : 'none',
          padding: '20px 0',
          position: 'fixed',
          top: 0,
          width: '100%',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
        paddingTop: '80px'
      }}>
        {/* Animated Background Blobs */}
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: 'absolute', top: '10%', right: '10%', width: '400px', height: '400px', background: 'rgba(8, 145, 178, 0.1)', borderRadius: '50%', filter: 'blur(60px)' }} 
        />
        <motion.div 
          animate={{ x: [0, -30, 0], y: [0, 50, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: 'absolute', bottom: '10%', left: '5%', width: '300px', height: '300px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '50%', filter: 'blur(60px)' }} 
        />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1, width: '100%' }}>
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            style={{ maxWidth: '800px' }}
          >
            <motion.div variants={fadeInUp} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.8)', padding: '8px 16px', borderRadius: '50px',
              marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span>
              <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: '600' }}>Trusted by 10M+ Kenyans</span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} style={{
              margin: '0 0 24px 0', fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: '800', lineHeight: '1.1', color: '#0f172a'
            }}>
              Smart Water Intelligence for{' '}
              <span style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Kenya</span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} style={{
              margin: '0 0 40px 0', fontSize: 'clamp(16px, 2vw, 20px)', color: '#475569', lineHeight: '1.6', maxWidth: '600px'
            }}>
              Real-time monitoring, transparent data, and community-driven water management. Access clean water information from any device.
            </motion.p>
            
            <motion.div variants={fadeInUp} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 15px 30px rgba(8, 145, 178, 0.4)" }} 
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')} 
                style={{ padding: '16px 32px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(8, 145, 178, 0.3)' }}
              >
                Get Started Free <ArrowRight style={{ width: '20px', height: '20px' }} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.9)" }} 
                whileTap={{ scale: 0.95 }}
                style={{ padding: '16px 32px', background: 'rgba(255,255,255,0.6)', color: '#0f172a', border: '1px solid rgba(255,255,255,0.8)', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
              >
                Explore Features
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '100px 24px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}
          >
            {[
              { number: '10M+', label: 'Kenyans served', icon: Users, color: '#0891b2' },
              { number: '47', label: 'Counties covered', icon: Globe, color: '#06b6d4' },
              { number: '100%', label: 'Real-time data', icon: Activity, color: '#22d3ee' },
              { number: '24/7', label: 'Monitoring', icon: Zap, color: '#3b82f6' }
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                variants={fadeInUp}
                whileHover="hover"
                initial="rest"
                animate="rest"
                style={{ textAlign: 'center', padding: '40px 24px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}
              >
                <div style={{ width: '60px', height: '60px', background: `${stat.color}15`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <stat.icon style={{ width: '28px', height: '28px', color: stat.color }} />
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '40px', fontWeight: '800', color: '#0f172a' }}>{stat.number}</p>
                <p style={{ margin: 0, fontSize: '15px', color: '#64748b', fontWeight: '500' }}>{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '100px 24px', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '60px' }}
          >
            <span style={{ display: 'inline-block', padding: '6px 16px', background: '#eff6ff', color: '#0891b2', borderRadius: '50px', fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>POWERFUL FEATURES</span>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '800', color: '#0f172a' }}>The Complete Water Ecosystem</h2>
            <p style={{ margin: 0, fontSize: '18px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>Everything you need to monitor, manage, and conserve water.</p>
          </motion.div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}
          >
            {[
              { icon: Activity, title: 'Real-Time Monitoring', desc: 'Live water quality, pressure, and flow data from IoT sensors.', color: '#0891b2' },
              { icon: Shield, title: 'Transparent Data', desc: 'Blockchain-verified water usage records. No falsified readings.', color: '#06b6d4' },
              { icon: MapPin, title: 'Find Water Points', desc: 'Locate nearest functional water points with real-time status.', color: '#22d3ee' },
              { icon: Users, title: 'Community Reports', desc: 'Report leaks, contamination, or infrastructure issues.', color: '#3b82f6' },
              { icon: Wifi, title: 'Smart Metering', desc: 'IoT meters record data automatically. Pay for what you use.', color: '#8b5cf6' },
              { icon: TrendingUp, title: 'Usage Analytics', desc: 'Track consumption patterns and conservation goals.', color: '#10b981' }
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                variants={fadeInUp}
                whileHover="hover"
                initial="rest"
                animate="rest"
                style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
              >
                <div style={{ width: '56px', height: '56px', background: `${feature.color}15`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  <feature.icon style={{ width: '28px', height: '28px', color: feature.color }} />
                </div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{feature.title}</h3>
                <p style={{ margin: 0, fontSize: '15px', color: '#64748b', lineHeight: '1.6' }}>{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '100px 24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 50% 50%, rgba(8, 145, 178, 0.2) 0%, transparent 70%)' }}></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}
        >
          <h2 style={{ margin: '0 0 20px 0', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '800', color: 'white', lineHeight: '1.2' }}>Ready to transform water access?</h2>
          <p style={{ margin: '0 0 40px 0', fontSize: '18px', color: '#94a3b8' }}>Join thousands of Kenyans already using MajiSmart for reliable water information.</p>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(8, 145, 178, 0.4)" }} 
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/register')} 
            style={{ padding: '18px 40px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 30px rgba(8, 145, 178, 0.3)' }}
          >
            Create Free Account
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', borderTop: '1px solid #1e293b', padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>© 2024 MajiSmart Kenya. All rights reserved.</p>
      </footer>
    </div>
  );
} 
