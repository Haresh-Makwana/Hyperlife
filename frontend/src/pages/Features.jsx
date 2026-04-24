import { useNavigate } from "react-router-dom";
import "../styles/Features.css";

export default function Features() {
  const navigate = useNavigate();

  return (
    <div className="features-container">
      
      {/* 🌌 Deep Space & Grid Background */}
      <div className="feat-bg-wrapper">
        <div className="feat-bg-grid"></div>
        <div className="feat-ambient-glow feat-glow-cyan"></div>
        <div className="feat-ambient-glow feat-glow-purple"></div>
        <div className="feat-stardust"></div>
        <div className="feat-light-sweep"></div>
      </div>

      <div className="features-content">
        
        {/* 🛸 Header Section */}
        <section className="features-header feat-entrance feat-delay-1">
          <div className="tagline-pill glow-pill">
            <span className="sparkle">⚡</span> System Capabilities
          </div>
          <h1 className="features-title">
            Architect Your <br />
            <span className="text-gradient-animated">Optimal Reality.</span>
          </h1>
          <p className="features-subtitle">
            HyperLife OS is equipped with advanced tracking, deep analytics, and 
            gamified progression to elevate your daily routine into a cosmic journey.
          </p>
        </section>

        {/* 📊 Stats Row */}
        <section className="stats-row feat-entrance feat-delay-2">
          <div className="stat-item">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">2.4M</div>
            <div className="stat-label">Habits Tracked</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Uptime</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">4.9★</div>
            <div className="stat-label">User Rating</div>
          </div>
        </section>

        {/* 🍱 Premium Bento Box Grid */}
        <section className="bento-grid">
          
          {/* Feature 1: The Universe (Large Card) */}
          <div className="bento-card card-large feat-entrance feat-delay-2 group-hover">
            <div className="card-glare"></div>
            <div className="card-bg-glow purple-glow"></div>
            <div className="card-label">Core System</div>
            
            <div className="card-visual visual-universe">
              <div className="wireframe-planet">
                <div className="wire-ring rx"></div>
                <div className="wire-ring ry"></div>
                <div className="wire-ring rz"></div>
                <div className="core-star feat-pulse-supernova"></div>
                
                <div className="orbit-path path-1">
                  <div className="orbiting-moon moon-cyan"></div>
                </div>
                <div className="orbit-path path-2">
                  <div className="orbiting-moon moon-purple"></div>
                </div>
                <div className="orbit-path path-3">
                  <div className="orbiting-moon moon-orange"></div>
                </div>
              </div>
            </div>

            <div className="card-text">
              <h3>Interactive 3D Universe</h3>
              <p>Watch your life domains—Health, Wealth, and Knowledge—orbit as living planets. Their size and glow adapt in real-time to your consistency and discipline.</p>
            </div>
          </div>

          {/* Feature 2: Gamification (Square Card) */}
          <div className="bento-card card-square feat-entrance feat-delay-3 group-hover">
            <div className="card-glare"></div>
            <div className="card-bg-glow cyan-glow"></div>
            <div className="card-label">Progression</div>

            <div className="card-visual visual-gamify">
              <div className="holographic-display">
                <div className="level-badge feat-floating-dynamic">
                  <div className="badge-glass">
                    <span className="lvl-text">RANK</span>
                    <span className="lvl-num">42</span>
                  </div>
                </div>
                <div className="xp-container">
                  <span className="xp-label">SYNCING XP...</span>
                  <div className="mini-xp-bar">
                    <div className="mini-xp-fill animated-fill">
                      <div className="xp-spark"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-text">
              <h3>Gamified Engine</h3>
              <p>Every habit completed grants XP. Level up your profile and unlock new aesthetic cosmic tiers.</p>
            </div>
          </div>

          {/* Feature 3: Deep Analytics (Square Card) */}
          <div className="bento-card card-square feat-entrance feat-delay-4 group-hover">
            <div className="card-glare"></div>
            <div className="card-label">Intelligence</div>
            
            <div className="card-visual visual-analytics">
              <div className="radar-container">
                <div className="radar-grid"></div>
                <div className="radar-ring radar-ring-1"></div>
                <div className="radar-ring radar-ring-2"></div>
                <div className="radar-sweep"></div>
                <div className="data-point dp-1"></div>
                <div className="data-point dp-2"></div>
                <div className="data-point dp-3"></div>
                <div className="data-point dp-4"></div>
                <svg className="neural-line-svg" viewBox="0 0 100 100">
                  <polyline points="20,70 40,40 60,60 80,30" className="animated-polyline" />
                </svg>
              </div>
            </div>

            <div className="card-text">
              <h3>Neural Analytics</h3>
              <p>Track mood and energy patterns. Our AI cross-references data to find your peak performance windows.</p>
            </div>
          </div>

          {/* Feature 4: Secure Data (Wide Card) */}
          <div className="bento-card card-wide feat-entrance feat-delay-5 group-hover">
            <div className="card-glare"></div>
            <div className="card-bg-glow orange-glow"></div>
            <div className="card-label">Security</div>
            
            <div className="card-visual wide-visual">
              <div className="server-rack-container">
                <div className="server-node sn-1">
                  <div className="blinking-light"></div>
                </div>
                <div className="data-bridge db-1">
                  <div className="data-packet packet-fast"></div>
                </div>
                <div className="server-node sn-2 main-node">
                  <div className="core-lock">🔒</div>
                </div>
                <div className="data-bridge db-2">
                  <div className="data-packet packet-slow"></div>
                  <div className="data-packet packet-fast delay-packet"></div>
                </div>
                <div className="server-node sn-3">
                  <div className="blinking-light"></div>
                </div>
              </div>
            </div>

            <div className="card-text wide-text">
              <h3>Encrypted Vault & Exports</h3>
              <p>Your data belongs to you. Export your entire system history instantly via CSV or generate high-fidelity PDF reports of your command center.</p>
            </div>
          </div>

        </section>

        {/* 🚀 CTA Section */}
        <section className="features-cta feat-entrance feat-delay-6">
          <button className="feat-btn-premium" onClick={() => navigate("/pricing")}>
            <span className="btn-bg-sweep"></span>
            <span className="btn-text">Deploy Your System Now</span>
          </button>
        </section>

      </div>
    </div>
  );
}
