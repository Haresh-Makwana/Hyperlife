import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    admin_code: "" // 🚀 NEW: Added Admin Code to State
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🚀 HANDLE GOOGLE SSO CLICK
  const handleGoogleSignup = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/google/url");
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
      const response = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
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

      // 🚀 STRICT VERIFICATION: Do not redirect to dashboard.
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
    <div style={{ maxWidth: "400px", margin: "50px auto", fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ color: '#00ffe7', textAlign: 'center' }}>Initialize God-Mode</h2>

      {/* 🚀 GOOGLE SSO BUTTON */}
      <button 
          onClick={handleGoogleSignup}
          type="button"
          style={{ width: '100%', padding: '12px', background: '#fff', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '20px' }}
      >
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" style={{ width: '20px' }} />
          Sign up with Google
      </button>

      <div style={{ textAlign: 'center', color: '#8b92a5', margin: '20px 0', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Or Proceed Manually
      </div>

      {error && <p style={{ color: "#ef4444", textAlign: 'center', fontWeight: 'bold', padding: '10px', border: '1px solid #ef4444', borderRadius: '4px', background: 'rgba(239,68,68,0.1)' }}>{error}</p>}
      {success && <p style={{ color: "#10b981", textAlign: 'center', fontWeight: 'bold', padding: '15px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '6px' }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', color: '#8b92a5', marginBottom: '5px' }}>Full Name</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required style={{ width: '100%', padding: '10px', background: '#0a0c12', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
        </div>

        <div>
          <label style={{ display: 'block', color: '#8b92a5', marginBottom: '5px' }}>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required style={{ width: '100%', padding: '10px', background: '#0a0c12', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
        </div>

        <div>
          <label style={{ display: 'block', color: '#8b92a5', marginBottom: '5px' }}>Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required style={{ width: '100%', padding: '10px', background: '#0a0c12', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
        </div>

        <div>
          <label style={{ display: 'block', color: '#8b92a5', marginBottom: '5px' }}>Confirm Password</label>
          <input type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} required style={{ width: '100%', padding: '10px', background: '#0a0c12', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
        </div>

        {/* 🚀 NEW: MANDATORY OVERRIDE KEY FOR ADMINS */}
        <div>
          <label style={{ display: 'block', color: '#ff003c', marginBottom: '5px', fontWeight: 'bold' }}>System Override Key</label>
          <input type="password" name="admin_code" placeholder="Required for registration" value={form.admin_code} onChange={handleChange} required style={{ width: '100%', padding: '10px', background: 'rgba(255,0,60,0.05)', border: '1px solid #ff003c', color: '#ff003c', borderRadius: '4px' }} />
        </div>

        <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '12px', background: '#00ffe7', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
            {isSubmitting ? "Encrypting Data..." : "Register"}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', color: '#8b92a5' }}>
        Already have an account? <Link to="/login" style={{ color: '#00ffe7', textDecoration: 'none' }}>Login</Link>
      </p>
    </div>
  );
}