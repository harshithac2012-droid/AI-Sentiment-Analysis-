import os
import logging
import traceback
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

# ── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Bootstrap ──────────────────────────────────────────────────────────────
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ── Gemini setup ───────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
if not GEMINI_API_KEY:
    log.error("GEMINI_API_KEY is missing from .env")
else:
    genai.configure(api_key=GEMINI_API_KEY)
    log.info("Gemini client ready.")

MODEL_NAME = "gemini-3.1-flash-lite-preview"

def get_model():
    return genai.GenerativeModel(MODEL_NAME)

def extract_json(text):
    """Extract JSON from a Gemini response that may be wrapped in markdown."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())


# ── 1. Basic Sentiment Analysis ────────────────────────────────────────────
@app.route("/analyze", methods=["POST"])
def analyze():
    body = request.get_json(silent=True)
    if not body or "review" not in body:
        return jsonify({"error": "No review provided"}), 400

    review = body["review"].strip()
    if not review or len(review) > 1500:
        return jsonify({"error": "Review must be between 1 and 1500 characters."}), 400

    try:
        model = get_model()
        prompt = f"""
Analyze the sentiment of the following text:
"{review}"

Rules:
1. If the sentence uses "but", "however", or "yet", the clause after the conjunction carries the most weight.
2. Only return "Neutral" if the text is purely informational or lacks any emotional stance.

Return ONLY a valid JSON object with these exact keys:
- "sentiment": One of "Positive", "Neutral", or "Negative"
- "confidence": A float between 0.0 and 1.0
- "analysis": A brief 2-sentence justification. No markdown bolding.
- "top_classes": An array of objects with "label" and "probability" for Positive, Neutral, and Negative.

Example:
{{
    "sentiment": "Negative",
    "confidence": 0.92,
    "analysis": "The conjunction 'but' shifts the overall tone to negative. Functional failures outweigh the initial praise.",
    "top_classes": [
        {{"label": "Positive", "probability": 0.05}},
        {{"label": "Neutral", "probability": 0.03}},
        {{"label": "Negative", "probability": 0.92}}
    ]
}}
"""
        response = model.generate_content(prompt)
        data = extract_json(response.text)
        log.info(f"Analyze: {data.get('sentiment')} ({data.get('confidence', 0)*100:.1f}%)")
        return jsonify(data)

    except Exception as e:
        log.error(traceback.format_exc())
        return jsonify({"error": "Analysis failed. Please try again."}), 500


# ── 2. Brand Guardian ──────────────────────────────────────────────────────
@app.route("/brand-guardian", methods=["POST"])
def brand_guardian():
    body = request.get_json(silent=True)
    if not body or "mentions" not in body:
        return jsonify({"error": "No mentions provided"}), 400

    mentions = body["mentions"]
    if not isinstance(mentions, list) or len(mentions) == 0:
        return jsonify({"error": "mentions must be a non-empty array of strings"}), 400
    if len(mentions) > 50:
        return jsonify({"error": "Maximum 50 mentions allowed"}), 400

    try:
        model = get_model()
        mentions_text = "\n".join([f"{i+1}. {m}" for i, m in enumerate(mentions)])

        prompt = f"""
You are a brand sentiment monitoring AI. Analyze the following list of social media mentions:

{mentions_text}

Return ONLY a valid JSON object with these exact keys:
- "overall_sentiment": One of "Positive", "Neutral", "Negative", or "Mixed"
- "volatility_score": A float from 0.0 to 1.0. Score is high if there is a large mix of strongly positive and strongly negative mentions.
- "crisis_alert": true if more than 20% of mentions are highly negative, else false
- "breakdown": An object with keys "positive", "neutral", "negative" — each being a count (integer)
- "top_positive": The single most positive mention string (verbatim from the list)
- "top_negative": The single most negative mention string (verbatim from the list)
- "summary": A 2-3 sentence executive summary of the brand's sentiment landscape.
- "mentions_analysis": An array of objects, one per mention, each with:
    - "text": the mention text
    - "sentiment": "Positive", "Neutral", or "Negative"
    - "score": float 0.0 to 1.0

Example structure (do not copy values):
{{
    "overall_sentiment": "Mixed",
    "volatility_score": 0.72,
    "crisis_alert": false,
    "breakdown": {{"positive": 3, "neutral": 2, "negative": 2}},
    "top_positive": "...",
    "top_negative": "...",
    "summary": "...",
    "mentions_analysis": [
        {{"text": "...", "sentiment": "Positive", "score": 0.9}}
    ]
}}
"""
        response = model.generate_content(prompt)
        data = extract_json(response.text)
        log.info(f"Brand Guardian: {data.get('overall_sentiment')}, crisis={data.get('crisis_alert')}")
        return jsonify(data)

    except Exception as e:
        log.error(traceback.format_exc())
        return jsonify({"error": "Brand analysis failed. Please try again."}), 500


# ── 3. E-Commerce Deep Dive ────────────────────────────────────────────────
@app.route("/deep-dive", methods=["POST"])
def deep_dive():
    body = request.get_json(silent=True)
    if not body or "reviews" not in body:
        return jsonify({"error": "No reviews provided"}), 400

    reviews = body["reviews"]
    if not isinstance(reviews, list) or len(reviews) == 0:
        return jsonify({"error": "reviews must be a non-empty array of strings"}), 400
    if len(reviews) > 30:
        return jsonify({"error": "Maximum 30 reviews allowed"}), 400

    product_name = body.get("product_name", "the product")

    try:
        model = get_model()
        reviews_text = "\n".join([f"{i+1}. {r}" for i, r in enumerate(reviews)])

        prompt = f"""
You are an AI product analyst specializing in aspect-based sentiment analysis.
Analyze the following customer reviews for "{product_name}":

{reviews_text}

Identify the most-discussed product aspects (e.g. battery life, screen quality, delivery, price, build quality, customer service, etc.) and determine the sentiment for each.

Return ONLY a valid JSON object with these exact keys:
- "overall_sentiment": "Positive", "Neutral", "Negative", or "Mixed"
- "overall_score": A float 0.0 to 1.0 (1.0 = most positive)
- "verdict": A one-sentence TL;DR summary for a shopper.
- "pros": An array of strings — the top 3 positive takeaways.
- "cons": An array of strings — the top 3 negative takeaways.
- "aspects": An array of aspect objects, each with:
    - "name": The aspect name (e.g. "Battery Life")
    - "sentiment": "Positive", "Neutral", or "Negative"
    - "score": A float 0.0 to 1.0
    - "summary": A one-sentence summary of what people say about this aspect.
    - "mention_count": integer count of how many reviews mention this aspect

Example structure:
{{
    "overall_sentiment": "Mixed",
    "overall_score": 0.61,
    "verdict": "Great screen but battery life is a serious concern.",
    "pros": ["Vibrant display", "Lightweight design"],
    "cons": ["Short battery life", "Overpriced accessories"],
    "aspects": [
        {{"name": "Battery Life", "sentiment": "Negative", "score": 0.2, "summary": "Most reviewers report the battery drains within 4 hours.", "mention_count": 8}}
    ]
}}
"""
        response = model.generate_content(prompt)
        data = extract_json(response.text)
        log.info(f"Deep Dive: {data.get('overall_sentiment')}, {len(data.get('aspects', []))} aspects")
        return jsonify(data)

    except Exception as e:
        log.error(traceback.format_exc())
        return jsonify({"error": "Deep dive analysis failed. Please try again."}), 500


# ── 4. Content Optimizer ───────────────────────────────────────────────────
@app.route("/optimize", methods=["POST"])
def optimize():
    body = request.get_json(silent=True)
    if not body or "content" not in body:
        return jsonify({"error": "No content provided"}), 400

    content = body["content"].strip()
    target_tone = body.get("target_tone", "confident and professional")

    if not content or len(content) > 3000:
        return jsonify({"error": "Content must be between 1 and 3000 characters."}), 400

    try:
        model = get_model()
        prompt = f"""
You are a professional writing coach and sentiment optimizer.

Analyze and rewrite the following content to sound "{target_tone}":

ORIGINAL CONTENT:
"{content}"

Return ONLY a valid JSON object with these exact keys:
- "original_sentiment": "Positive", "Neutral", or "Negative"
- "original_tone": A short phrase describing the current tone (e.g. "aggressive", "passive", "uncertain", "overly formal")
- "original_score": A float 0.0 to 1.0 for current tone alignment with the target
- "issues": An array of strings — specific phrases or patterns that need improvement (max 4)
- "rewritten": The fully rewritten content matching the target tone. Preserve meaning, but optimize tone.
- "changes_made": An array of strings describing the key changes made (max 4)
- "new_score": A float 0.0 to 1.0 for how well the rewritten version matches the target tone

Example structure:
{{
    "original_sentiment": "Negative",
    "original_tone": "desperate and uncertain",
    "original_score": 0.3,
    "issues": ["Phrases like 'I think maybe' signal low confidence", "Starting with 'I' weakens the hook"],
    "rewritten": "...",
    "changes_made": ["Replaced 'I think maybe' with assertive language", "Restructured opening for impact"],
    "new_score": 0.88
}}
"""
        response = model.generate_content(prompt)
        data = extract_json(response.text)
        log.info(f"Optimize: {data.get('original_tone')} -> score {data.get('new_score')}")
        return jsonify(data)

    except Exception as e:
        log.error(traceback.format_exc())
        return jsonify({"error": "Content optimization failed. Please try again."}), 500


# ── Health ─────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "engine": "Gemini AI",
        "model": MODEL_NAME,
        "endpoints": ["/analyze", "/brand-guardian", "/deep-dive", "/optimize"]
    })


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)