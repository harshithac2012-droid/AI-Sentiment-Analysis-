import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const features = [
  {
    icon: '🎙️',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    title: 'Sentiment Analyzer',
    desc: 'Paste text or use your microphone to get instant AI-powered sentiment analysis with confidence scoring.',
    tag: 'Speech-to-Text',
    tagColor: 'rgba(139,92,246,0.2)',
    tagText: '#a78bfa',
    to: '/analyze',
  },
  {
    icon: '🛡️',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    title: 'Brand Guardian',
    desc: 'Paste up to 50 social media mentions. Get a volatility score, crisis alerts, and an executive summary in seconds.',
    tag: 'Social Media',
    tagColor: 'rgba(239,68,68,0.15)',
    tagText: '#fca5a5',
    to: '/brand-guardian',
  },
  {
    icon: '🔍',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    title: 'E-Commerce Deep Diver',
    desc: 'Analyze product reviews by aspect — battery life, screen quality, delivery, and more. Get a shopper TL;DR instantly.',
    tag: 'Aspect Analysis',
    tagColor: 'rgba(6,182,212,0.15)',
    tagText: '#67e8f9',
    to: '/deep-dive',
  },
  {
    icon: '✍️',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    title: 'Content Optimizer',
    desc: 'Paste your cover letter, email, or post draft. Get a tone analysis and AI-rewritten version with the perfect sentiment.',
    tag: 'Tone Rewriter',
    tagColor: 'rgba(16,185,129,0.15)',
    tagText: '#6ee7b7',
    to: '/optimize',
  },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16,1,0.3,1] } } }

export default function Home() {
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Hero */}
      <div className="hero">
        <div className="hero-bg" />
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <span>✦</span> Powered by Gemini AI
        </motion.div>
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          Intelligence Behind Every Word
        </motion.h1>
        <motion.p
          className="hero-sub"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          Sentix decodes sentiment at scale — for brands, shoppers, and creators. Four powerful tools, one elegant platform.
        </motion.p>
        <motion.div
          className="hero-cta-row"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Link to="/analyze" className="btn btn-primary">Start Analyzing →</Link>
          <Link to="/brand-guardian" className="btn btn-ghost">Brand Guardian</Link>
        </motion.div>
      </div>

      {/* Feature cards */}
      <motion.div
        className="features-grid"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {features.map(f => (
          <motion.div key={f.to} variants={item}>
            <Link to={f.to} className="feature-card">
              <div className="feature-icon" style={{ background: f.bg, color: f.color }}>
                {f.icon}
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
              <span
                className="feature-tag"
                style={{ background: f.tagColor, color: f.tagText }}
              >
                {f.tag}
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
