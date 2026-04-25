import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Analyze from "./pages/Analyze";
import "./App.css";

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/about" element={<About />} />
        <Route path="/analyze" element={<Analyze />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <div className="app-root">
        {/* film-grain overlay */}
        <div className="grain" aria-hidden="true" />

        {/* subtle background blobs */}
        <div className="blob blob-1" aria-hidden="true" />
        <div className="blob blob-2" aria-hidden="true" />

        <Navbar />

        <main className="app-main">
          <AnimatedRoutes />

          <footer className="app-footer">
            Powered by a trained ML classifier &amp; Gemini AI analysis
          </footer>
        </main>
      </div>
    </Router>
  );
}