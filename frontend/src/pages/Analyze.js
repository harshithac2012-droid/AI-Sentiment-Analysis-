import React from "react";
import { motion } from "framer-motion";
import ReviewForm from "../components/ReviewForm";

const Analyze = () => {
  return (
    <motion.div 
      className="page-analyze"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className="app-header">
        <div className="logo-mark">✦</div>
        <h1 className="app-title">CineRead</h1>
        <p className="app-subtitle">
          Paste any Phrase and let our model decode the emotion behind every word.
        </p>
      </header>

      <ReviewForm />
    </motion.div>
  );
};

export default Analyze;
