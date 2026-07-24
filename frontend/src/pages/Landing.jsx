import { Link } from 'react-router-dom'
import { Droplets, ArrowRight, CheckCircle, MapPin, ShieldCheck, Wallet, Bell } from 'lucide-react'

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
    emoji: '🪣',
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

export default function Landing() {
  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif', color: '#202124', overflowX: 'hidden' }}>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{ opacity:1; } 50%{ opacity:.4; } }
        @keyframes float { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-10px); } }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(8,17,30,.97)', backdropFilter: 'blur(12px)', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplets size={16} color="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 17 }}>MajiSmart</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/login" style={{ color: 'rgba(255,255,255,.75)', fontSize: 14, textDecoration: 'none' }}>Sign In</Link>
          <Link to="/register" style={{ background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', color: 'white', padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* HERO — speaks to citizens, not engineers */}
      <section style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#060e1a 0%,#0a2040 55%,#052818 100%)', display: 'flex', alignItems: 'center', paddingTop: 60, position: 'relative', overflow: 'hidden' }}>

        {/* Background texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1504297050568-910d24c426d3?w=1400&q=80&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: .12 }} />

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#f8f9fa" />
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 2, padding: '80px 28px 120px', maxWidth: 1000, margin: '0 auto', width: '100%', animation: 'fadeUp .9s ease forwards' }}>

          {/* Live badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(13,158,117,.15)', border: '1px solid rgba(13,158,117,.4)', borderRadius: 99, padding: '6px 16px', marginBottom: 28 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0d9e75', animation: 'pulse 1.8s ease-in-out infinite' }} />
            <span style={{ color: '#4dd0a8', fontSize: 12, fontWeight: 600 }}>Available in Kenya now — free to join</span>
          </div>

          <h1 style={{ fontSize: 'clamp(32px,5.5vw,64px)', fontWeight: 900, color: 'white', lineHeight: 1.08, marginBottom: 10, letterSpacing: -1, maxWidth: 700 }}>
            Never wake up at 3am<br />to fill your tank again.
          </h1>
          <p style={{ fontSize: 'clamp(16px,2vw,20px)', color: 'rgba(255,255,255,.72)', maxWidth: 560, lineHeight: 1.75, marginBottom: 36 }}>
            MajiSmart tells you the moment water comes back on in your area, shows you the cheapest water point nearby, and alerts you before your tank runs dry.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 52 }}>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', color: 'white', padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: 'none', boxShadow: '0 6px 28px rgba(26,127,212,.4)' }}>
              Get water alerts free <ArrowRight size={17} />
            </Link>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.09)', color: 'white', padding: '14px 28px', borderRadius: 10, fontWeight: 500, fontSize: 16, textDecoration: 'none', border: '1px solid rgba(255,255,255,.2)' }}>
              Sign In
            </Link>
          </div>

          {/* What citizens get at a glance */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[
              { icon: Bell,        label: 'Water supply alerts'    },
              { icon: MapPin,      label: 'Find water near you'    },
              { icon: ShieldCheck, label: 'Is it safe to drink?'   },
              { icon: Wallet,      label: 'Track your spending'    },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.08)', borderRadius: 99, padding: '7px 14px', border: '1px solid rgba(255,255,255,.12)' }}>
                <Icon size={14} color="#4dd0a8" />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.8)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEMS WE SOLVE */}
      <section style={{ padding: '80px 28px', background: '#f8f9fa' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ color: '#d93025', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Real problems. Real solutions.</span>
            <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, margin: '12px 0 14px', lineHeight: 1.2 }}>
              Water problems every Kenyan knows
            </h2>
            <p style={{ color: '#5f6368', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
              We designed MajiSmart around the six water problems that cost Kenyans money, time, and sleep every single week.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {PROBLEMS.map((p, i) => (
              <div key={i} className="card" style={{ padding: 24, borderLeft: `4px solid ${p.color}` }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{p.emoji}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#202124', marginBottom: 8, lineHeight: 1.3 }}>
                  "{p.problem}"
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <CheckCircle size={15} color={p.color} style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 13, color: '#5f6368', lineHeight: 1.6, margin: 0 }}>{p.solution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIMPLE 3-STEP */}
      <section style={{ padding: '80px 28px', background: 'white' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, marginBottom: 14 }}>How it works</h2>
          <p style={{ color: '#5f6368', marginBottom: 52, lineHeight: 1.7 }}>Three steps and you're done. No hardware. No technical setup.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 28 }}>
            {[
              { step: '1', color: '#1a7fd4', bg: '#e8f4fd', title: 'Create a free account', desc: 'Sign up with your phone number and tell us which county you live in. Takes 30 seconds.' },
              { step: '2', color: '#0d9e75', bg: '#e1f5ee', title: 'Set your area', desc: 'Pick your county. We\'ll monitor every water point in your area and keep you updated.' },
              { step: '3', color: '#7a3fb5', bg: '#f0e8fc', title: 'Stay informed', desc: 'Get alerts when water comes back, find the nearest working point, and track your spending.' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: s.bg, color: s.color, fontWeight: 900, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: `2px solid ${s.color}30` }}>
                  {s.step}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#5f6368', lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 28px', background: 'linear-gradient(135deg,#060e1a,#0a2a50)', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <Droplets size={44} color="rgba(77,208,168,.55)" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, color: 'white', marginBottom: 14 }}>
            Stop guessing. Start knowing.
          </h2>
          <p style={{ color: 'rgba(255,255,255,.6)', lineHeight: 1.8, marginBottom: 32, fontSize: 15 }}>
            Join thousands of Kenyans using MajiSmart to take control of their water — for free.
          </p>
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#1a7fd4,#0d9e75)', color: 'white', padding: '15px 34px', borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
            Create Free Account <ArrowRight size={17} />
          </Link>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 12, marginTop: 16 }}>
            Demo: admin@majismart.ke / admin123
          </p>
        </div>
      </section>

      <footer style={{ background: '#040a10', padding: '28px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 8 }}>
          <Droplets size={16} color="#1a7fd4" />
          <span style={{ color: 'rgba(255,255,255,.6)', fontWeight: 600, fontSize: 14 }}>MajiSmart</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,.25)', fontSize: 12 }}>© 2025 MajiSmart Kenya · Water intelligence for every citizen</p>
      </footer>
    </div>
  )
}
