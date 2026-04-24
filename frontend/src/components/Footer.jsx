import { Link } from "react-router-dom";
import "../styles/Footer.css"; 

export default function Footer() {
  return (
    <footer className="hyper-footer">
      {/* Animated top border */}
      <div className="footer-glow-bar"></div>
      
      {/* Sci-Fi Background Grid */}
      <div className="footer-bg-grid"></div>
      
      <div className="footer-container">
        <div className="footer-grid">
          
          {/* Column 1: Brand & Bio */}
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <div className="brand-icon-box small-icon">
                <div className="orbiting-swoosh"></div>
                <span className="star-dot top-star pulsing-star"></span>
                <span className="star-dot bottom-star pulsing-star-alt"></span>
              </div>
              <span className="brand-text">HyperLife <span className="os-gradient">OS</span></span>
            </div>
            <p className="footer-desc">
              Organize your reality. Visualize your growth. Master the system.
            </p>
          </div>

          {/* Column 2: System Navigation */}
          <div className="footer-col">
            <h4 className="footer-heading">Navigation</h4>
            <div className="link-group">
              <Link to="/" className="footer-link">Nexus Home</Link>
              <Link to="/dashboard" className="footer-link">Operator Dashboard</Link>
              {/* 🚀 ADDED: Pricing Link */}
              <Link to="/pricing" className="footer-link">System Pricing</Link>
            </div>
          </div>

          {/* Column 3: Authentication Portal */}
          <div className="footer-col">
            <h4 className="footer-heading">Access Portals</h4>
            <div className="link-group">
              <Link to="/login" className="footer-link">System Login</Link>
              <Link to="/register" className="footer-link">Initialize Account</Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="copyright">
            &copy; {new Date().getFullYear()} HyperLife OS. All Systems Intact.
          </p>
          
          {/* Animated Radar Status */}
          <div className="system-status">
            <div className="status-radar">
                <span className="status-dot"></span>
                <span className="status-ping"></span>
            </div>
            <span className="status-text">Matrix Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}