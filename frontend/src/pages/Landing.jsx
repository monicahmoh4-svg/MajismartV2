import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Droplets, ArrowRight, Shield, Smartphone, Globe, 
  Users, Leaf, BarChart3, CreditCard 
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
}

export default function Landing() {
  return (
    <div className="landing-page">
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-bg">
          <img 
            src="https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=2574&auto=format&fit=crop" 
            alt="African community water access" 
          />
          <div className="hero-overlay"></div>
        </div>
        
        <motion.div 
          className="hero-content container"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="live-badge">
            <span className="pulse-dot"></span> Live — IoT Sensors Active Across Kenya
          </motion.div>
          
          <motion.h1 variants={fadeInUp}>
            Powering the Future of Water,<br />
            <span className="text-gradient">One Drop at a Time</span>
          </motion.h1>
          
          <motion.p variants={fadeInUp} className="hero-subtitle">
            MajiSmart combines IoT smart water metering, blockchain transparency, and AI-driven analytics to democratize access to clean water. Transparent, tamper-proof, and built for everyone.
          </motion.p>
          
          <motion.div variants={fadeInUp} className="hero-buttons">
            <Link to="/login" className="btn btn-primary btn-lg">
              Launch Dashboard <ArrowRight size={18} />
            </Link>
            <Link to="/register" className="btn btn-outline btn-lg btn-glass">
              Explore Water Points
            </Link>
          </motion.div>

          <motion.div variants={fadeInUp} className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">600M+</span>
              <span className="stat-label">Africans needing clean water</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">$40B</span>
              <span className="stat-label">Market Opportunity</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">On-Chain Transparency</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Middlemen</span>
            </div>
          </motion.div>
        </motion.div>
        
        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8f9fa"/>
          </svg>
        </div>
      </section>

      {/* USSD / MARGINALIZED COMMUNITIES SECTION */}
      <section className="section ussd-section">
        <div className="container grid-2">
          <motion.div 
            className="ussd-content"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="section-title">
              Water for Marginalized Communities
            </motion.h2>
            <motion.p variants={fadeInUp} className="section-subtitle" style={{ margin: '0 0 24px 0' }}>
              No smartphone? No problem. Access MajiSmart via basic feature phones using USSD.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="ussd-steps">
              <h3>How to Use MajiSmart on Any Phone</h3>
              <ol>
                <li>
                  <span className="step-num">1</span>
                  <span className="step-text">Dial <code>*384*99#</code> on your phone.</span>
                </li>
                <li>
                  <span className="step-num">2</span>
                  <span className="step-text">Select "Check Balance" or "Buy Water".</span>
                </li>
                <li>
                  <span className="step-num">3</span>
                  <span className="step-text">Pay via M-Pesa. Your meter is topped up instantly.</span>
                </li>
              </ol>
            </motion.div>
            
            <motion.p variants={fadeInUp} className="ussd-note">
              Available across Kenya, Tanzania, Uganda & Nigeria.
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="ussd-visual"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <img 
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2670&auto=format&fit=crop" 
              alt="Mobile money payment in Africa" 
              className="rounded-shadow"
            />
          </motion.div>
        </div>
      </section>

      {/* ECOSYSTEM SECTION */}
      <section className="section ecosystem-section">
        <div className="container">
          <motion.div 
            className="section-header center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="section-title">The Complete Water Ecosystem</h2>
            <p className="section-subtitle">
              Everything you need to generate, trade, and manage clean water in a decentralized world.
            </p>
          </motion.div>

          <motion.div 
            className="grid-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {[
              { 
                icon: BarChart3, 
                title: 'Personal Water Dashboard', 
                desc: 'Real-time, blockchain-verified consumption history, live usage tracking, and a tamper-proof audit trail.' 
              },
              { 
                icon: Users, 
                title: 'P2P Water Trading', 
                desc: 'Prosumers sell excess water credits directly to neighbors, eliminating the middleman entirely.' 
              },
              { 
                icon: Droplets, 
                title: 'Fractional Infrastructure Ownership', 
                desc: 'Tokenized water infrastructure via Water NFTs. Own a share of a borehole and earn passive income.' 
              },
              { 
                icon: Globe, 
                title: 'Community Water DAOs', 
                desc: 'Pool resources, collectively own infrastructure, and govern usage via decentralized voting.' 
              },
              { 
                icon: CreditCard, 
                title: 'Utility Integration', 
                desc: 'Purchase water from providers using stablecoins (USDC, cKES) or traditional M-Pesa.' 
              },
              { 
                icon: Leaf, 
                title: 'Smart Metering & Conservation', 
                desc: 'IoT meters record data on-chain. Generate verifiable conservation credits for clean water usage.' 
              }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                className="ecosystem-card"
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <div className="card-icon">
                  <item.icon size={28} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <Link to="/register" className="card-link">
                  Learn More <ArrowRight size={16} />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* TRUST / BLOCKCHAIN SECTION */}
      <section className="section trust-section">
        <div className="container">
          <motion.div 
            className="trust-content"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="section-title center">
              Trustless Water,<br />Powered by Blockchain
            </motion.h2>
            <motion.p variants={fadeInUp} className="section-subtitle center">
              Every feature of MajiSmart is anchored in blockchain not for the hype — but because water demands trust. 
              Trust that your meter is accurate. Trust that your payment went through. Trust that the water you bought is real.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="grid-2">
              <div className="trust-card">
                <Shield size={32} className="trust-icon" />
                <h3>Tamper-Proof Audit Trail</h3>
                <p>No falsified readings. No inflated bills. Just transparent, immutable water data.</p>
              </div>
              <div className="trust-card">
                <Smartphone size={32} className="trust-icon" />
                <h3>Borderless Stablecoin Payments</h3>
                <p>Pay for water using USDC or cKES. Fast, accessible from any mobile device.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="section cta-section">
        <div className="container center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="cta-title">Ready to democratize water?</h2>
            <p className="cta-subtitle">Join the movement. Track, trust, and trade water fairly.</p>
            <Link to="/register" className="btn btn-primary btn-lg btn-glow">
              Get Started Now <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <Droplets size={24} className="footer-logo" />
              <span>MajiSmart</span>
            </div>
            <p className="footer-copy">© 2026 MajiSmart. Decentralizing water access across Africa.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
