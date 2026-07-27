import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, CheckCircle, Share, Plus } from 'lucide-react'

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showManualInstructions, setShowManualInstructions] = useState(false)
  const [browserType, setBrowserType] = useState('')

  useEffect(() => {
    const ua = navigator.userAgent
    if (ua.includes('Chrome') && !ua.includes('Edg')) setBrowserType('chrome')
    else if (ua.includes('Safari') && !ua.includes('Chrome')) setBrowserType('safari')
    else if (ua.includes('Firefox')) setBrowserType('firefox')
    else if (ua.includes('Edg')) setBrowserType('edge')
    else setBrowserType('other')

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const daysSinceDismissed = (new Date() - new Date(dismissed)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 3) return
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShowInstallBanner(true), 2000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallBanner(false)
      setDeferredPrompt(null)
      localStorage.removeItem('pwa-install-dismissed')
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt && !isStandalone && (browserType === 'safari' || browserType === 'other')) {
        setShowManualInstructions(true)
      }
    }, 4000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
      clearTimeout(fallbackTimer)
    }
  }, [browserType])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowManualInstructions(true)
      return
    }
    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') console.log('✅ User accepted installation')
      setDeferredPrompt(null)
      setShowInstallBanner(false)
    } catch (error) {
      console.error('Install error:', error)
      setShowManualInstructions(true)
    }
  }

  const handleDismiss = () => {
    setShowInstallBanner(false)
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
  }

  const getManualInstructions = () => {
    switch (browserType) {
      case 'safari':
        return { title: 'Install on iPhone/iPad', steps: ['Tap the Share button (square with arrow) at the bottom', 'Scroll down and tap "Add to Home Screen"', 'Tap "Add" to confirm'], icon: Share }
      case 'chrome':
        return { title: 'Install on Chrome', steps: ['Tap the menu (⋮) in the top right', 'Tap "Install app" or "Add to Home screen"', 'Tap "Install" to confirm'], icon: Download }
      case 'edge':
        return { title: 'Install on Edge', steps: ['Tap the menu (⋯) in the browser', 'Tap "Apps" > "Install this site as an app"', 'Click "Install" to confirm'], icon: Download }
      default:
        return { title: 'Install MajiSmart', steps: ['Open the browser menu', 'Look for "Install app" or "Add to Home screen"', 'Confirm the installation'], icon: Download }
    }
  }

  if (isInstalled) return null

  const instructions = getManualInstructions()
  const ManualIcon = instructions.icon

  return (
    <>
      {/* Main Install Banner */}
      <AnimatePresence>
        {showInstallBanner && !showManualInstructions && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              width: 'calc(100% - 32px)',
              maxWidth: '480px'
            }}
          >
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(12px)',
              borderRadius: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.5)',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'white',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <Smartphone style={{ width: '26px', height: '26px', color: '#0ea5e9' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'white' }}>
                      Install MajiSmart
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                      Quick access from your home screen
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                  aria-label="Dismiss"
                >
                  <X style={{ width: '20px', height: '20px', color: 'white' }} />
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  {[
                    'Access water alerts instantly',
                    'Works offline with cached data',
                    'No app store download needed'
                  ].map((benefit, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981', flexShrink: 0 }} />
                      <span style={{ fontSize: '15px', color: '#475569', fontWeight: '500' }}>{benefit}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleDismiss}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
                    onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleInstallClick}
                    style={{
                      flex: 2,
                      padding: '14px',
                      background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '15px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(14, 165, 233, 0.4)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)'
                      e.target.style.boxShadow = '0 8px 24px rgba(14, 165, 233, 0.5)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = '0 4px 16px rgba(14, 165, 233, 0.4)'
                    }}
                  >
                    <Download style={{ width: '18px', height: '18px' }} />
                    Install Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Instructions Modal (for iOS Safari and fallback) */}
      <AnimatePresence>
        {showManualInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowManualInstructions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '420px',
                width: '100%',
                boxShadow: '0 25px 70px rgba(0,0,0,0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(14, 165, 233, 0.3)'
                  }}>
                    <ManualIcon style={{ width: '28px', height: '28px', color: 'white' }} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>
                    {instructions.title}
                  </h3>
                </div>
                <button
                  onClick={() => setShowManualInstructions(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                {instructions.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '800',
                      fontSize: '15px',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
                    }}>
                      {i + 1}
                    </div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#475569', lineHeight: 1.6, fontWeight: '500' }}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowManualInstructions(false)}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(14, 165, 233, 0.4)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 8px 24px rgba(14, 165, 233, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 16px rgba(14, 165, 233, 0.4)'
                }}
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
