import React from "react";
import { motion } from "framer-motion";
import { Terminal, Cpu, FileText, CheckCircle } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: <FileText size={24} />,
      title: "Input Review",
      description: "Paste a movie review or critique into our secure analysis engine.",
    },
    {
      icon: <Terminal size={24} />,
      title: "NLP Processing",
      description: "Our preprocessing pipeline cleans and tokenizes the text for optimal machine understanding.",
    },
    {
      icon: <Cpu size={24} />,
      title: "ML Classification",
      description: "A trained transformer model predicts the core sentiment with high precision.",
    },
    {
      icon: <CheckCircle size={24} />,
      title: "AI Explanation",
      description: "Gemini AI generates a human-readable justification for the model's decision.",
    },
  ];

  return (
    <motion.div 
      className="page-how"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <header className="page-header">
        <h1 className="page-title">How It Works</h1>
        <p className="page-subtitle">The science behind the sentiment.</p>
      </header>

      <div className="steps-timeline">
        {steps.map((step, idx) => (
          <motion.div 
            key={idx} 
            className="step-item"
            initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: idx * 0.1 }}
          >
            <div className="step-number">{idx + 1}</div>
            <div className="step-content">
              <div className="step-icon-box">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <section className="tech-stack">
        <h3>Built with cutting-edge tech</h3>
        <div className="tech-logos">
          <span>React</span>
          <span>FastAPI</span>
          <span>PyTorch</span>
          <span>Google Gemini</span>
        </div>
      </section>
    </motion.div>
  );
};

export default HowItWorks;
