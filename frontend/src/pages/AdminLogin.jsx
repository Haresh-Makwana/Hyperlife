import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setToken, setRole } from "../utils/auth";
import "../styles/Auth.css"; // Reusing your existing styles

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Pointing strictly to the new dedicated Admin API endpoint
      const res = await fetch("http://127.0.0.1:8000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed. Invalid credentials.");
        setIsLoading(false);
        return;
      }

      // Success! Save the token and force the role to admin
      setToken(data.token);
      setRole("admin");

      // Route directly to the admin dashboard
      navigate("/admin");

    } catch (err) {
      setError("Connection error. Is the server running?");
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ background: '#050505' }}>
      <div className="auth-left">
        <h1 className="auth-logo" style={{ color: '#00ffe7' }}>
          <span className="logo-icon">👑</span> HyperLife OS
        </h1>
        <p style={{ color: '#8b92a5', marginTop: '20px' }}>Admin Login Portal</p>
      </div>

      <div className="auth-right">
        <div className="auth-glass-card" style={{ border: '1px solid #00ffe7' }}>
          <h2 className="auth-title" style={{ color: '#00ffe7' }}>
            Admin Login
          </h2>

          <form onSubmit={handleAdminLogin} className="auth-form">
            <div className="input-group">
              <input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="auth-submit-btn" 
              disabled={isLoading}
              style={{ background: '#00ffe7', color: '#000', fontWeight: 'bold' }}
            >
              {isLoading ? "Logging in..." : "Log In"}
            </button>

            {error && (
              <p style={{ 
                color: '#ff4d4d', 
                background: 'rgba(255, 77, 77, 0.1)', 
                padding: '10px', 
                borderRadius: '5px', 
                marginTop: '15px',
                border: '1px solid #ff4d4d'
              }}>
                {error}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}