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

# ── Routes ─────────────────────────────────────────────────────────────────
@app.route("/analyze", methods=["POST"])
def analyze():
    body = request.get_json(silent=True)
    if not body or "review" not in body:
        return jsonify({"error": "No review provided"}), 400

    review = body["review"].strip()
    if not review or len(review) > 1500:
        return jsonify({"error": "Review must be between 1 and 1500 characters."}), 400

    try:
        # Prompting Gemini to return structured JSON
        model = genai.GenerativeModel("gemini-3.1-flash-lite-preview")
        
        prompt = f"""
        Analyze the sentiment of the following text:
        "{review}"

        Rules for analysis:
        1. Prioritize the final conclusion of the text. If a sentence uses "but", "however", or "yet", the sentiment of the clause following the conjunction carries the most weight.
        2. Only return "Neutral" if the text is purely informational or lacks any emotional/qualitative stance.

        Return the result strictly as a JSON object with the following keys:
        - "sentiment": One of "Positive", "Neutral", or "Negative"
        - "confidence": A float between 0.0 and 1.0
        - "analysis": A brief 2-sentence justification. Do not use markdown bolding.
        - "top_classes": An array of objects with "label" and "probability" for Positive, Neutral, and Negative.

        Example output:
        {{
            "sentiment": "Negative",
            "confidence": 0.92,
            "analysis": "While the user praises the aesthetic, the final verdict focuses on functional failures like sluggishness. The adversarial conjunction 'but' shifts the overall sentiment to negative.",
            "top_classes": [
                {{"label": "Positive", "probability": 0.05}},
                {{"label": "Neutral", "probability": 0.03}},
                {{"label": "Negative", "probability": 0.92}}
            ]
        }}
        """

        response = model.generate_content(prompt)
        
        # Extracting JSON from response (sometimes Gemini wraps it in markdown)
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        data = json.loads(response_text)
        
        log.info(f"Gemini Prediction: {data.get('sentiment')} ({data.get('confidence')*100:.1f}%)")
        
        return jsonify(data)

    except Exception as e:
        log.error(f"Gemini error: {str(e)}")
        log.error(traceback.format_exc())
        return jsonify({"error": "AI Analysis failed. Please check your API key and try again."}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "engine": "Gemini AI"
    })


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)