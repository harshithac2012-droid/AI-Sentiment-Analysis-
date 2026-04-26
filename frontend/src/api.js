// src/api.js
const API_BASE = "https://harshithac2006-cineread.hf.space";

export async function analyzeSentiment(review) {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review }),
  });

  if (!response.ok) {
    throw new Error("The AI backend is not responding. Check your Hugging Face Space.");
  }

  return response.json();
}
  // Expected shape:
  // {
  //   sentiment: "Positive" | "Negative" | "Neutral",
  //   confidence: 0.0 – 1.0,
  //   analysis: "Gemini justification string"
  // }
}
