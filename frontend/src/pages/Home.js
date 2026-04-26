import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Brain, Search, MessageSquare, ArrowRight } from "lucide-react";

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const features = [
    {
      icon: <Search className="feat-icon" />,
      title: "Deep Analysis",
      description: "Our ML model goes beyond keywords to understand the nuances of cinematic critique.",
    },
    {
      icon: <Brain className="feat-icon" />,
      title: "AI Justification",
      description: "Powered by Gemini AI to provide context and linguistic reasoning for every prediction.",
    },
    {
      icon: <MessageSquare className="feat-icon" />,
      title: "Instant Results",
      description: "Get immediate sentiment scores and detailed breakdowns of your movie reviews.",
    },
  ];

  return (
    <motion.div 
      className="page-home"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <section className="hero-section">
        <motion.div variants={itemVariants} className="hero-content">
          <span className="hero-badge">AI-Powered Sentiment Analysis</span>
          <h1 className="hero-title">
            Decode the <span className="text-gradient">Soul</span> of Sentiments
          </h1>
          <p className="hero-subtitle">
            Leverage state of the art machine learning to understand the emotional depth 
            behind every sentence. Professional grade analysis at your fingertips.
          </p>
          <div className="hero-btns">
            <Link to="/analyze" className="btn-primary">
              Start Analyzing <ArrowRight size={18} />
            </Link>
            <Link to="/how-it-works" className="btn-secondary">
              Learn More
            </Link>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="hero-visual">
          <div className="visual-card">
            <div className="visual-header">
              <div className="dot red"></div>
              <div className="dot yellow"></div>
              <div className="dot green"></div>
            </div>
            <div className="visual-body">
              <div className="skeleton-line long"></div>
              <div className="skeleton-line mid"></div>
              <div className="skeleton-line short"></div>
              <div className="analysis-indicator">
                <div className="pulse-ring"></div>
                <span>Analyzing...</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="features-section">
        <motion.h2 variants={itemVariants} className="section-title">Why CineRead?</motion.h2>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx} 
              className="feature-card"
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="icon-wrapper">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default Home;
