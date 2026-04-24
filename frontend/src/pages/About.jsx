import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/About.css";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="about-container">
      {/* Ambient Background Glows */}
      <div className="ambient-glow glow-top-right"></div>
      <div className="ambient-glow glow-bottom-left"></div>

      <div className="about-content">
        
        {/* Hero Section */}
        <section className="about-hero animate-entrance delay-1">
          <div className="tagline-pill">
            <span className="sparkle">⚡</span> System Initialization
          </div>
          <h1 className="about-title">
            Decoding the <br />
            <span className="text-gradient">Human Algorithm.</span>
          </h1>
          <p className="about-subtitle">
            HyperLife OS wasn't just built to track habits. It was forged to bring 
            order to chaos, turning the abstract concept of personal growth into a 
            living, breathing digital universe.
          </p>
        </section>

        {/* The Mission / Philosophy Section */}
        <section className="about-philosophy animate-entrance delay-2">
          <div className="philosophy-glass-card floating-slow">
            <div className="card-glow-accent"></div>
            <h2>The Core Philosophy</h2>
            <p>
              We believe that you cannot master what you cannot see. Standard to-do lists 
              fail because they lack gravity. By visualizing your Health, Finances, and 
              Knowledge as orbiting celestial bodies, HyperLife OS connects your daily 
              actions to a grander cosmic scale. 
            </p>
            <p className="highlight-text">
              Master the system. Visualize your growth. Expand your universe.
            </p>
          </div>
        </section>

        {/* Core Pillars (3D Glass Grid) */}
        <section className="about-pillars animate-entrance delay-3">
          <h3 className="section-heading">System Pillars</h3>
          
          <div className="pillars-grid">
            {/* Pillar 1 */}
            <div className="pillar-card floating-fast">
              <div className="pillar-icon icon-cyan">🌍</div>
              <h4>Absolute Clarity</h4>
              <p>Strip away the noise. See exactly where your energy is flowing in real-time through intuitive planetary orbits.</p>
            </div>

            {/* Pillar 2 */}
            <div className="pillar-card floating-med">
              <div className="pillar-icon icon-purple">🌌</div>
              <h4>Gamified Evolution</h4>
              <p>Every completed habit generates XP. Level up your universe, unlock new cosmic tiers, and make discipline addictive.</p>
            </div>

            {/* Pillar 3 */}
            <div className="pillar-card floating-slow">
              <div className="pillar-icon icon-orange">⚔️</div>
              <h4>Relentless Growth</h4>
              <p>Designed for those who demand more from themselves. Build a dark, focused, and mysterious aura of undeniable progress.</p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="about-cta animate-entrance delay-4">
          <h2>Ready to Architect Your Reality?</h2>
          <button 
            className="btn-primary pulse-btn mt-4" 
            onClick={() => navigate("/register")}
          >
            Initialize Your Universe
          </button>
        </section>

      </div>
    </div>
  );
}