const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

export async function analyzeSentiment(review) {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return response.json();
  // Expected shape:
  // {
  //   sentiment: "Positive" | "Negative" | "Neutral",
  //   confidence: 0.0 – 1.0,
  //   analysis: "Gemini justification string"
  // }
}