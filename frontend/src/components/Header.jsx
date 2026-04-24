import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getToken, removeToken } from "../utils/auth";
import "../styles/Header.css"; 

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = getToken();
  
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Shrinks and darkens the header when scrolling down
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    removeToken();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      {/* 🚀 INJECTED CSS FOR RESPONSIVE GLASSMORPHISM */}
      <style>{`
        .hyper-header {
          position: fixed; top: 0; left: 0; width: 100%; z-index: 1000;
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 40px; transition: all 0.3s ease-in-out;
          background: rgba(3, 4, 7, 0.4); backdrop-filter: blur(8px);
          border-bottom: 1px solid transparent;
          box-sizing: border-box;
        }
        .hyper-header.header-scrolled {
          padding: 12px 40px;
          background: rgba(10, 13, 20, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(0, 255, 231, 0.15);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .header-brand { display: flex; align-items: center; gap: 12px; }
        .brand-logo-mark {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, #00ffe7, #a855f7);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 15px rgba(0, 255, 231, 0.4);
        }
        .inner-core { width: 12px; height: 12px; background: #030407; border-radius: 50%; }
        .brand-text { font-size: 1.4rem; font-weight: 800; color: #fff; letter-spacing: 0.5px; }
        
        .header-nav { display: flex; align-items: center; gap: 15px; }
        .nav-link {
          color: #94a3b8; text-decoration: none; font-weight: 600; font-size: 0.95rem;
          padding: 8px 16px; border-radius: 8px; transition: all 0.2s ease;
        }
        .nav-link:hover { color: #fff; background: rgba(255, 255, 255, 0.05); }
        .nav-link.active {
          color: #00ffe7; background: rgba(0, 255, 231, 0.1);
          border: 1px solid rgba(0, 255, 231, 0.3); text-shadow: 0 0 8px rgba(0, 255, 231, 0.4);
        }
        
        .nav-divider { width: 1px; height: 24px; background: rgba(255, 255, 255, 0.1); margin: 0 5px; }
        
        .nav-btn-danger, .nav-btn-primary {
          padding: 8px 20px; border-radius: 8px; font-weight: 700; cursor: pointer;
          transition: all 0.2s ease; border: none; outline: none; font-size: 0.95rem;
        }
        .nav-btn-danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        .nav-btn-danger:hover { background: rgba(239, 68, 68, 0.2); box-shadow: 0 0 15px rgba(239, 68, 68, 0.3); }
        .nav-btn-primary { background: #00ffe7; color: #000; box-shadow: 0 0 15px rgba(0, 255, 231, 0.3); }
        .nav-btn-primary:hover { transform: scale(1.05); box-shadow: 0 0 25px rgba(0, 255, 231, 0.5); }

        .hamburger-btn {
          display: none; background: transparent; border: none; color: #fff;
          font-size: 1.8rem; cursor: pointer; outline: none; padding: 5px;
        }

        .header-glow-bar {
          position: absolute; bottom: 0; left: 0; width: 100%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,255,231,0.5), rgba(168,85,247,0.5), transparent);
          opacity: ${scrolled ? 1 : 0}; transition: opacity 0.3s ease;
        }

        /* 📱 MOBILE RESPONSIVENESS */
        @media (max-width: 1024px) {
          .hamburger-btn { display: block; }
          .header-nav {
            position: absolute; top: 100%; left: 0; width: 100%;
            background: rgba(10, 13, 20, 0.95); backdrop-filter: blur(16px);
            flex-direction: column; align-items: stretch; padding: 20px; gap: 10px;
            border-bottom: 1px solid rgba(0, 255, 231, 0.2);
            clip-path: polygon(0 0, 100% 0, 100% 0, 0 0); /* Hidden by default via clip-path */
            transition: clip-path 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            visibility: hidden;
          }
          .header-nav.mobile-open {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
            visibility: visible;
          }
          .nav-divider { width: 100%; height: 1px; margin: 10px 0; }
          .nav-link { text-align: left; padding: 12px 16px; }
          .nav-btn-danger, .nav-btn-primary { width: 100%; padding: 12px; }
          .hyper-header { padding: 15px 20px; }
          .hyper-header.header-scrolled { padding: 10px 20px; }
        }
      `}</style>

      <header className={`hyper-header ${scrolled ? "header-scrolled" : ""}`}>
        
        {/* 🚀 Sleek Brand Logo */}
        <div className="header-brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <div className="brand-logo-mark">
            <div className="inner-core"></div>
          </div>
          <span className="brand-text">HyperLife</span>
        </div>

        {/* 🍔 Mobile Hamburger Button */}
        <button className="hamburger-btn" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
        
        {/* 🌌 Premium Pill Navigation */}
        <nav className={`header-nav ${mobileMenuOpen ? "mobile-open" : ""}`}>
          {token ? (
            <>
              {/* 🔥 AUTHENTICATED LINKS */}
              <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
              <Link to="/habits" className={`nav-link ${location.pathname === '/habits' ? 'active' : ''}`}>Habits</Link>
              <Link to="/universe-3d" className={`nav-link ${location.pathname === '/universe-3d' ? 'active' : ''}`}>3D Visualizer</Link>
              <Link to="/arsenal" className={`nav-link ${location.pathname === '/arsenal' ? 'active' : ''}`}>Inventory</Link>
              <Link to="/neural-grid" className={`nav-link ${location.pathname === '/neural-grid' ? 'active' : ''}`}>Analytics</Link>
              <Link to="/colosseum" className={`nav-link ${location.pathname === '/colosseum' ? 'active' : ''}`}>Challenges</Link>
              <Link to="/captains-log" className={`nav-link ${location.pathname === '/captains-log' ? 'active' : ''}`}>Journal</Link>
              
              <div className="nav-divider"></div>
              <button className="nav-btn-danger" onClick={handleLogout}>Log Out</button>
            </>
          ) : (
            <>
              {/* 🔥 UNAUTHENTICATED LINKS */}
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
              <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>About</Link>
              <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>Contact</Link>
              <Link to="/features" className={`nav-link ${location.pathname === '/features' ? 'active' : ''}`}>Features</Link>
              <Link to="/pricing" className={`nav-link ${location.pathname === '/pricing' ? 'active' : ''}`}>Pricing</Link>
              
              <div className="nav-divider"></div>
              <button className="nav-btn-primary" onClick={() => { setMobileMenuOpen(false); navigate("/login"); }}>
                Log In
              </button>
            </>
          )}
        </nav>

        {/* The glowing laser line at the bottom of the header */}
        <div className="header-glow-bar"></div>
      </header>
    </>
  );
}