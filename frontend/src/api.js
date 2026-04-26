// Use relative paths so Vite proxy handles them — no CORS issues
const API_BASE = ''

async function post(endpoint, body) {
  let res
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    throw new Error('Cannot reach the backend. Make sure the Flask server is running on port 5000.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`)
  return data
}

export const analyzeSentiment  = (review)                    => post('/analyze',         { review })
export const analyzeBrand       = (mentions)                  => post('/brand-guardian',  { mentions })
export const analyzeDeepDive    = (reviews, product_name)     => post('/deep-dive',       { reviews, product_name })
export const optimizeContent    = (content, target_tone)      => post('/optimize',        { content, target_tone })
