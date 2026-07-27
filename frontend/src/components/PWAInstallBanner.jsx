import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, CheckCircle, Plus, Share } from 'lucide-react'

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showManualInstructions, setShowManualInstructions] = useState(false)
  const [browserType, setBrowserType] = useState('')

  useEffect(() => {
    // Detect browser
    const ua = navigator.userAgent
    if (ua.includes('Chrome') && !ua.includes('Edg')) setBrowserType('chrome')
    else if (ua.includes('Safari') && !ua.includes('Chrome')) setBrowserType('safari')
    else if (ua.includes('Firefox')) setBrowserType('firefox')
    else if (ua.includes('Edg')) setBrowserType('edge')
    else setBrowserType('other')

    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true
    
    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // Check if previously dismissed (show again after 3 days)
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedDate = new Date(dismissed)
      const daysSinceDismissed = (new Date() - dismissedDate) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 3) {
        return
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      console.log('✅ beforeinstallprompt event fired')
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Show banner after 3 seconds delay for better UX
      setTimeout(() => {
        setShowInstallBanner(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('✅ App installed successfully')
      setIsInstalled(true)
      setShowInstallBanner(false)
      setDeferredPrompt(null)
      localStorage.removeItem('pwa-install-dismissed')
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    // Fallback: If beforeinstallprompt doesn't fire after 5 seconds on supported browsers,
    // show manual instructions (for iOS Safari especially)
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt && !isStandalone && browserType === 'safari') {
        setShowManualInstructions(true)
      }
    }, 5000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
      clearTimeout(fallbackTimer)
    }
  }, [browserType])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If no prompt available, show manual instructions
      setShowManualInstructions(true)
      return
    }

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      console.log(`User ${outcome} the install prompt`)
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted installation')
      }
      
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
        return {
          title: 'Install on iPhone/iPad',
          steps: [
            'Tap the Share button (square with arrow) at the bottom',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to confirm'
          ],
          icon: Share
        }
      case 'chrome':
        return {
          title: 'Install on Chrome',
          steps: [
            'Tap the menu (⋮) in the top right',
            'Tap "Install app" or "Add to Home screen"',
            'Tap "Install" to confirm'
          ],
          icon: Download
        }
      case 'firefox':
        return {
          title: 'Install on Firefox',
          steps: [
            'Tap the menu (☰) in the browser',
            'Tap "Install" or "Add to Home screen"',
            'Confirm the installation'
          ],
          icon: Download
        }
      case 'edge':
        return {
          title: 'Install on Edge',
          steps: [
            'Tap the menu (⋯) in the browser',
            'Tap "Apps" > "Install this site as an app"',
            'Click "Install" to confirm'
          ],
          icon: Download
        }
      default:
        return {
          title: 'Install MajiSmart',
          steps: [
            'Open the browser menu',
            'Look for "Install app" or "Add to Home screen"',
            'Confirm the installation'
          ],
          icon: Download
        }
    }
  }

  // Don't show if already installed
  if (isInstalled) {
    return null
  }

  const instructions = getManualInstructions()
  const ManualIcon = instructions.icon

  return (
    <>
      {/* Main Install Banner */}
      <AnimatePresence>
        {showInstallBanner && !showManualInstructions && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              width: 'calc(100% - 40px)',
              maxWidth: '500px'
            }}
          >
            <div style={{
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              border: '2px solid #0891b2',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'white',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Smartphone style={{ width: '24px', height: '24px', color: '#0891b2' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'white' }}>
                      Install MajiSmart
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                      Quick access from your home screen
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px',
                    cursor: 'pointer'
                  }}
                  aria-label="Dismiss"
                >
                  <X style={{ width: '20px', height: '20px', color: 'white' }} />
                </button>
              </div>

              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {[
                    'Access water alerts instantly',
                    'Works offline with cached data',
                    'No app store download needed'
                  ].map((benefit, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981', flexShrink: 0 }} />
                      <span style={{ fontSize: '14px', color: '#475569' }}>{benefit}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleDismiss}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleInstallClick}
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)'
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
              padding: '20px',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowManualInstructions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ManualIcon style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                    {instructions.title}
                  </h3>
                </div>
                <button
                  onClick={() => setShowManualInstructions(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {instructions.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '800',
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      {i + 1}
                    </div>
                    <p style={{ margin: 0, fontSize: '15px', color: '#475569', lineHeight: '1.6', paddingTop: '4px' }}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowManualInstructions(false)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)'
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
