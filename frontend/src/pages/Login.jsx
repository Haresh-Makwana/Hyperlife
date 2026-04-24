import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

  // 🚀 1. HANDLE URL REDIRECTS (From Google or Email Verification)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");
    const urlRole = params.get("role");
    const urlError = params.get("error");
    const urlVerified = params.get("verified");

    if (urlToken) {
      // Decode and sanitize the token from the URL
      const cleanToken = decodeURIComponent(urlToken).replace(/['"]+/g, '').trim();
      setToken(cleanToken);
      localStorage.setItem("user_role", urlRole || "user");
      
      // Clear the URL string so it doesn't loop
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

  // 🚀 2. HANDLE GOOGLE SSO CLICK
  const handleGoogleLogin = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/google/url");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setMessage("Failed to establish secure link with Google.");
    }
  };

  // 🚀 3. HANDLE STANDARD LOGIN/REGISTER
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSuccessMsg("");
    setIsSubmitting(true);

    const endpoint = isLogin ? "http://127.0.0.1:8000/api/login" : "http://127.0.0.1:8000/api/register";
    
    // 🚀 FIXED: Added the 'role' property because Laravel's validator requires it!
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

      // Safeguard against missing tokens
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
    <div className="auth-container">
      <div className="auth-left">
        <h1 className="auth-logo"><span className="logo-icon">🌌</span> HyperLife OS</h1>
      </div>

      <div className="auth-right">
        <div className="auth-glass-card">
          <h2 className="auth-title">
            {isLogin ? "Welcome to Your Life, Visualized." : "Initialize Your Universe."}
          </h2>

          <button type="button" className="google-sso-btn" onClick={handleGoogleLogin}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="google-icon" />
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>OR PROCEED MANUALLY</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="input-group">
                <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}

            <div className="input-group">
              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="input-group">
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {!isLogin && (
              <div className="input-group" style={{ marginTop: '10px' }}>
                <input 
                  type="password" 
                  placeholder="System Override Key (Optional)" 
                  value={adminCode} 
                  onChange={(e) => setAdminCode(e.target.value)} 
                  style={{ borderColor: adminCode ? '#ff003c' : 'rgba(255, 255, 255, 0.1)' }}
                />
                <small style={{ color: '#8b92a5', fontSize: '0.75rem', marginTop: '5px', display: 'block', paddingLeft: '5px' }}>
                  *Leave blank for standard Operator clearance.
                </small>
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Encrypting..." : (isLogin ? "Login" : "Sign Up")}
            </button>

            {message && <p className="error-message">{message}</p>}
            {successMsg && <p className="success-message" style={{ color: '#10b981', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' }}>{successMsg}</p>}

            {isLogin && <a href="/forgot-password" className="forgot-password">Forgot Password?</a>}
          </form>

          <div className="auth-toggle">
            <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
            <button type="button" className="toggle-btn" onClick={toggleAuthMode}>
              {isLogin ? "Signup" : "Login"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}