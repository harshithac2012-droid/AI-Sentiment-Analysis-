import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  
  const navItems = [
    { name: "Home", path: "/" },
    { name: "How It Works", path: "/how-it-works" },
    { name: "About", path: "/about" },
    { name: "Analyze", path: "/analyze" },
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <Sparkles size={20} className="logo-icon" />
          <span className="logo-text">CineRead</span>
        </Link>
        
        <div className="nav-links">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
            >
              {item.name}
              {location.pathname === item.path && (
                <motion.div 
                  layoutId="nav-underline"
                  className="nav-underline"
                  initial={false}
                />
              )}
            </Link>
          ))}
        </div>
        
        <Link to="/analyze" className="nav-cta">
          Get Started
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
