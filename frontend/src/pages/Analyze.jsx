import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { analyzeSentiment } from '../api'

const SENTIMENT_STYLE = {
  Positive: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', dot: '#10b981', bar: 'linear-gradient(90deg,#10b981,#059669)' },
  Neutral:  { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  dot: '#06b6d4', bar: 'linear-gradient(90deg,#06b6d4,#0284c7)' },
  Negative: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  dot: '#ef4444', bar: 'linear-gradient(90deg,#ef4444,#b91c1c)' },
}

function ConfBar({ value }) {
  const [w, setW] = useState(0)
  const hue = value > 0.7 ? 'linear-gradient(90deg,#10b981,#059669)' : value > 0.45 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#ef4444,#b91c1c)'
  useEffect(() => { const t = setTimeout(() => setW(value * 100), 100); return () => clearTimeout(t) }, [value])
  return (
    <div className="conf-bar-wrap">
      <div className="conf-bar-label">
        <span>Confidence</span>
        <span style={{ color: '#f1f5f9' }}>{Math.round(value * 100)}%</span>
      </div>
      <div className="conf-bar-track">
        <div className="conf-bar-fill" style={{ width: `${w}%`, background: hue }} />
      </div>
    </div>
  )
}

export default function Analyze() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recording, setRecording] = useState(false)
  const [copied, setCopied] = useState(false)
  const resultRef = useRef(null)
  const recognitionRef = useRef(null)

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'en-US'
      rec.onresult = (e) => {
        let transcript = ''
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript
        }
        setText(transcript)
      }
      rec.onend = () => setRecording(false)
      recognitionRef.current = rec
    }
  }, [])

  function toggleMic() {
    const rec = recognitionRef.current
    if (!rec) { setError('Speech recognition not supported in this browser.'); return }
    if (recording) { rec.stop(); setRecording(false) }
    else { rec.start(); setRecording(true); setError('') }
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!text.trim()) { setError('Please enter text or use the microphone.'); return }
    setError(''); setResult(null); setLoading(true)
    try {
      const data = await analyzeSentiment(text.trim())
      setResult(data)
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const style = result ? SENTIMENT_STYLE[result.sentiment] || SENTIMENT_STYLE.Neutral : null

  return (
    <motion.div className="page" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="page-container">
        <div className="page-header">
          <div className="page-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>🎙️</div>
          <h1 className="page-title">Sentiment Analyzer</h1>
          <p className="page-sub">Type, paste, or speak your text. Sentix decodes the emotion in seconds.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card">
            <label className="input-label">Your Text</label>
            <div className="textarea-row">
              <textarea
                rows={6}
                maxLength={1500}
                placeholder={'Type or paste text here…\n\nOr click the microphone to speak.'}
                value={text}
                onChange={e => { setText(e.target.value); if (error) setError('') }}
              />
              <button
                type="button"
                className={`mic-btn ${recording ? 'recording' : ''}`}
                onClick={toggleMic}
                title={recording ? 'Stop recording' : 'Start voice input'}
              >
                🎤
              </button>
            </div>
            <div className="char-count">{text.length} / 1500</div>
            {recording && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'mic-pulse 1s ease-in-out infinite' }} />
                Listening… speak now
              </div>
            )}
          </div>

          {error && <div className="error-box">⚠ {error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
            {loading ? <><div className="spinner" />&nbsp;Analyzing…</> : '✦ Analyze Sentiment'}
          </button>
        </form>

        {result && style && (
          <div ref={resultRef} className="card fade-up" style={{ marginTop: '1.5rem', borderColor: 'rgba(139,92,246,0.2)' }}>
            <div className="sentiment-badge" style={{ background: style.bg, color: style.color }}>
              <span className="sentiment-dot" style={{ background: style.dot }} />
              {result.sentiment}
            </div>

            <ConfBar value={result.confidence} />

            {result.top_classes && (
              <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {result.top_classes.map(c => (
                  <div key={c.label} style={{
                    flex: 1, minWidth: 90,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 8, padding: '0.6rem 0.75rem', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: SENTIMENT_STYLE[c.label]?.color || '#fff' }}>
                      {Math.round(c.probability * 100)}%
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{c.label}</div>
                  </div>
                ))}
              </div>
            )}

            {result.analysis && (
              <div className="ai-block">
                <div className="ai-block-header">
                  <span style={{ color: '#a78bfa', fontSize: '0.9rem' }}>✦</span>
                  <span className="ai-block-title">AI Analysis</span>
                  <span className="ai-gem-badge">Gemini</span>
                </div>
                <p>{result.analysis}</p>
              </div>
            )}

            <button
              className="copy-btn"
              style={{ marginTop: '1rem' }}
              onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
            >
              {copied ? '✓ Copied' : 'Copy Text'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
