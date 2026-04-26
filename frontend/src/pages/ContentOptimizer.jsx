import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { optimizeContent } from '../api'

const TONES = [
  { id: 'confident and professional', label: '💼 Professional', desc: 'Authoritative & polished' },
  { id: 'warm and empathetic', label: '❤️ Empathetic', desc: 'Caring & relatable' },
  { id: 'concise and direct', label: '⚡ Direct', desc: 'No fluff, high impact' },
  { id: 'persuasive and assertive', label: '🎯 Persuasive', desc: 'Confident & compelling' },
  { id: 'friendly and casual', label: '😊 Casual', desc: 'Approachable & light' },
  { id: 'formal and academic', label: '🎓 Academic', desc: 'Scholarly & precise' },
]

function ScoreBar({ value, label, color }) {
  const [w, setW] = useState(0)
  useState(() => { const t = setTimeout(() => setW(value * 100), 150); return () => clearTimeout(t) })
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.35rem' }}>
        <span>{label}</span>
        <span style={{ color }}>{Math.round(value * 100)}%</span>
      </div>
      <div className="conf-bar-track">
        <div className="conf-bar-fill" style={{ width: `${w}%`, background: color, transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>
    </div>
  )
}

export default function ContentOptimizer() {
  const [content, setContent] = useState('')
  const [tone, setTone] = useState('confident and professional')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const resultRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) { setError('Please enter some content to optimize.'); return }
    setError(''); setResult(null); setLoading(true)
    try {
      const data = await optimizeContent(content.trim(), tone)
      setResult(data)
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
    } catch (err) {
      setError(err.message || 'Optimization failed.')
    } finally { setLoading(false) }
  }

  const origScoreColor = result
    ? result.original_score > 0.65 ? '#10b981' : result.original_score > 0.35 ? '#f59e0b' : '#ef4444'
    : '#64748b'
  const newScoreColor = result
    ? result.new_score > 0.65 ? '#10b981' : result.new_score > 0.35 ? '#f59e0b' : '#ef4444'
    : '#64748b'

  return (
    <motion.div className="page" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="page-container">
        <div className="page-header">
          <div className="page-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>✍️</div>
          <h1 className="page-title">Content Optimizer</h1>
          <p className="page-sub">Paste your draft. Select a target tone. Sentix rewrites it with the exact sentiment that hits the mark — cover letters, emails, blog posts.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tone selector */}
          <div className="card">
            <label className="input-label">Target Tone</label>
            <div className="tone-grid">
              {TONES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`tone-btn ${tone === t.id ? 'selected' : ''}`}
                  onClick={() => setTone(t.id)}
                >
                  <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{t.label}</div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Content textarea */}
          <div className="card">
            <label className="input-label">Your Draft</label>
            <textarea
              rows={8}
              maxLength={3000}
              placeholder="Paste your cover letter, email, post, or any text here…"
              value={content}
              onChange={e => { setContent(e.target.value); if (error) setError('') }}
            />
            <div className="char-count">{content.length} / 3000</div>
          </div>

          {error && <div className="error-box">⚠ {error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}
          >
            {loading ? <><div className="spinner" />&nbsp;Optimizing…</> : '✍️ Optimize My Content'}
          </button>
        </form>

        {result && (
          <div ref={resultRef} className="fade-up" style={{ marginTop: '1.5rem' }}>
            {/* Score comparison */}
            <div className="card">
              <div className="card-title">Tone Alignment Score</div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <span className="score-pill" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: origScoreColor, fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                  Before: {Math.round((result.original_score ?? 0) * 100)}%
                </span>
                <span className="score-arrow">→</span>
                <span className="score-pill" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: newScoreColor, fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                  After: {Math.round((result.new_score ?? 0) * 100)}%
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Target: <span style={{ color: '#a78bfa', fontWeight: 600 }}>{tone}</span></span>
              </div>
              <ScoreBar value={result.original_score ?? 0} label="Original tone match" color={origScoreColor} />
              <div style={{ marginTop: '0.85rem' }}>
                <ScoreBar value={result.new_score ?? 0} label="Optimized tone match" color={newScoreColor} />
              </div>
            </div>

            {/* Original tone diagnosis */}
            <div className="card">
              <div className="card-title">Diagnosis</div>
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Detected tone: </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f59e0b' }}>{result.original_tone}</span>
              </div>
              {result.issues?.length > 0 && (
                <>
                  <div className="section-label">Issues Found</div>
                  <ul style={{ listStyle: 'none' }}>
                    {result.issues.map((issue, i) => (
                      <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem', color: '#fca5a5', marginBottom: '0.4rem' }}>
                        <span style={{ color: '#ef4444', flexShrink: 0 }}>⚠</span> {issue}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Rewritten content */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div className="ai-block-header" style={{ margin: 0 }}>
                  <span style={{ color: '#10b981', fontSize: '0.9rem' }}>✦</span>
                  <span className="ai-block-title" style={{ color: '#10b981' }}>Optimized Version</span>
                  <span className="ai-gem-badge">Gemini</span>
                </div>
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(result.rewritten || '')
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  }}
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <div className="rewrite-block">{result.rewritten}</div>
            </div>

            {/* Changes made */}
            {result.changes_made?.length > 0 && (
              <div className="card">
                <div className="card-title">Changes Made</div>
                <ul className="changes-list">
                  {result.changes_made.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
