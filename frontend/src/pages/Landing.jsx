import { Link } from 'react-router-dom'
import { Droplets, Wifi, CreditCard, Bell, BarChart3, ArrowRight, CheckCircle, MapPin, Zap, CloudRain, Shield, Activity } from 'lucide-react'

export default function Landing() {
  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif', color: '#202124', overflowX: 'hidden' }}>
      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(8,17,30,.95)', backdropFilter: 'blur(12px)',
        padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplets size={18} color="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>MajiSmart</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/login" style={{ color: 'rgba(255,255,255,.8)', fontSize: 14, textDecoration: 'none' }}>Sign In</Link>
          <Link to="/register" style={{
            background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', color: 'white',
            padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none'
          }}>Get Started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* HD background — African community water */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('https://images.unsplash.com/photo-1504297050568-910d24c426d3?w=1920&q=95&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 50%',
          backgroundRepeat: 'no-repeat',
        }} />
        {/* Cinematic overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, rgba(5,12,25,0.93) 0%, rgba(8,22,50,0.87) 38%, rgba(10,42,72,0.72) 62%, rgba(6,28,18,0.48) 100%)',
        }} />
        {/* Bottom wave fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
          background: 'linear-gradient(to top, #f8f9fa 0%, transparent 100%)',
          zIndex: 3,
        }} />
        {/* Ripple rings */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 1 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              position: 'absolute',
              borderRadius: '50%',
              border: '1px solid rgba(77,208,168,.22)',
              animation: `ripple ${3+i}s ease-out infinite`,
              animationDelay: `${i*0.7}s`,
              width: `${200+i*180}px`, height: `${200+i*180}px`,
              top: `${30+i*8}%`, left: `${50+i*3}%`,
              transform: 'translate(-50%,-50%)'
            }} />
          ))}
        </div>
        <style>{`
          @keyframes ripple {
            0%  { opacity:.6; transform:translate(-50%,-50%) scale(0.8); }
            100%{ opacity:0;  transform:translate(-50%,-50%) scale(1.7); }
          }
          @keyframes float {
            0%,100%{ transform:translateY(0); }
            50%    { transform:translateY(-12px); }
          }
          @keyframes fadeUp {
            from{ opacity:0; transform:translateY(32px); }
            to  { opacity:1; transform:translateY(0); }
          }
          @keyframes pulse {
            0%,100%{ opacity:1; }
            50%    { opacity:.45; }
          }
        `}</style>
        {/* Floating drop icons */}
        <div style={{ position: 'absolute', top: '18%', right: '7%', animation: 'float 4s ease-in-out infinite', zIndex: 2 }}>
          <Droplets size={72} color="rgba(13,158,117,.38)" />
        </div>
        <div style={{ position: 'absolute', bottom: '28%', right: '13%', animation: 'float 5s ease-in-out infinite .6s', zIndex: 2 }}>
          <Droplets size={44} color="rgba(26,127,212,.38)" />
        </div>
        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 2, padding: '130px 44px 110px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <div style={{ animation: 'fadeUp .9s ease forwards', maxWidth: 700 }}>
            {/* Live badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(13,158,117,.18)', border: '1px solid rgba(13,158,117,.45)',
              borderRadius: 99, padding: '7px 16px', marginBottom: 30
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d9e75', animation: 'pulse 1.8s ease-in-out infinite' }} />
              <span style={{ color: '#4dd0a8', fontSize: 13, fontWeight: 600, letterSpacing: .3 }}>
                Live — 6 Active Nodes Across Kenya
              </span>
            </div>
            <h1 style={{
              fontSize: 'clamp(36px,5.5vw,68px)', fontWeight: 900,
              color: 'white', lineHeight: 1.08, marginBottom: 12, letterSpacing: -1
            }}>
              Turning Kenya's Water
            </h1>
            <h1 style={{
              fontSize: 'clamp(36px,5.5vw,68px)', fontWeight: 900,
              lineHeight: 1.08, marginBottom: 28, letterSpacing: -1,
              background: 'linear-gradient(135deg,#4db8f4 0%,#4dd0a8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              Crisis into Smart Access.
            </h1>
            <p style={{
              fontSize: 19, color: 'rgba(255,255,255,.78)',
              maxWidth: 580, lineHeight: 1.82, marginBottom: 44
            }}>
              41% of Kenyans lack safe water. MajiSmart deploys solar-powered IoT sensors on boreholes and tanks,
              lets communities pay via M-Pesa on any basic phone, and gives county officials
              real-time data to manage every water point — ending shortages before they start.
            </p>
            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 60 }}>
              <Link to="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 9,
                background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)',
                color: 'white', padding: '15px 30px', borderRadius: 10,
                fontWeight: 700, fontSize: 16, textDecoration: 'none',
                boxShadow: '0 6px 28px rgba(26,127,212,.45)',
                transition: 'transform .2s, box-shadow .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 36px rgba(26,127,212,.55)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 6px 28px rgba(26,127,212,.45)' }}>
                Launch Dashboard <ArrowRight size={18} />
              </Link>
              <Link to="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 9,
                background: 'rgba(255,255,255,.10)', backdropFilter: 'blur(10px)',
                color: 'white', padding: '15px 30px', borderRadius: 10,
                fontWeight: 500, fontSize: 16, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,.22)',
                transition: 'background .2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.18)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.10)'}>
                Sign In
              </Link>
            </div>
            {/* Impact stats bar */}
            <div style={{
              display: 'flex', flexWrap: 'wrap',
              background: 'rgba(8,17,35,.58)', backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 14, overflow: 'hidden', maxWidth: 640
            }}>
              {[
                { val: '41%',   label: 'Lack safe water',    color: '#f28b82' },
                { val: 'Ksh 2', label: 'Per 20L via M-Pesa', color: '#4dd0a8' },
                { val: '6 hrs', label: 'Saved daily/family', color: '#4db8f4' },
                { val: '60%',   label: 'Less water wasted',  color: '#ffd54f' },
              ].map((s, i) => (
                <div key={s.val} style={{
                  flex: '1 1 140px', padding: '18px 20px',
                  borderRight: i < 3 ? '1px solid rgba(255,255,255,.07)' : 'none',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 5, lineHeight: 1.4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Wave bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 4 }}>
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#f8f9fa"/>
          </svg>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '80px 32px', background: '#f8f9fa', textAlign: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span style={{ color: '#1a7fd4', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>How It Works</span>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, margin: '12px 0 16px' }}>From borehole to dashboard in 5 steps</h2>
          <p style={{ color: '#5f6368', maxWidth: 560, margin: '0 auto 56px', lineHeight: 1.7 }}>
            MajiSmart connects physical water infrastructure to digital management — no complex setup required.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 24 }}>
            {[
              { icon: Wifi,       color: '#1a7fd4', title: 'IoT Sensor Node',  desc: 'Solar-powered sensor reads water level, flow & turbidity every 15 minutes' },
              { icon: Zap,        color: '#0d9e75', title: '2G Transmission',  desc: 'Data sent over Safaricom/Airtel 2G — works anywhere in Kenya' },
              { icon: CreditCard, color: '#e8a020', title: 'M-Pesa Payment',   desc: 'Dial USSD, confirm M-Pesa, solenoid valve opens for exact volume paid' },
              { icon: Bell,       color: '#d93025', title: 'Smart Alerts',     desc: 'Instant SMS when tank is low, pump fails, or water quality drops' },
              { icon: BarChart3,  color: '#6f42c1', title: 'County Dashboard', desc: 'Live map, usage data, revenue reports for all county water points' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 12, padding: 28, textAlign: 'left', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e8eaed', transition: 'transform .2s,box-shadow .2s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,.13)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,.08)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: s.color+'18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <s.icon size={22} color={s.color} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#5f6368', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '80px 32px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 48, alignItems: 'center' }}>
            <div>
              <span style={{ color: '#0d9e75', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Platform Features</span>
              <h2 style={{ fontSize: 36, fontWeight: 800, margin: '12px 0 20px', lineHeight: 1.2 }}>Everything a county water team needs</h2>
              <p style={{ color: '#5f6368', lineHeight: 1.8, marginBottom: 28 }}>
                Built for Kenya's infrastructure realities — works on 2G, integrates M-Pesa natively, and requires zero technical training to use.
              </p>
              {[
                'Real-time water level monitoring across all sites',
                'Automated M-Pesa payment collection',
                'SMS alerts to community chairs & county officials',
                'Historical analytics and trend reports',
                'Multi-county node management',
                'Maintenance log and technician tracking',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <CheckCircle size={18} color="#0d9e75" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: '#3c4043' }}>{f}</span>
                </div>
              ))}
              <Link to="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24,
                background: '#1a7fd4', color: 'white', padding: '12px 24px',
                borderRadius: 8, fontWeight: 600, textDecoration: 'none'
              }}>
                Start Free Trial <ArrowRight size={16} />
              </Link>
            </div>
            {/* Live demo card */}
            <div style={{ background: '#0c1a2e', borderRadius: 16, padding: 28, color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0d9e75', boxShadow: '0 0 8px #0d9e75' }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>Live Node Status</span>
              </div>
              {[
                { name: 'Kiambu Borehole 1', level: 78, status: 'active',  county: 'Kiambu'   },
                { name: 'Machakos Tank A',   level: 45, status: 'active',  county: 'Machakos' },
                { name: 'Kibera Kiosk',      level: 18, status: 'warning', county: 'Nairobi'  },
                { name: 'Nakuru Borehole 3', level: 91, status: 'active',  county: 'Nakuru'   },
              ].map(n => (
                <div key={n.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <MapPin size={14} color="rgba(255,255,255,.4)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{n.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{n.county}</div>
                  </div>
                  <div style={{ width: 80 }}>
                    <div style={{ height: 5, background: 'rgba(255,255,255,.1)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: n.level+'%', borderRadius: 99, background: n.status==='warning'?'#e8a020':'#0d9e75', transition: 'width 1s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 3 }}>{n.level}%</div>
                  </div>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 99,
                    background: n.status==='warning'?'rgba(232,160,32,.2)':'rgba(13,158,117,.2)',
                    color: n.status==='warning'?'#f5bc50':'#4dd0a8'
                  }}>
                    {n.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 32px', background: 'linear-gradient(135deg,#0c1a2e,#0d3a6e)', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <Droplets size={48} color="rgba(77,208,168,.6)" style={{ marginBottom: 20 }} />
          <h2 style={{ fontSize: 40, fontWeight: 800, color: 'white', marginBottom: 16 }}>
            Ready to modernise your water network?
          </h2>
          <p style={{ color: 'rgba(255,255,255,.6)', lineHeight: 1.8, marginBottom: 36, fontSize: 16 }}>
            Join county water teams across Kenya using MajiSmart to monitor infrastructure, collect payments, and serve communities better.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', color: 'white',
              padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: 16,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8
            }}>
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link to="/login" style={{
              background: 'transparent', color: 'white', padding: '14px 32px',
              borderRadius: 10, fontWeight: 500, fontSize: 16, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,.25)'
            }}>
              Sign In
            </Link>
          </div>
          <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 13, marginTop: 20 }}>
            Demo credentials: admin@majismart.ke / admin123
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#060e1a', padding: '32px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <Droplets size={18} color="#1a7fd4" />
          <span style={{ color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>MajiSmart</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
          © 2025 MajiSmart Kenya. Solving the last-mile water access challenge.
        </p>
      </footer>
    </div>
  )
}
