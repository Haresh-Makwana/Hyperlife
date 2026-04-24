import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../utils/auth";
import GamificationModal from "../components/GamificationModal";
import "../styles/AddActivity.css";

export default function AddActivity() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [gamificationStats, setGamificationStats] = useState(null);

  // 🚀 THE FIX: Removed mood and energy sliders from state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    activity_date: new Date().toISOString().split("T")[0], 
  });

  useEffect(() => {
    if (!getToken()) navigate("/login");
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`,
          "Accept": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.gamification) {
          setGamificationStats(data.gamification);
          setShowModal(true);
          setLoading(false); 
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        if (data.errors) {
          const firstError = Object.values(data.errors)[0][0];
          setError(firstError);
        } else {
          setError(data.message || "Failed to log activity.");
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("Error logging activity:", err);
      setError("Network error. Is your backend running?");
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    window.location.href = "/dashboard"; 
  };

  return (
    <>
      <GamificationModal 
        isOpen={showModal} 
        onClose={handleCloseModal} 
        gamificationData={gamificationStats} 
      />

      <div className="activity-container">
        <div className="activity-bg-wrapper">
          <div className="activity-grid-overlay"></div>
          <div className="activity-ambient-glow activity-glow-cyan"></div>
          <div className="activity-ambient-glow activity-glow-purple"></div>
        </div>

        <div className="activity-content">
          
          <div className="activity-header activity-entrance activity-delay-1">
            <button className="back-btn" onClick={() => navigate("/dashboard")}>
              <span className="arrow">←</span> Abort & Return
            </button>
            <div className="tagline-pill mt-4">
              <span className="sparkle">📡</span> Uplink Terminal
            </div>
            <h1 className="activity-title">
              Log <span className="text-gradient">Activity.</span>
            </h1>
          </div>

          <div className="activity-form-wrapper activity-entrance activity-delay-2">
            <div className="activity-glass-card">
              
              {error && <div className="system-alert">{error}</div>}

              <form onSubmit={handleSubmit} className="hyper-form">
                
                <div className="input-group-modern activity-entrance activity-delay-3">
                  <label><span className="input-icon">📝</span> Action Title</label>
                  <input 
                    type="text" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g., 5km Run, Deep Work, Coding" 
                    className="cyber-input-modern"
                  />
                </div>

                <div className="input-group-modern activity-entrance activity-delay-4">
                  <label><span className="input-icon">🗒️</span> Action Details</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter telemetry notes so the AI can evaluate your mood and energy..." 
                    rows="3"
                    className="cyber-input-modern"
                  ></textarea>
                </div>

                {/* 🚀 THE FIX: AI Automated Banner replacing Sliders */}
                <div className="ai-auto-box activity-entrance activity-delay-5">
                    <div className="ai-pulse-icon"></div>
                    <div className="ai-auto-text">
                        <strong>AI AUTO-CALIBRATION ACTIVE</strong>
                        <p>Mental State and Physical Energy levels will be automatically calculated by the Master AI Core based on your telemetry notes.</p>
                    </div>
                </div>

                <div className="input-group-modern activity-entrance activity-delay-6 mt-4">
                  <label><span className="input-icon">📅</span> Temporal Coordinates</label>
                  <input type="date" name="activity_date" value={formData.activity_date} onChange={handleChange} required className="cyber-input-modern date-input" />
                </div>

                <button type="submit" className={`btn-submit activity-entrance activity-delay-6 ${loading ? 'sending' : ''}`} disabled={loading}>
                  <div className="btn-glow-layer"></div>
                  <span className="btn-text">{loading ? "AI ANALYZING TELEMETRY..." : "INITIALIZE UPLOAD"}</span>
                </button>

              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}