import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Background Ambient Glow Waves */}
      <div className="ambient-wave wave-blue"></div>
      <div className="ambient-wave wave-purple"></div>
      <div className="ambient-wave wave-orange"></div>

      <section className="hyperlife-hero">
        
        {/* Upper Typography */}
        <div className="hero-headers animate-entrance delay-1">
          <h1 className="hero-title">Your Life. Visualized.</h1>
          <p className="hero-subtitle">
            HyperLife OS: The intelligent platform to organize your universe.
          </p>
        </div>

        {/* Central Visualization (True 3D Orbit System) - NOW CLICKABLE */}
        <div 
          className="universe-visual animate-entrance delay-2" 
          onClick={() => navigate("/login")}
          title="Enter Your Universe"
        >
          
          {/* Central Ethereal Human */}
          <div className="human-core floating">
            <svg viewBox="0 0 100 220" className="human-silhouette">
              <defs>
                <filter id="hologram-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="body-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(210, 240, 255, 1)" />
                  <stop offset="50%" stopColor="rgba(100, 200, 255, 0.6)" />
                  <stop offset="100%" stopColor="rgba(0, 150, 255, 0.1)" />
                </linearGradient>
              </defs>
              <g filter="url(#hologram-glow)" fill="url(#body-gradient)">
                <circle cx="50" cy="20" r="14" />
                <path d="M50 38 C75 38 85 50 88 80 C90 95 85 120 82 125 C80 128 75 125 76 115 C78 95 72 65 50 65 C28 65 22 95 24 115 C25 125 20 128 18 125 C15 120 10 95 12 80 C15 50 25 38 50 38 Z" />
                <path d="M36 65 L36 125 C36 125 28 190 30 210 L40 210 C40 190 46 140 50 140 C54 140 60 190 60 210 L70 210 C72 190 64 125 64 125 L64 65 Z" />
              </g>
            </svg>
          </div>

          {/* 🌍 ORBIT SYSTEM 1: Health */}
          <div className="orbit-system system-1">
            <div className="orbit-ring"></div>
            <div className="planet-container">
              <div className="planet-node">
                <div className="hud-line hud-left"></div>
                <span className="hud-label hud-left-text">Health</span>
                <div className="planet p-health pulse-glow"></div>
              </div>
            </div>
          </div>

          {/* 🌍 ORBIT SYSTEM 2: Finance (Spins backward) */}
          <div className="orbit-system system-2">
            <div className="orbit-ring"></div>
            <div className="planet-container">
              <div className="planet-node">
                <span className="hud-label hud-right-text">Finance</span>
                <div className="hud-line hud-right"></div>
                <div className="planet p-finance pulse-glow"></div>
              </div>
            </div>
          </div>

          {/* 🌍 ORBIT SYSTEM 3: Knowledge */}
          <div className="orbit-system system-3">
            <div className="orbit-ring"></div>
            <div className="planet-container">
              <div className="planet-node">
                <div className="hud-line hud-left"></div>
                <span className="hud-label hud-left-text">Knowledge</span>
                <div className="planet p-knowledge pulse-glow">
                  <div className="planet-ring spin-3d"></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Lower Typography */}
        <p className="hero-subtitle subtitle-lower animate-entrance delay-3">
          HyperLife OS: The intelligent platform to organize your universe.
        </p>

        {/* Neon Action Buttons */}
        <div className="hero-actions animate-entrance delay-4">
          <button 
            className="neon-btn btn-blue pulse-btn" 
            onClick={() => navigate("/register")}
          >
            <span className="sparkle">✦</span>
            Get Started
            <span className="sparkle">✦</span>
          </button>
          
          <button 
            className="neon-btn btn-purple pulse-btn" 
            onClick={() => navigate("/login")}
          >
            <span className="sparkle">✦</span>
            See Your Universe
            <span className="sparkle">✦</span>
          </button>
        </div>

      </section>
    </div>
  );
}