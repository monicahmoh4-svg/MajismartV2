import { Droplets, LogIn, UserPlus, ShieldCheck } from 'lucide-react'

// Cinematic sliding auth card: icon rail with gliding indicator, tall
// photographic hero with cross-sliding headlines, and a sliding form stack.
// view: 'signin' | 'signup' | 'admin'. Admin mode hides the rail tabs.
export default function AuthCard({ view, onViewChange, children }) {
  const isAdmin = view === 'admin'
  const heroIndex = view === 'signin' ? 0 : view === 'signup' ? 1 : 2
  const heroes = [
    { title: 'Welcome back', subtitle: 'Please enter your credentials' },
    { title: 'Join us today', subtitle: 'Creating an account is quick' },
    { title: 'Restricted area', subtitle: 'System administrators only' },
  ]
  return (
    <div className={`auth-card view-${view}`}>
      <nav className="auth-rail" aria-label="Sign in or sign up">
        <div className="auth-logo">
          <Droplets size={22} color="white" />
        </div>
        {!isAdmin && (
          <div className="auth-tabs">
            <span className="auth-activebar" aria-hidden />
            <button
              type="button"
              className={view === 'signin' ? 'on' : ''}
              onClick={() => onViewChange('signin')}
            >
              <LogIn size={17} />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              className={view === 'signup' ? 'on' : ''}
              onClick={() => onViewChange('signup')}
            >
              <UserPlus size={17} />
              <span>Sign Up</span>
            </button>
          </div>
        )}
        {isAdmin && (
          <div className="auth-adminmark" title="Admin console">
            <ShieldCheck size={18} />
            <span>Admin</span>
          </div>
        )}
      </nav>

      <div className="auth-hero">
        <div className="auth-hero-bg" role="img" aria-label="Water splash over deep blue water" />
        <div className="auth-hero-shade" />
        <div className="auth-hero-inner" style={{ top: `${-heroIndex * 100}%` }}>
          {heroes.map((h, i) => (
            <div className="auth-hero-content" key={h.title} aria-hidden={i !== heroIndex}>
              <h2>{h.title}</h2>
              <h3>{h.subtitle}</h3>
              <span className="auth-terms">Terms &amp; Conditions apply</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-form">
        <div className="auth-forms" style={{ top: `${-heroIndex * 100}%` }}>
          {children}
        </div>
      </div>
    </div>
  )
}
