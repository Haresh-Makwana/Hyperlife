import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css"; // Utilizing your beautiful CSS

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Phases: 1 = Email, 2 = OTP, 3 = New Password
  const [phase, setPhase] = useState(1);
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🚀 PHASE 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/password/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.errors?.email?.[0] || "Failed to send key.");
      setMessage(data.message);
      setPhase(2); // Move to OTP Phase
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  // 🚀 PHASE 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/password/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid Key.");
      setMessage(data.message);
      setPhase(3); // Move to Password Phase
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  // 🚀 PHASE 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/password/reset", {
        method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email, otp, password, password_confirmation: confirmPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password.");
      
      setMessage("Password successfully overridden. Redirecting to Matrix...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <h1 className="auth-logo"><span className="logo-icon">🌌</span> HyperLife OS</h1>
      </div>

      <div className="auth-right">
        <div className="auth-glass-card">
          <h2 className="auth-title">System Security Override</h2>
          
          <div className="auth-divider">
            <span>{phase === 1 ? "STEP 1: IDENTIFICATION" : phase === 2 ? "STEP 2: DECRYPTION" : "STEP 3: NEW CREDENTIALS"}</span>
          </div>

          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}

          {/* PHASE 1 FORM */}
          {phase === 1 && (
            <form onSubmit={handleSendOtp} className="auth-form">
              <div className="input-group">
                <input type="email" placeholder="Enter Operator Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "Transmitting..." : "Request Decryption Key"}
              </button>
            </form>
          )}

          {/* PHASE 2 FORM */}
          {phase === 2 && (
            <form onSubmit={handleVerifyOtp} className="auth-form">
              <div className="input-group">
                <input type="text" placeholder="Enter 6-Digit Decryption Key" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" required style={{ letterSpacing: '5px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: '#00ffe7' }} />
              </div>
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify Identity"}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#8b92a5', marginTop: '10px' }}>Check your email inbox for the key.</p>
            </form>
          )}

          {/* PHASE 3 FORM */}
          {phase === 3 && (
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="input-group">
                <input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="input-group">
                <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "Encrypting..." : "Lock New Password"}
              </button>
            </form>
          )}

          <div className="auth-toggle">
            <Link to="/login" className="toggle-btn" style={{ marginTop: '15px', display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Abort & Return to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}