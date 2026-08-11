import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { setToken } from "../utils/auth";
import "../styles/Auth.css"; 

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation(); 

  const [isLogin, setIsLogin] = useState(location.pathname !== "/register");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [message, setMessage] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // HANDLE URL REDIRECTS (From Google or Email Verification)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");
    const urlRole = params.get("role");
    const urlError = params.get("error");
    const urlVerified = params.get("verified");

    if (urlToken) {
      const cleanToken = decodeURIComponent(urlToken).replace(/['"]+/g, '').trim();
      setToken(cleanToken);
      localStorage.setItem("user_role", urlRole || "user");
      
      window.history.replaceState(null, "", "/login"); 
      navigate(String(urlRole).trim().toLowerCase() === "admin" ? "/admin" : "/dashboard", { replace: true });
    }

    if (urlVerified) {
      setSuccessMsg("System Uplink Verified. You may now access the console.");
      window.history.replaceState(null, "", "/login"); 
    }

    if (urlError) {
      setMessage("OAuth Handshake Failed. Please try again.");
      window.history.replaceState(null, "", "/login"); 
    }
  }, [location.search, navigate]);

  useEffect(() => {
    setIsLogin(location.pathname !== "/register");
    setMessage(""); 
    setSuccessMsg("");
  }, [location.pathname]);

  // HANDLE GOOGLE SSO CLICK
  const handleGoogleLogin = async () => {
    try {
      const res = await fetch("https://hyperlife-backend.onrender.com/api/auth/google/url");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setMessage("Failed to establish secure link with Google.");
    }
  };

  // HANDLE STANDARD LOGIN/REGISTER
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSuccessMsg("");
    setIsSubmitting(true);

    const endpoint = isLogin ? "https://hyperlife-backend.onrender.com/api/login" : "https://hyperlife-backend.onrender.com/api/register";
    
    const payload = isLogin 
      ? { email, password } 
      : { 
          name, 
          email, 
          password, 
          password_confirmation: password, 
          role: adminCode ? "admin" : "operator", 
          admin_code: adminCode 
        };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
            setMessage("ACCESS DENIED: Email not verified. Please check your inbox.");
        } else {
            setMessage(data.message || (isLogin ? "Invalid credentials" : "Registration failed"));
        }
        setIsSubmitting(false);
        return;
      }

      if (!isLogin) {
          setSuccessMsg(data.message || "Initialization complete. Check your email to verify your identity.");
          setName(""); setEmail(""); setPassword(""); setAdminCode("");
          setIsSubmitting(false);
          return; 
      }

      if (!data.token) {
          setMessage("System Error: No authorization token received from matrix.");
          setIsSubmitting(false);
          return;
      }

      setToken(data.token);
      const userRole = data?.user?.role || 'operator';
      localStorage.setItem('user_role', userRole);

      if (String(userRole).trim().toLowerCase() === 'admin') {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
      
    } catch (error) {
      setMessage("Server error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAuthMode = () => {
    navigate(isLogin ? "/register" : "/login");
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-ambient-glow"></div>

      <div className="auth-content-split">
        
        {/* Left Branding Column */}
        <aside className="auth-left animate-drop">
          <h1 className="auth-logo">
            <span className="logo-icon">🌌</span> HyperLife <span className="highlight-cyan">OS</span>
          </h1>
          <p className="auth-brand-tagline">Architect your reality. Synchronize mind, body, and universe.</p>
        </aside>

        {/* Right Form Card Column */}
        <section className="auth-right animate-rise">
          <div className="auth-glass-card">
            <h2 className="auth-title">
              {isLogin ? "Welcome Back, Operator." : "Initialize Your Universe."}
            </h2>

            <button type="button" className="google-sso-btn" onClick={handleGoogleLogin}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="google-icon">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              Continue with Google
            </button>

            <div className="auth-divider">
              <span>OR PROCEED MANUALLY</span>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="input-group">
                  <label>OPERATOR_NAME</label>
                  <input 
                    type="text" 
                    className="cryptic-input"
                    placeholder="Full Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
              )}

              <div className="input-group">
                <label>COMMS_ADDRESS</label>
                <input 
                  type="email" 
                  className="cryptic-input"
                  placeholder="Email Address" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>

              <div className="input-group">
                <label>DECRYPTION_KEY</label>
                <input 
                  type="password" 
                  className="cryptic-input"
                  placeholder="Password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>

              {!isLogin && (
                <div className="input-group override-group">
                  <label style={{ color: '#ef4444' }}>SYSTEM OVERRIDE KEY (OPTIONAL)</label>
                  <input 
                    type="password" 
                    className="cryptic-input"
                    placeholder="Admin Code..." 
                    value={adminCode} 
                    onChange={(e) => setAdminCode(e.target.value)} 
                    style={{ borderColor: adminCode ? '#ef4444' : 'rgba(255, 255, 255, 0.1)' }}
                  />
                  <small className="override-hint">
                    *Leave blank for standard Operator clearance.
                  </small>
                </div>
              )}

              <button type="submit" className={`auth-submit-btn ${isSubmitting ? 'processing' : ''}`} disabled={isSubmitting}>
                {isSubmitting ? "Encrypting..." : (isLogin ? "LOGIN TO CONSOLE" : "INITIALIZE SIGNUP")}
              </button>

              {message && <div className="auth-alert error animate-slide-down">⚠️ {message}</div>}
              {successMsg && <div className="auth-alert success animate-slide-down">✓ {successMsg}</div>}

              {isLogin && <Link to="/forgot-password" className="forgot-password-link">Forgot Password?</Link>}
            </form>

            <div className="auth-toggle">
              <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
              <button type="button" className="toggle-btn" onClick={toggleAuthMode}>
                {isLogin ? "Signup" : "Login"}
              </button>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}