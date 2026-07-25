import { useNavigate } from 'react-router-dom';
import { Droplets, MapPin, Smartphone, Shield, TrendingUp, Users, Wifi, CheckCircle, ArrowRight, Activity, Globe, Zap } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navigation */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '20px 0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplets style={{ color: 'white', width: '24px', height: '24px' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>MajiSmart</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/login')} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #0891b2', color: '#0891b2', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Sign In</button>
            <button onClick={() => navigate('/register')} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)', padding: '100px 24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '600px', height: '600px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: '400px', height: '400px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%' }}></div>
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '800px' }}>
            <h1 style={{ margin: '0 0 24px 0', fontSize: '56px', fontWeight: '800', lineHeight: '1.1' }}>
              Smart Water Intelligence for Kenya
            </h1>
            <p style={{ margin: '0 0 32px 0', fontSize: '20px', opacity: '0.95', lineHeight: '1.6' }}>
              Real-time monitoring, transparent data, and community-driven water management. Access clean water information from any device — smartphone or feature phone.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/register')} style={{ padding: '16px 32px', background: 'white', color: '#0891b2', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Open Dashboard <ArrowRight style={{ width: '20px', height: '20px' }} />
              </button>
              <button style={{ padding: '16px 32px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid white', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                Explore Features
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px', marginBottom: '60px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '48px', fontWeight: '800', color: '#0891b2' }}>10M+</p>
              <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>Kenyans needing clean water access</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '48px', fontWeight: '800', color: '#0891b2' }}>47</p>
              <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>Counties covered</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '48px', fontWeight: '800', color: '#0891b2' }}>100%</p>
              <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>Real-time transparency</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '48px', fontWeight: '800', color: '#0891b2' }}>24/7</p>
              <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>Monitoring & alerts</p>
            </div>
          </div>
        </div>
      </section>

      {/* USSD Section */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '36px', fontWeight: '800', color: '#0f172a' }}>No smartphone? No problem.</h2>
              <p style={{ margin: '0 0 32px 0', fontSize: '18px', color: '#475569', lineHeight: '1.6' }}>
                Access MajiSmart via basic feature phones using USSD. Check water levels, report issues, and manage your account from any phone.
              </p>
              <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>How to Use MajiSmart on Any Phone</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { step: '1', text: 'Dial *384*99# on your phone' },
                    { step: '2', text: 'Select Check Water Status or Report Issue' },
                    { step: '3', text: 'Get instant information or submit your report' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', flexShrink: 0 }}>{item.step}</div>
                      <p style={{ margin: 0, fontSize: '15px', color: '#475569', paddingTop: '6px' }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
              <Smartphone style={{ width: '80px', height: '80px', color: '#0891b2', margin: '0 auto 24px' }} />
              <div style={{ background: '#0f172a', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '16px', fontFamily: 'monospace', fontSize: '24px', fontWeight: '700' }}>
                *384*99#
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Available across Kenya</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '36px', fontWeight: '800', color: '#0f172a' }}>The Complete Water Ecosystem</h2>
            <p style={{ margin: 0, fontSize: '18px', color: '#64748b' }}>Everything you need to monitor, manage, and conserve water in a smart world.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {[
              { icon: Activity, title: 'Real-Time Monitoring', desc: 'Live water quality, pressure, and flow data from IoT sensors across the network.', color: '#0891b2' },
              { icon: Shield, title: 'Transparent Data', desc: 'Blockchain-verified water usage records. No falsified readings or inflated bills.', color: '#06b6d4' },
              { icon: MapPin, title: 'Find Water Points', desc: 'Locate nearest functional water points with real-time availability status.', color: '#22d3ee' },
              { icon: Users, title: 'Community Reports', desc: 'Report leaks, contamination, or infrastructure issues. Track resolution progress.', color: '#3b82f6' },
              { icon: Wifi, title: 'Smart Metering', desc: 'IoT meters record data automatically. Pay only for what you use.', color: '#8b5cf6' },
              { icon: TrendingUp, title: 'Usage Analytics', desc: 'Track your consumption patterns, spending history, and conservation goals.', color: '#10b981' }
            ].map((feature, i) => (
              <div key={i} style={{ padding: '32px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', transition: 'all 0.3s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <feature.icon style={{ width: '48px', height: '48px', color: feature.color, marginBottom: '20px' }} />
                <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{feature.title}</h3>
                <p style={{ margin: 0, fontSize: '15px', color: '#64748b', lineHeight: '1.6' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '36px', fontWeight: '800' }}>Trustless Water Management, Powered by Technology</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '18px', opacity: '0.9', maxWidth: '700px' }}>Every feature is anchored in transparency and accountability — because water is a fundamental right.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {[
              { icon: CheckCircle, title: 'Tamper-Proof Records', desc: 'Immutable water quality and usage data. No manipulation, no corruption.' },
              { icon: Globe, title: 'Nationwide Coverage', desc: 'From Nairobi to rural villages — connected infrastructure across all 47 counties.' },
              { icon: Zap, title: 'Instant Alerts', desc: 'Real-time notifications for outages, contamination, or maintenance schedules.' }
            ].map((item, i) => (
              <div key={i} style={{ padding: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <item.icon style={{ width: '40px', height: '40px', color: '#22d3ee', marginBottom: '16px' }} />
                <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700' }}>{item.title}</h3>
                <p style={{ margin: 0, fontSize: '15px', opacity: '0.85', lineHeight: '1.6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '36px', fontWeight: '800', color: '#0f172a' }}>Ready to transform water access?</h2>
          <p style={{ margin: '0 0 32px 0', fontSize: '18px', color: '#64748b' }}>Join thousands of Kenyans already using MajiSmart for reliable water information.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{ padding: '16px 32px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
              Create Free Account
            </button>
            <button style={{ padding: '16px 32px', background: 'transparent', color: '#0891b2', border: '2px solid #0891b2', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '40px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplets style={{ color: 'white', width: '18px', height: '18px' }} />
            </div>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>MajiSmart Kenya</span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>© 2024 MajiSmart. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
