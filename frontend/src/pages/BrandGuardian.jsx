import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { analyzeBrand } from '../api'

const DOT = { Positive: '#10b981', Neutral: '#06b6d4', Negative: '#ef4444' }

function VolatilityMeter({ score }) {
  const pct = Math.round(score * 100)
  const color = score > 0.6 ? '#ef4444' : score > 0.35 ? '#f59e0b' : '#10b981'
  const [w, setW] = useState(0)
  useState(() => { const t = setTimeout(() => setW(pct), 120); return () => clearTimeout(t) })
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>
        <span>Volatility Score</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div className="conf-bar-track">
        <div className="conf-bar-fill" style={{ width: `${w}%`, background: color, transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>
      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.3rem' }}>
        {score > 0.6 ? 'High volatility — significant disagreement in audience sentiment' : score > 0.35 ? 'Moderate volatility — mixed signals' : 'Low volatility — audience is largely aligned'}
      </div>
    </div>
  )
}

export default function BrandGuardian() {
  const [input, setInput] = useState('')
  const [tags, setTags] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const resultRef = useRef(null)

  function addTag(val) {
    const v = val.trim()
    if (v && tags.length < 50) setTags(t => [...t, v])
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input) }
    else if (e.key === 'Backspace' && !input && tags.length) setTags(t => t.slice(0, -1))
  }

  function handlePaste(e) {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean)
    if (lines.length > 1) setTags(t => [...t, ...lines].slice(0, 50))
    else setInput(text)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const all = input.trim() ? [...tags, input.trim()] : tags
    if (all.length === 0) { setError('Add at least one mention.'); return }
    setError(''); setResult(null); setLoading(true)
    try {
      const data = await analyzeBrand(all)
      setResult(data); setTags(all); setInput('')
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
    } catch (err) {
      setError(err.message || 'Analysis failed.')
    } finally { setLoading(false) }
  }

  const SENT_COLOR = { Positive: '#10b981', Neutral: '#06b6d4', Negative: '#ef4444' }

  return (
    <motion.div className="page" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="page-container">
        <div className="page-header">
          <div className="page-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>🛡️</div>
          <h1 className="page-title">Brand Guardian</h1>
          <p className="page-sub">Paste up to 50 social media mentions (one per line or press Enter after each). Get crisis alerts, volatility scoring, and an executive summary.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card">
            <label className="input-label">Mentions <span style={{ color: '#64748b', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— paste multiple lines or type & press Enter</span></label>
            <div className="tags-wrap" onClick={() => inputRef.current?.focus()}>
              {tags.map((t, i) => (
                <span key={i} className="tag">
                  {t.length > 40 ? t.slice(0, 40) + '…' : t}
                  <button type="button" className="tag-remove" onClick={(e) => { e.stopPropagation(); setTags(arr => arr.filter((_, j) => j !== i)) }}>✕</button>
                </span>
              ))}
              <input
                ref={inputRef}
                className="tag-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={tags.length === 0 ? 'Type a mention and press Enter…' : ''}
              />
            </div>
            <div className="char-count">{tags.length + (input.trim() ? 1 : 0)} / 50 mentions</div>
          </div>

          {error && <div className="error-box">⚠ {error}</div>}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? <><div className="spinner" />&nbsp;Analyzing…</> : '🛡️ Run Brand Analysis'}
            </button>
            {tags.length > 0 && <button type="button" className="btn btn-ghost" onClick={() => { setTags([]); setInput(''); setResult(null) }}>Clear</button>}
          </div>
        </form>

        {result && (
          <div ref={resultRef} className="fade-up" style={{ marginTop: '1.5rem' }}>
            {/* Crisis Alert */}
            {result.crisis_alert
              ? <div className="crisis-alert">🚨 Crisis Alert — More than 20% of mentions are highly negative. Immediate attention recommended.</div>
              : <div className="crisis-safe">✅ No Crisis Detected — Sentiment is within healthy thresholds.</div>
            }

            {/* Stats */}
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-val" style={{ color: '#10b981' }}>{result.breakdown?.positive ?? 0}</div>
                <div className="stat-label">Positive</div>
              </div>
              <div className="stat-box">
                <div className="stat-val" style={{ color: '#06b6d4' }}>{result.breakdown?.neutral ?? 0}</div>
                <div className="stat-label">Neutral</div>
              </div>
              <div className="stat-box">
                <div className="stat-val" style={{ color: '#ef4444' }}>{result.breakdown?.negative ?? 0}</div>
                <div className="stat-label">Negative</div>
              </div>
            </div>

            {/* Volatility */}
            <div className="card">
              <VolatilityMeter score={result.volatility_score ?? 0} />
              <div className="ai-block">
                <div className="ai-block-header">
                  <span style={{ color: '#a78bfa', fontSize: '0.9rem' }}>✦</span>
                  <span className="ai-block-title">Executive Summary</span>
                  <span className="ai-gem-badge">Gemini</span>
                </div>
                <p>{result.summary}</p>
              </div>
            </div>

            {/* Top mentions */}
            {(result.top_positive || result.top_negative) && (
              <div className="card">
                <div className="card-title">Highlight Mentions</div>
                {result.top_positive && (
                  <div style={{ marginBottom: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.35rem' }}>Top Positive</div>
                    <div style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>{result.top_positive}</div>
                  </div>
                )}
                {result.top_negative && (
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.35rem' }}>Top Negative</div>
                    <div style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>{result.top_negative}</div>
                  </div>
                )}
              </div>
            )}

            {/* Mention breakdown */}
            {result.mentions_analysis?.length > 0 && (
              <div className="card">
                <div className="card-title">All Mentions</div>
                <div className="mention-list">
                  {result.mentions_analysis.map((m, i) => (
                    <div key={i} className="mention-item">
                      <span className="mention-sentiment-dot" style={{ background: DOT[m.sentiment] || '#64748b' }} />
                      <span className="mention-text">{m.text}</span>
                      <span className="mention-score" style={{ color: SENT_COLOR[m.sentiment] }}>{m.sentiment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
