import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, X, Send, Sparkles } from 'lucide-react'
import api from '../../api'
import { Typewriter } from '../ui/TextAnimate'

const FALLBACK_TOPICS = [
  { id: 'pay', label: 'Pay for water' },
  { id: 'token', label: 'Lost token' },
  { id: 'price', label: 'Prices & tariffs' },
  { id: 'account', label: 'Account & login' },
]

const OFFLINE_REPLY =
  'Maji is warming up (the server may be waking from sleep). Please retry in a few seconds — or tap a topic below.'

export default function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [topics, setTopics] = useState(FALLBACK_TOPICS)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [greeted, setGreeted] = useState(false)
  const scrollRef = useRef(null)
  const navigate = useNavigate()

  // Load live topics + greeting on first open
  useEffect(() => {
    if (!open || greeted) return
    setGreeted(true)
    api.get('/assistant/topics').then((t) => {
      if (Array.isArray(t) && t.length) setTopics(t)
    }).catch(() => {})
    setMessages([{
      from: 'bot',
      text: "Hi, I'm Maji — your MajiSmart water assistant. Ask me about payments, tokens, tariffs, reports, or your dashboard. How can I help?",
      topics: null,
    }])
  }, [open, greeted])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy, open])

  const pushUser = (text) => setMessages((m) => [...m, { from: 'user', text }])

  const ask = async (text) => {
    const clean = String(text || '').trim().slice(0, 500)
    if (!clean || busy) return
    pushUser(clean)
    setInput('')
    setBusy(true)
    try {
      const res = await api.post('/assistant/chat', { message: clean })
      setMessages((m) => [...m, {
        from: 'bot',
        text: res.reply,
        actions: res.actions || [],
        topics: res.topics || [],
      }])
    } catch (e) {
      setMessages((m) => [...m, { from: 'bot', text: OFFLINE_REPLY, topics: FALLBACK_TOPICS, actions: [] }])
    } finally {
      setBusy(false)
    }
  }

  const askTopic = async (topic) => {
    pushUser(topic.label)
    setBusy(true)
    try {
      const res = await api.post(`/assistant/topic/${topic.id}`, {})
      setMessages((m) => [...m, {
        from: 'bot', text: res.reply, actions: res.actions || [], topics: res.topics || [],
      }])
    } catch (e) {
      setMessages((m) => [...m, { from: 'bot', text: OFFLINE_REPLY, topics: FALLBACK_TOPICS, actions: [] }])
    } finally {
      setBusy(false)
    }
  }

  const go = (link) => {
    setOpen(false)
    navigate(link)
  }

  return (
    <>
      {/* Floating orb */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close Maji assistant' : 'Ask Maji, your water assistant'}
        className="maji-orb"
      >
        <span className="maji-ping" aria-hidden />
        <span className="maji-ping maji-ping-2" aria-hidden />
        {open ? <X size={24} color="white" /> : <Droplets size={26} color="white" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog" aria-label="Maji water assistant"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            className="maji-panel glass-dark"
          >
            <header className="maji-head">
              <div className="maji-avatar"><Droplets size={18} color="white" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Maji <Sparkles size={13} color="#e4f222" />
                </div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.65)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className="maji-live-dot" /> Water Assistant · replies instantly
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close"
                style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)', color: 'white', borderRadius: 8, padding: 6, cursor: 'pointer' }}>
                <X size={15} />
              </button>
            </header>

            <div ref={scrollRef} className="maji-msgs">
              {messages.map((m, i) => m.from === 'user' ? (
                <div key={i} className="maji-user">{m.text}</div>
              ) : (
                <div key={i} className="maji-bot">
                  <Typewriter text={m.text} />
                  {(m.actions?.length > 0) && (
                    <div className="maji-actions">
                      {m.actions.map((a, j) => (
                        <button key={j} onClick={() => go(a.link)}>{a.label} →</button>
                      ))}
                    </div>
                  )}
                  {(m.topics?.length > 0) && (
                    <div className="maji-actions">
                      {m.topics.map((t) => (
                        <button key={t.id} onClick={() => askTopic(t)} className="ghost">{t.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {busy && (
                <div className="maji-bot maji-typing" aria-label="Maji is typing">
                  <span /><span /><span />
                </div>
              )}
            </div>

            {!busy && messages.length <= 1 && (
              <div className="maji-actions maji-topics">
                {topics.map((t) => (
                  <button key={t.id} onClick={() => askTopic(t)} className="ghost">{t.label}</button>
                ))}
              </div>
            )}

            <form className="maji-input" onSubmit={(e) => { e.preventDefault(); ask(input) }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about water, tokens, bills…"
                maxLength={500}
                aria-label="Message Maji"
              />
              <button type="submit" disabled={busy || !input.trim()} aria-label="Send">
                <Send size={16} />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}
