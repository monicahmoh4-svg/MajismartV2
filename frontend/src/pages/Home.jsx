import { useNavigate } from 'react-router-dom';
import { Droplets, MapPin, Smartphone, Shield, TrendingUp, Users, Wifi, CheckCircle, ArrowRight, Activity, Globe, Zap, Phone, BarChart3, Award, Heart, Clock, ChevronRight, Play, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Home() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', overflowX: 'hidden' }}>
      {/* Navigation */}
      <nav style={{
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        padding: '16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: scrollY > 50 ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => window.scrollTo(0, 0)}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)'
            }}>
              <Droplets style={{ color: 'white', width: '24px', height: '24px' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MajiSmart</span>
          </div>
          
          {/* Desktop Nav */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={() => navigate('/login')} style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '2px solid #0891b2',
              color: '#0891b2',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontSize: '14px',
              whiteSpace: 'nowrap'
            }} onMouseEnter={(e) => { e.target.style.background = '#0891b2'; e.target.style.color = 'white'; }}
              onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#0891b2'; }}>Sign In</button>
            <button onClick={() => navigate('/register')} style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)',
              transition: 'all 0.3s',
              fontSize: '14px',
              whiteSpace: 'nowrap'
            }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(8, 145, 178, 0.4)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(8, 145, 178, 0.3)'; }}>Get Started</button>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{
            display: 'none',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px'
          }}>
            {mobileMenuOpen ? <X style={{ width: '24px', height: '24px' }} /> : <Menu style={{ width: '24px', height: '24px' }} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div style={{
            display: 'none',
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            borderBottom: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} style={{
                padding: '12px',
                background: 'transparent',
                border: '2px solid #0891b2',
                color: '#0891b2',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '15px'
              }}>Sign In</button>
              <button onClick={() => { navigate('/register'); setMobileMenuOpen(false); }} style={{
                padding: '12px',
                background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '15px'
              }}>Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: 'calc(100vh - 73px)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)',
        padding: '60px 20px'
      }}>
        {/* Background Image Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=1920&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15
        }}></div>
        
        {/* Animated Circles */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '300px',
          height: '300px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: '200px',
          height: '200px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ maxWidth: '800px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.2)',
              padding: '8px 16px',
              borderRadius: '50px',
              marginBottom: '24px',
              backdropFilter: 'blur(10px)'
            }}>
              <span style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
              <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Trusted by 10M+ Kenyans</span>
            </div>
            
            <h1 style={{
              margin: '0 0 20px 0',
              fontSize: 'clamp(32px, 6vw, 56px)',
              fontWeight: '900',
              lineHeight: '1.1',
              color: 'white'
            }}>
              Smart Water Intelligence for{' '}
              <span style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Kenya</span>
            </h1>
            
            <p style={{
              margin: '0 0 32px 0',
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              opacity: '0.95',
              lineHeight: '1.6',
              color: 'white',
              maxWidth: '650px'
            }}>
              Real-time monitoring, transparent data, and community-driven water management. Access clean water information from any device.
            </p>
            
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/register')} style={{
                padding: '16px 32px',
                background: 'white',
                color: '#0891b2',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                transition: 'all 0.3s'
              }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)'; }}>
                Get Started Free <ArrowRight style={{ width: '20px', height: '20px' }} />
              </button>
              <button style={{
                padding: '16px 32px',
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Play style={{ width: '18px', height: '18px', fill: 'white' }} /> Watch Demo
              </button>
            </div>

            {/* Trust Badges */}
            <div style={{ marginTop: '48px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.9)' }}>
                <CheckCircle style={{ width: '20px', height: '20px', color: '#4ade80' }} />
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Free to use</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.9)' }}>
                <CheckCircle style={{ width: '20px', height: '20px', color: '#4ade80' }} />
                <span style={{ fontSize: '14px', fontWeight: '600' }}>No credit card</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.9)' }}>
                <CheckCircle style={{ width: '20px', height: '20px', color: '#4ade80' }} />
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Works on any phone</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="animate-on-scroll" id="stats" style={{
        padding: '80px 20px',
        background: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginBottom: '60px'
          }}>
            {[
              { number: '10M+', label: 'Kenyans served', icon: Users, color: '#0891b2' },
              { number: '47', label: 'Counties covered', icon: Globe, color: '#06b6d4' },
              { number: '100%', label: 'Real-time data', icon: Activity, color: '#22d3ee' },
              { number: '24/7', label: 'Monitoring', icon: Clock, color: '#3b82f6' }
            ].map((stat, i) => (
              <div key={i} style={{
                textAlign: 'center',
                padding: '32px 20px',
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                borderRadius: '16px',
                border: '1px solid #e2e8f0'
              }}>
                <stat.icon style={{ width: '40px', height: '40px', color: stat.color, margin: '0 auto 16px' }} />
                <p style={{ margin: '0 0 8px 0', fontSize: '40px', fontWeight: '900', background: `linear-gradient(135deg, ${stat.color}, ${stat.color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.number}</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '600' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Image Showcase */}
          <div style={{
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            position: 'relative',
            height: '400px',
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
              justifyContent: 'center',
              padding: '40px 20px'
            }}>
              <div style={{ textAlign: 'center', color: 'white' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '800' }}>Technology Meets Community</h3>
                <p style={{ margin: 0, fontSize: 'clamp(14px, 2vw, 18px)', opacity: 0.95, maxWidth: '500px', margin: '0 auto' }}>Bridging the gap between advanced IoT monitoring and everyday water access needs across Kenya</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* USSD Section */}
      <section className="animate-on-scroll" id="ussd" style={{
        padding: '80px 20px',
        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'center' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(8, 145, 178, 0.1)',
                padding: '8px 16px',
                borderRadius: '50px',
                marginBottom: '16px'
              }}>
                <Smartphone style={{ width: '16px', height: '16px', color: '#0891b2' }} />
                <span style={{ color: '#0891b2', fontSize: '13px', fontWeight: '700' }}>NO SMARTPHONE? NO PROBLEM</span>
              </div>
              
              <h2 style={{ margin: '0 0 16px 0', fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: '900', color: '#0f172a', lineHeight: '1.2' }}>
                Access MajiSmart on{' '}
                <span style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Any Phone</span>
              </h2>
              
              <p style={{ margin: '0 0 32px 0', fontSize: '16px', color: '#475569', lineHeight: '1.6' }}>
                Access MajiSmart via basic feature phones using USSD. Check water levels, report issues, and manage your account from any phone.
              </p>
              
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px 24px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                marginBottom: '24px'
              }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>How to Use</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { step: '1', text: 'Dial *384*99# on your phone' },
                    { step: '2', text: 'Select Check Water Status or Report Issue' },
                    { step: '3', text: 'Get instant information or submit report' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '800',
                        flexShrink: 0
                      }}>{item.step}</div>
                      <p style={{ margin: 0, fontSize: '15px', color: '#475569', paddingTop: '6px' }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{
                background: '#0f172a',
                color: 'white',
                padding: '20px 24px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '12px', opacity: 0.8 }}>USSD Code</p>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '2px' }}>*384*99#</p>
              </div>
            </div>
            
            <div style={{
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              height: '500px',
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
                padding: '32px 24px'
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

      {/* Features Grid */}
      <section className="animate-on-scroll" id="features" style={{
        padding: '80px 20px',
        background: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(8, 145, 178, 0.1)',
              padding: '8px 16px',
              borderRadius: '50px',
              marginBottom: '16px'
            }}>
              <Zap style={{ width: '16px', height: '16px', color: '#0891b2' }} />
              <span style={{ color: '#0891b2', fontSize: '13px', fontWeight: '700' }}>POWERFUL FEATURES</span>
            </div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: '900', color: '#0f172a' }}>The Complete Water Ecosystem</h2>
            <p style={{ margin: 0, fontSize: '16px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>Everything you need to monitor, manage, and conserve water.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { icon: Activity, title: 'Real-Time Monitoring', desc: 'Live water quality, pressure, and flow data from IoT sensors.', color: '#0891b2', image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=600&q=80' },
              { icon: Shield, title: 'Transparent Data', desc: 'Blockchain-verified water usage records. No falsified readings.', color: '#06b6d4', image: 'https://images.unsplash.com/photo-1639762681485-074b7f413757?w=600&q=80' },
              { icon: MapPin, title: 'Find Water Points', desc: 'Locate nearest functional water points with real-time status.', color: '#22d3ee', image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80' },
              { icon: Users, title: 'Community Reports', desc: 'Report leaks, contamination, or infrastructure issues.', color: '#3b82f6', image: 'https://images.unsplash.com/photo-1573167243872-43c6433b9d40?w=600&q=80' },
              { icon: Wifi, title: 'Smart Metering', desc: 'IoT meters record data automatically. Pay for what you use.', color: '#8b5cf6', image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80' },
              { icon: TrendingUp, title: 'Usage Analytics', desc: 'Track consumption patterns and conservation goals.', color: '#10b981', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80' }
            ].map((feature, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                transition: 'all 0.3s'
              }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{
                  height: '160px',
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
                    padding: '12px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                  }}>
                    <feature.icon style={{ width: '28px', height: '28px', color: feature.color }} />
                  </div>
                </div>
                <div style={{ padding: '24px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{feature.title}</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '80px 20px',
        background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: '900', color: 'white', lineHeight: '1.2' }}>Ready to transform water access?</h2>
          <p style={{ margin: '0 0 32px 0', fontSize: '16px', opacity: '0.95', maxWidth: '500px', margin: '0 auto' }}>Join thousands of Kenyans already using MajiSmart.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{
              padding: '16px 32px',
              background: 'white',
              color: '#0891b2',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}>
              Create Free Account
            </button>
            <button style={{
              padding: '16px 32px',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.5)',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer'
            }}>
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', color: 'white', padding: '48px 20px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '48px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplets style={{ color: 'white', width: '20px', height: '20px' }} />
                </div>
                <span style={{ fontSize: '18px', fontWeight: '800' }}>MajiSmart</span>
              </div>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.8, lineHeight: '1.6' }}>Empowering communities with real-time water intelligence.</p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700' }}>Product</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Features', 'USSD Service', 'Pricing'].map((item) => (
                  <a key={item} href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>{item}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700' }}>Company</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['About', 'Blog', 'Contact'].map((item) => (
                  <a key={item} href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>{item}</a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.7 }}>© 2024 MajiSmart Kenya. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 768px) {
          nav div div button { display: none; }
          nav div button:last-child { display: block; }
        }
      `}</style>
    </div>
  );
}
