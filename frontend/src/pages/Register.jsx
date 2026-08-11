import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css"; 

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    admin_code: "" 
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // HANDLE GOOGLE SSO CLICK
  const handleGoogleSignup = async () => {
    try {
      const res = await fetch("https://hyperlife-backend.onrender.com/api/auth/google/url");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError("Failed to establish secure link with Google.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch("https://hyperlife-backend.onrender.com/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        // Specifically catch the 403 Forbidden error for invalid admin codes
        if (response.status === 403) {
            setError("ACCESS DENIED: Invalid System Override Key.");
        } else {
            setError(data?.message || "Registration failed");
        }
        setIsSubmitting(false);
        return;
      }

      // STRICT VERIFICATION: Do not redirect immediately
      setSuccess("God-Mode Initialized! Please check your email to verify your identity before logging in.");
      setForm({ name: "", email: "", password: "", password_confirmation: "", admin_code: "" });

      // Redirect to login after 3 seconds so they can read the message
      setTimeout(() => { navigate("/login"); }, 3000);

    } catch (err) {
      setError("Server error. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-ambient-glow"></div>

      <div className="auth-content-split">
        
        {/* Left Branding Side */}
        <aside className="auth-left animate-drop">
          <h1 className="auth-logo">
            <span className="logo-icon">🌌</span> HyperLife <span className="highlight-cyan">OS</span>
          </h1>
          <p className="auth-brand-tagline">Initialize God-Mode. Forge your digital universe from the source code up.</p>
        </aside>

        {/* Right Form Card Side */}
        <section className="auth-right animate-rise">
          <div className="auth-glass-card">
            <h2 className="auth-title">Initialize God-Mode</h2>

            <button 
                onClick={handleGoogleSignup}
                type="button"
                className="google-sso-btn hover-lift"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="google-icon">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                Sign up with Google
            </button>

            <div className="auth-divider">
                <span>OR PROCEED MANUALLY</span>
            </div>

            {error && <div className="auth-alert error animate-slide-down">⚠️ {error}</div>}
            {success && <div className="auth-alert success animate-slide-down">✓ {success}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <label>OPERATOR_NAME</label>
                <input 
                  type="text" 
                  name="name" 
                  className="cryptic-input"
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                  placeholder="Full Name"
                />
              </div>

              <div className="input-group">
                <label>COMMS_ADDRESS</label>
                <input 
                  type="email" 
                  name="email" 
                  className="cryptic-input"
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                  placeholder="Email Address"
                />
              </div>

              <div className="input-group">
                <label>DECRYPTION_KEY</label>
                <input 
                  type="password" 
                  name="password" 
                  className="cryptic-input"
                  value={form.password} 
                  onChange={handleChange} 
                  required 
                  placeholder="Password"
                />
              </div>

              <div className="input-group">
                <label>CONFIRM_DECRYPTION_KEY</label>
                <input 
                  type="password" 
                  name="password_confirmation" 
                  className="cryptic-input"
                  value={form.password_confirmation} 
                  onChange={handleChange} 
                  required 
                  placeholder="Confirm Password"
                />
              </div>

              <div className="input-group override-group">
                <label style={{ color: '#ef4444' }}>SYSTEM OVERRIDE KEY (OPTIONAL)</label>
                <input 
                  type="password" 
                  name="admin_code" 
                  className="cryptic-input"
                  placeholder="Admin Code..." 
                  value={form.admin_code} 
                  onChange={handleChange} 
                  style={{ borderColor: form.admin_code ? '#ef4444' : 'rgba(255, 255, 255, 0.1)' }}
                />
                <small className="override-hint">*Leave blank for standard Operator clearance.</small>
              </div>

              <button 
                type="submit" 
                className={`auth-submit-btn ${isSubmitting ? 'processing' : ''}`} 
                disabled={isSubmitting}
              >
                  {isSubmitting ? "Encrypting Data..." : "INITIALIZE SIGNUP"}
              </button>
            </form>

            <div className="auth-toggle">
              <span>Already have an account?</span> 
              <Link to="/login" className="toggle-btn" style={{ textDecoration: 'none' }}>Login</Link>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}