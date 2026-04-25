import React, { useState, useRef, useEffect } from "react";
import { analyzeSentiment } from "../api";

function ConfidenceBar({ value }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value * 100), 80);
    return () => clearTimeout(t);
  }, [value]);

  const pct = Math.round(value * 100);
  const hue = value > 0.7 ? 142 : value > 0.45 ? 38 : 0;
  return (
    <div style={{ marginTop: "1.1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.72rem",
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#6b7280",
          marginBottom: "0.45rem",
        }}
      >
        <span>Confidence Score</span>
        <span style={{ color: `hsl(${hue},65%,40%)` }}>{pct}%</span>
      </div>
      <div
        style={{
          height: "6px",
          background: "#e5e7eb",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            background: `linear-gradient(90deg, hsl(${hue},60%,55%), hsl(${hue},70%,42%))`,
            borderRadius: "999px",
            transition: "width 0.85s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "18px",
        height: "18px",
        border: "2.5px solid rgba(255,255,255,0.35)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
        verticalAlign: "middle",
        marginRight: "8px",
      }}
    />
  );
}

export default function ReviewForm() {
  /*
  const EXAMPLES = [
    "An absolute masterpiece! The cinematography is breathtaking and the performances are career-best.",
    "A complete waste of time. The plot is incoherent and the acting is wooden throughout.",
    "A decent film with some interesting moments, though it drags in the second act.",
    "Nolan has done it again — mind-bending, emotional, and technically flawless.",
    "Predictable from start to finish. Nothing we haven't seen a hundred times before.",
  ];
  */

  const SENTIMENT_CONFIG = {
    Positive: {
      color: "#1a7a4a",
      bg: "#edfaf3",
      border: "#a7e9c4",
      dot: "#22c55e",
      icon: "✦",
      label: "Positive",
    },
    Negative: {
      color: "#b91c1c",
      bg: "#fff1f1",
      border: "#fca5a5",
      dot: "#ef4444",
      icon: "✦",
      label: "Negative",
    },
    Neutral: {
      color: "#1e40af",
      bg: "#eff6ff",
      border: "#bfdbfe",
      dot: "#60a5fa",
      icon: "✦",
      label: "Neutral",
    },
  };

  const [review, setReview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const resultRef = useRef(null);

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!review.trim()) {
      setError("Please enter a movie review before analyzing.");
      return;
    }
    setError("");
    setResult(null);
    analyzeDirectly(review);
  }

  function useExample(text) {
    setReview(text);
    setResult(null);
    setError("");
    // We can trigger analysis immediately after setting review
    // but review state update is async. So we'll pass text directly to handleSubmit
    // Or just let the user click Analyze. Let's make it automatic for better UX.
    analyzeDirectly(text);
  }

  async function analyzeDirectly(text) {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const data = await analyzeSentiment(text.trim());
      setResult(data);
      setTimeout(
        () => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
        100
      );
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const cfg = result ? SENTIMENT_CONFIG[result.sentiment] || SENTIMENT_CONFIG.Neutral : null;
  const charCount = review.length;

  return (
    <div className="form-wrapper">
      <form onSubmit={handleSubmit} style={{ display: "contents" }}>
        {/* ── textarea ── */}
        <div
          className={`textarea-shell ${focused ? "focused" : ""} ${error ? "has-error" : ""}`}
        >
          <textarea
            value={review}
            onChange={(e) => {
              setReview(e.target.value);
              if (error) setError("");
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={`Write your movie review here…\ne.g. "A visually stunning epic that redefines the genre."`}
            rows={5}
            maxLength={1500}
            aria-label="Movie review input"
          />
          <div className="char-count">{charCount} / 1500</div>
        </div>

        {error && (
          <div className="error-msg" role="alert">
            <span className="error-icon">⚠</span> {error}
          </div>
        )}

        {/* ── submit ── */}
        <button
          type="submit"
          className="analyze-btn"
          disabled={loading}
          aria-busy={loading}
        >
          {loading && <Spinner />}
          {loading ? "Analyzing…" : "Analyze Sentiment"}
        </button>
      </form>

      {/* ── examples ──
      <div className="examples-section">
        <p className="examples-label">Quick examples</p>
        <div className="examples-grid">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              className="example-chip"
              onClick={() => useExample(ex)}
            >
              {ex.length > 52 ? ex.slice(0, 52) + "…" : ex}
            </button>
          ))}
        </div>
      </div>
      ── */}

      {/* ── result card ── */}
      {result && cfg && (
        <div ref={resultRef} className="result-card fade-in" style={{ borderColor: cfg.border }}>
          {/* badge */}
          <div className="result-badge" style={{ background: cfg.bg, color: cfg.color }}>
            <span
              className="badge-dot"
              style={{ background: cfg.dot, boxShadow: `0 0 0 4px ${cfg.border}` }}
            />
            <span className="badge-label">{cfg.label}</span>
          </div>

          {/* confidence bar */}
          {typeof result.confidence === "number" && (
            <ConfidenceBar value={result.confidence} />
          )}

          {/* gemini analysis */}
          {result.analysis && (
            <div className="gemini-section">
              <div className="gemini-header">
                <span className="gemini-icon">✦</span>
                <span className="gemini-title">AI Analysis</span>
                <span className="gemini-badge">Gemini</span>
              </div>
              <p className="gemini-body">{result.analysis}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}