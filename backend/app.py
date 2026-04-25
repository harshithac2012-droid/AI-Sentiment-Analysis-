import os
import re
import pickle
import logging
import traceback
from typing import Dict, Any

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import numpy as np
import joblib
from google import genai
from transformers import pipeline

try:
    _JOBLIB_AVAILABLE = True
except ImportError:
    # This is redundant since we import it above, but keeping for compatibility
    _JOBLIB_AVAILABLE = False

# ── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Bootstrap ──────────────────────────────────────────────────────────────
load_dotenv()

# ── Helper Functions (data preprocessing) ──────────────────────────────────────────────────────
def preprocess_negation(text):
    """Combines negations with the following word (e.g., 'not happy' -> 'not_happy')."""
    text = text.lower()
    text = re.sub(r'\b(not|no|never|neither|nor)\b\s+(\w+)', r'\1_\2', text)
    text = re.sub(r'(\w+n\'t)\s+(\w+)', r'\1_\2', text)
    return text

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

CACHE_DIR = os.getenv("MODEL_CACHE_DIR", "/tmp/hf_cache")

# Load the transformer pipeline
try:
    log.info("Loading DistilBERT from HuggingFace...")
    classifier = pipeline(
        "text-classification",
        model="distilbert-base-uncased-finetuned-sst-2-english",
        cache_dir=CACHE_DIR,
        truncation=True,
        max_length=512
    )
    log.info("DistilBERT loaded.")
    HAS_TRANSFORMER = True
except Exception as e:
    log.warning("Failed to load Transformer model: %s. Falling back to sklearn.", e)
    HAS_TRANSFORMER = False


# ── Load ML artefacts ─────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def _load_pickle(filename: str):
    path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Required file not found: {path}")

    if _JOBLIB_AVAILABLE:
        try:
            obj = joblib.load(path)
            log.info("Loaded %-20s via joblib", filename)
            return obj
        except Exception:
            pass

    with open(path, "rb") as f:
        obj = pickle.load(f)
        log.info("Loaded %-20s via pickle", filename)
        return obj

# ── Load model & vectorizer ───────────────────────────────────────────────
vectorizer    = _load_pickle("vectorizer.pkl")
model         = _load_pickle("model.pkl")
HAS_PROBA     = hasattr(model, "predict_proba")
MODEL_CLASSES = list(model.classes_) if hasattr(model, "classes_") else []

log.info("Model: %s | has_proba: %s | classes: %s",
        type(model).__name__, HAS_PROBA, MODEL_CLASSES)

# ── Label helpers ──────────────────────────────────────────────────────────
# Replace your current _LABEL_MAP with this
# Update your map to match the Colab success message exactly
# Updated to match the ['Negative', 'Neutral', 'Positive'] order from Colab
_LABEL_MAP = {
    "0": "Negative",
    "1": "Neutral",
    "2": "Positive",
    "negative": "Negative",
    "neutral": "Neutral",
    "positive": "Positive"
}

def normalise_label(raw) -> str:
    key = str(raw).strip().lower()
    return _LABEL_MAP.get(key, str(raw).capitalize())


# ── Temperature scaling ───────────────────────────────────────────────────
#
# WHY THIS WORKS:
# Most sklearn models (Naive Bayes, LinearSVC via predict_proba, etc.) output
# over-smoothed probabilities — e.g. 50/30/20 across 3 classes even when the
# correct answer is obvious.  Temperature scaling divides the log-probabilities
# by a scalar T before re-normalising with softmax:
#
#   scaled_prob_i = exp(log_prob_i / T) / sum_j(exp(log_prob_j / T))
#
# T < 1 → sharpens the distribution → higher peak confidence
# T > 1 → flattens the distribution
#
# We LEARN T from representative review samples at startup so nothing is
# hardcoded — the model genuinely drives the confidence number.
#
TEMPERATURE = 1.0  # will be updated by _estimate_temperature() below


def _estimate_temperature() -> float:
    """
    Find the temperature T in [0.2, 1.0] that maximises the average
    probability assigned to the correct class across a representative
    set of film reviews.  Runs once at startup — no extra files needed.
    """
    if not HAS_PROBA:
        return 1.0

    # Representative clearly-labelled film review samples.
    # These are used ONLY to calibrate T — they are never returned to the user.

    calibration_samples = [
        # strongly positive
        ("This is absolutely amazing! I love everything about it.", "Positive"),
        ("Great results and very high quality.", "Positive"),
        # strongly negative
        ("I am not really happy with the results.", "Negative"),
        ("This is the worst experience I have ever had.", "Negative"),
        # neutral (New)
        ("The item arrived on Tuesday as scheduled.", "Neutral"),
        ("It is a standard product that does exactly what it says.", "Neutral"),
        ("The weather in Bangalore is quite clear today.", "Neutral"),
    ]
    label_to_idx = {normalise_label(c): i for i, c in enumerate(MODEL_CLASSES)}

    texts  = [r for r, _ in calibration_samples]
    labels = [l for _, l in calibration_samples]

    X         = vectorizer.transform(texts)
    raw_proba = model.predict_proba(X)   # (n, n_classes)

    best_T    = 1.0
    best_mean = -1.0

    # Grid search over temperatures
    for T in np.arange(0.20, 1.01, 0.05):
        peaks = []
        for i, lbl in enumerate(labels):
            idx = label_to_idx.get(lbl)
            if idx is None:
                continue
            logits     = np.log(raw_proba[i] + 1e-9) / T
            exp_logits = np.exp(logits - logits.max())
            scaled     = exp_logits / exp_logits.sum()
            peaks.append(scaled[idx])

        mean_peak = float(np.mean(peaks)) if peaks else 0.0
        if mean_peak > best_mean:
            best_mean = mean_peak
            best_T    = float(T)

    log.info(
        "Temperature calibration complete → T=%.2f | "
        "avg correct-class confidence=%.1f%%",
        best_T, best_mean * 100,
    )
    return best_T


# Run at startup — fast (pure numpy, no network calls)
TEMPERATURE = _estimate_temperature()


def scale_proba(raw_proba: np.ndarray) -> np.ndarray:
    """Apply temperature scaling to a (1, n_classes) probability array."""
    logits     = np.log(raw_proba + 1e-9) / TEMPERATURE
    exp_logits = np.exp(logits - logits.max(axis=1, keepdims=True))
    return exp_logits / exp_logits.sum(axis=1, keepdims=True)


def get_top_classes(scaled_proba: np.ndarray) -> list:
    classes = MODEL_CLASSES if MODEL_CLASSES else list(range(scaled_proba.shape[1]))
    pairs = [
        {
            "label":       normalise_label(cls),
            "probability": round(float(scaled_proba[0][i]), 4),
        }
        for i, cls in enumerate(classes)
    ]
    return sorted(pairs, key=lambda x: x["probability"], reverse=True)


def get_confidence(top_classes: list, predicted_sentiment: str) -> float:
    """Return probability for the predicted class — no silent 0.5 fallback."""
    for item in top_classes:
        if item["label"] == predicted_sentiment:
            return item["probability"]
    if top_classes:
        log.warning(
            "Label '%s' not found in top_classes %s — using top probability.",
            predicted_sentiment, [c["label"] for c in top_classes],
        )
        return top_classes[0]["probability"]
    return 0.5


# ── Gemini setup ───────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
if not GEMINI_API_KEY:
    raise EnvironmentError("GEMINI_API_KEY is missing from .env")

for var in ["GOOGLE_APPLICATION_CREDENTIALS", "CLOUDSDK_AUTH_ACCESS_TOKEN"]:
    if var in os.environ:
        del os.environ[var]

client = genai.Client(api_key=GEMINI_API_KEY)
log.info("Gemini client ready.")


# ── Gemini call ────────────────────────────────────────────────────────────
def call_gemini(review: str, sentiment: str, confidence: float, top_classes: list) -> str:
    dist_summary = ", ".join(
        [f"{c['label']} ({round(c['probability'] * 100)}%)" for c in top_classes]
    )

    system_instruction = (
        "You are an AI Sentiment Analyst. Your goal is to justify a model's prediction "
        "based on the linguistic patterns of the text. Focus on specific words. "
        "Do not use markdown bolding. Keep it to 2 concise sentences."
    )

    prompt = f"""
Review Content: "{review}"
Prediction: {sentiment}
Confidence: {round(confidence * 100, 1)}%
Class Distribution: {dist_summary}

Task: Justify why the model chose '{sentiment}'.
If confidence is below 60%, highlight the mixed signals in the text.
If confidence is above 75%, briefly explain which specific words or phrases strongly indicate {sentiment}.
"""

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
            config={
                "system_instruction": system_instruction,
                "temperature": 0.5,
                "max_output_tokens": 500,
            },
        )
        text = response.text.strip().replace("**", "").replace("\n", " ")
        return " ".join(text.split())
    except Exception as e:
        log.error("GEMINI CRASHED: %s - %s", type(e).__name__, str(e))
        if "429" in str(e):
            return "Rate limit reached. Please wait a minute before analyzing again."
        return (
            "The sentiment matches the linguistic patterns found in the review, "
            "though a detailed AI breakdown is currently unavailable."
        )


# ── Routes ─────────────────────────────────────────────────────────────────
@app.route("/analyze", methods=["POST"])
def analyze():
    body = request.get_json(silent=True)
    if not body or "review" not in body:
        return jsonify({"error": "No review provided"}), 400

    # --- UPDATE THESE LINES ---
    raw_review = body["review"].strip()
    review = preprocess_negation(raw_review)
    if not review or len(review) > 1500:
        return jsonify({"error": "Review must be between 1 and 1500 characters."}), 400

    try:
        # 1. Prediction logic
        if HAS_TRANSFORMER:
            # Use BERT transformer
            # top_k=None returns all labels sorted by score
            bert_results = classifier(review, top_k=None)
            
            # Map BERT results to our standard format
            top_classes = []
            for res in bert_results:
                label = normalise_label(res['label'])
                score = round(float(res['score']), 4)
                top_classes.append({"label": label, "probability": score})
            
            # Ensure they are sorted by probability
            top_classes = sorted(top_classes, key=lambda x: x["probability"], reverse=True)
            sentiment = top_classes[0]["label"]
            confidence = top_classes[0]["probability"]
            
            log.info("BERT Prediction: %s (%.1f%%)", sentiment, confidence * 100)
        else:
            # Fallback to Sklearn
            X = vectorizer.transform([review])
            raw_label = str(model.predict(X)[0])
            sentiment = normalise_label(raw_label)
            
            confidence  = 0.5
            top_classes = [{"label": sentiment, "probability": 1.0}]

            if HAS_PROBA:
                raw_proba    = model.predict_proba(X)
                scaled_proba = scale_proba(raw_proba)
                top_classes  = get_top_classes(scaled_proba)
                confidence   = get_confidence(top_classes, sentiment)
            
            log.info("Sklearn Prediction: %s (%.1f%%)", sentiment, confidence * 100)

        # 4. Gemini justification
        analysis = call_gemini(review, sentiment, confidence, top_classes)

        return jsonify({
            "sentiment":   sentiment,
            "confidence":  confidence,
            "top_classes": top_classes,
            "analysis":    analysis,
        })

    except Exception:
        log.error(traceback.format_exc())
        return jsonify({"error": "Analysis failed"}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":      "healthy",
        "model":       type(model).__name__,
        "has_proba":   HAS_PROBA,
        "classes":     [normalise_label(c) for c in MODEL_CLASSES],
        "temperature": round(TEMPERATURE, 3),
    })


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)