import React from "react";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
const About = () => {
  return (
    <motion.div 
      className="page-about"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <section className="about-hero">
        <h1 className="page-title">About CineRead</h1>
        <p className="about-lead">
          We believe that every phrase tells a story. Our mission is to provide the tools 
          to decode those stories using the power of Artificial Intelligence.
        </p>
      </section>

      <div className="about-grid">
        <div className="about-card main">
          <h2>Our Vision</h2>
          <p>
            CineRead was born out of a passion for both Emotions and technology. 
            By combining deep learning models with large language models, we've 
            created a platform that doesn't just categorize text, but understands it.
          </p>
        </div>

        <div className="about-card">
          <h2>The Technology</h2>
          <p>
            Our core classifier is built on top of state of the art transformer 
            architectures, fine tuned on thousands of Statement. For linguistic 
            nuance, we integrate Gemini AI to provide deeper insights.
          </p>
        </div>
      </div>

      <section className="about-team">
        <h2>Connect With Us</h2>
        <div className="social-links">
          <a href="#" className="social-link"><FaGithub size={20} /> GitHub</a>
          <a href="#" className="social-link"><FaLinkedin size={20} /> LinkedIn</a>
          <a href="#" className="social-link"><Globe size={20} /> Website</a>
        </div>
      </section>
    </motion.div>
  );
};

export default About;
