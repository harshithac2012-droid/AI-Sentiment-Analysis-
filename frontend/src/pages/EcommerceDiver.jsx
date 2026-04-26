import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { analyzeDeepDive } from '../api'

const SENT_COLOR = { Positive: '#10b981', Neutral: '#06b6d4', Negative: '#ef4444' }
const SENT_BG    = { Positive: 'rgba(16,185,129,0.15)', Neutral: 'rgba(6,182,212,0.15)', Negative: 'rgba(239,68,68,0.15)' }

function AspectBar({ aspect }) {
  const [w, setW] = useState(0)
  useState(() => { const t = setTimeout(() => setW(aspect.score * 100), 150); return () => clearTimeout(t) })
  const color = SENT_COLOR[aspect.sentiment] || '#64748b'
  return (
    <div className="aspect-row">
      <div className="aspect-head">
        <span className="aspect-name">{aspect.name}</span>
        <div className="aspect-meta">
          <span className="aspect-badge" style={{ background: SENT_BG[aspect.sentiment], color }}>
            {aspect.sentiment}
          </span>
          <span className="aspect-mentions">{aspect.mention_count} mentions</span>
        </div>
      </div>
      <div className="conf-bar-track">
        <div className="conf-bar-fill" style={{ width: `${w}%`, background: color, transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>
      <p className="aspect-summary">{aspect.summary}</p>
    </div>
  )
}

export default function EcommerceDiver() {
  const [productName, setProductName] = useState('')
  const [input, setInput] = useState('')
  const [reviews, setReviews] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const resultRef = useRef(null)

  function addReview(val) {
    const v = val.trim()
    if (v && reviews.length < 30) setReviews(r => [...r, v])
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addReview(input) }
    else if (e.key === 'Backspace' && !input && reviews.length) setReviews(r => r.slice(0, -1))
  }

  function handlePaste(e) {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean)
    if (lines.length > 1) setReviews(r => [...r, ...lines].slice(0, 30))
    else setInput(text)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const all = input.trim() ? [...reviews, input.trim()] : reviews
    if (all.length === 0) { setError('Add at least one review.'); return }
    setError(''); setResult(null); setLoading(true)
    try {
      const data = await analyzeDeepDive(all, productName || 'the product')
      setResult(data); setReviews(all); setInput('')
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
    } catch (err) {
      setError(err.message || 'Analysis failed.')
    } finally { setLoading(false) }
  }

  const sentColor = result ? SENT_COLOR[result.overall_sentiment] || '#06b6d4' : '#06b6d4'
  const scoreLabel = result ? `${Math.round((result.overall_score ?? 0.5) * 100)}%` : ''

  return (
    <motion.div className="page" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="page-container">
        <div className="page-header">
          <div className="page-icon" style={{ background: 'rgba(6,182,212,0.12)', color: '#06b6d4' }}>🔍</div>
          <h1 className="page-title">E-Commerce Deep Diver</h1>
          <p className="page-sub">Paste product reviews (one per Enter). Get aspect-based sentiment — battery life, screen quality, and more — in seconds.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card">
            <label className="input-label">Product Name (optional)</label>
            <input
              type="text"
              placeholder="e.g. Samsung Galaxy S25"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />
            <label className="input-label">Customer Reviews <span style={{ color: '#64748b', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— paste multiple lines or press Enter after each</span></label>
            <div className="tags-wrap" onClick={() => inputRef.current?.focus()}>
              {reviews.map((r, i) => (
                <span key={i} className="tag" style={{ background: 'rgba(6,182,212,0.12)', borderColor: 'rgba(6,182,212,0.25)', color: '#67e8f9' }}>
                  {r.length > 40 ? r.slice(0, 40) + '…' : r}
                  <button type="button" className="tag-remove" onClick={(e) => { e.stopPropagation(); setReviews(arr => arr.filter((_, j) => j !== i)) }}>✕</button>
                </span>
              ))}
              <input
                ref={inputRef}
                className="tag-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={reviews.length === 0 ? 'Paste a review and press Enter…' : ''}
              />
            </div>
            <div className="char-count">{reviews.length + (input.trim() ? 1 : 0)} / 30 reviews</div>
          </div>

          {error && <div className="error-box">⚠ {error}</div>}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}
              style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg,#06b6d4,#0284c7)', boxShadow: '0 4px 20px rgba(6,182,212,0.3)' }}>
              {loading ? <><div className="spinner" />&nbsp;Analyzing…</> : '🔍 Deep Dive Analysis'}
            </button>
            {reviews.length > 0 && <button type="button" className="btn btn-ghost" onClick={() => { setReviews([]); setInput(''); setResult(null) }}>Clear</button>}
          </div>
        </form>

        {result && (
          <div ref={resultRef} className="fade-up" style={{ marginTop: '1.5rem' }}>
            {/* Verdict */}
            <div className="verdict-box">
              <span className="verdict-icon">💬</span>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>Shopper TL;DR</div>
                <div>{result.verdict}</div>
              </div>
            </div>

            {/* Overall */}
            <div className="card">
              <div className="card-title">Overall Assessment</div>
              <div className="score-row">
                <span className="sentiment-badge" style={{ background: SENT_BG[result.overall_sentiment], color: sentColor, margin: 0 }}>
                  <span className="sentiment-dot" style={{ background: sentColor }} />
                  {result.overall_sentiment}
                </span>
                <span className="score-pill" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: sentColor }}>
                  Score: {scoreLabel}
                </span>
              </div>

              {/* Pros / Cons */}
              <div className="pros-cons">
                <div className="pros-box">
                  <div className="pros-cons-title pos">✓ Pros</div>
                  <ul className="pros-cons">
                    {(result.pros || []).map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
                <div className="cons-box">
                  <div className="pros-cons-title neg">✕ Cons</div>
                  <ul className="pros-cons">
                    {(result.cons || []).map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            {/* Aspect breakdown */}
            {result.aspects?.length > 0 && (
              <div className="card">
                <div className="card-title">Aspect Breakdown</div>
                <div className="aspect-list">
                  {result.aspects.map((a, i) => <AspectBar key={i} aspect={a} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
