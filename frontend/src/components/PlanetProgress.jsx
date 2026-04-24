import React, { useState, useEffect } from "react";
import { getToken } from "../utils/auth";
import "../styles/PlanetProgress.css";

export default function PlanetProgress({ planet, onProgressSaved }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Changed this to store the TYPE of success animation ('created', 'updated', or 'deleted')
  const [successAnim, setSuccessAnim] = useState(null); 
  const [editingId, setEditingId] = useState(null);

  const getTheme = (type) => {
    switch (type?.toLowerCase()) {
      case "health": return "theme-cyan";
      case "knowledge": return "theme-purple";
      case "finance": return "theme-orange";
      default: return "theme-cyan";
    }
  };
  const themeClass = getTheme(planet?.type);

  useEffect(() => {
    if (!planet?.id) return;
    fetchProgress();
    cancelEdit();
  }, [planet?.id]);

  const fetchProgress = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/planets/${planet.id}/progress`, {
        headers: { "Authorization": `Bearer ${getToken()}`, "Accept": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setDate(item.date);
    setScore(item.score);
    setNotes(item.notes === "No notes recorded." ? "" : item.notes);
    document.querySelector('.progress-form-container').scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setScore("");
    setNotes("");
    setDate(new Date().toISOString().split("T")[0]);
    setError("");
  };

  // ✅ NEW: The Delete Function
  const handleDelete = async () => {
    if (!editingId) return;
    
    // Safety check so you don't accidentally delete!
    if (!window.confirm("WARNING: Purging this telemetry will permanently decrease the planet's mass. Proceed?")) {
      return; 
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/planets/${planet.id}/progress/${editingId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${getToken()}`,
          "Accept": "application/json"
        }
      });

      if (res.ok) {
        setSuccessAnim('deleted');
        setTimeout(() => setSuccessAnim(null), 2500); 

        cancelEdit(); 
        fetchProgress(); 
        if (onProgressSaved) onProgressSaved(); 
      } else {
        const data = await res.json();
        setError(data.message || "Purge failed.");
      }
    } catch (err) {
      setError("Network error. Backend offline.");
    } finally {
      setLoading(false);
    }
  };

  // The Save/Update Function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = editingId 
      ? `http://127.0.0.1:8000/api/planets/${planet.id}/progress/${editingId}`
      : `http://127.0.0.1:8000/api/planets/${planet.id}/progress`;
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`,
          "Accept": "application/json"
        },
        body: JSON.stringify({ score: parseInt(score), notes, date })
      });

      if (res.ok) {
        setSuccessAnim(editingId ? 'updated' : 'created');
        setTimeout(() => setSuccessAnim(null), 2500); 

        cancelEdit(); 
        fetchProgress(); 
        if (onProgressSaved) onProgressSaved(); 
      } else {
        const data = await res.json();
        setError(data.message || "Transmission failed.");
      }
    } catch (err) {
      setError("Network error. Backend offline.");
    } finally {
      setLoading(false);
    }
  };

  if (!planet) return null;

  return (
    <div className={`planet-progress-wrapper ${themeClass} fade-in-up`}>
      
      <div className="progress-form-container relative-box">
        <h4 className="section-label">
          {editingId ? "Recalibrate Telemetry" : "Log Telemetry Data"}
        </h4>
        
        {/* Dynamic Success Overlay based on the action taken */}
        {successAnim && (
          <div className="success-overlay">
            <div className="cyber-circle">
               <span className="success-icon pulse-glow">
                 {successAnim === 'deleted' ? '✕' : '✓'}
               </span>
            </div>
            <p className="success-text glitch-effect" style={{ color: successAnim === 'deleted' ? '#ff5f6d' : 'var(--theme-color)' }}>
              {successAnim === 'created' && "TELEMETRY SYNCED"}
              {successAnim === 'updated' && "TELEMETRY RECALIBRATED"}
              {successAnim === 'deleted' && "TELEMETRY PURGED"}
            </p>
            <p className="success-subtext">
              {successAnim === 'deleted' ? "Planet Mass Decreased" : "Planet Mass Adjusted"}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={`progress-form ${successAnim ? 'blur-out' : ''}`}>
          <div className="input-row">
            <div className="cyber-input-group">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              <div className="input-glow-bar"></div>
            </div>
            <div className="cyber-input-group">
              <input type="number" placeholder="Score (1-10)" value={score} onChange={(e) => setScore(e.target.value)} min="1" max="10" required />
              <div className="input-glow-bar"></div>
            </div>
          </div>

          <div className="cyber-input-group mt-2">
            <textarea placeholder="Action details and observations..." value={notes} onChange={(e) => setNotes(e.target.value)} rows="2"></textarea>
            <div className="input-glow-bar"></div>
          </div>

          {error && <div className="error-box">🚨 {error}</div>}

          <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button type="submit" className="cyber-submit-btn" disabled={loading} style={{ flex: 1, marginTop: 0 }}>
              {loading ? "Transmitting..." : (editingId ? "Update" : "Save")}
            </button>
            
            {/* ✅ Show Delete and Cancel buttons ONLY when editing */}
            {editingId && (
              <>
                <button type="button" onClick={handleDelete} className="cyber-delete-btn" disabled={loading}>
                  Delete
                </button>
                <button type="button" onClick={cancelEdit} className="cyber-cancel-btn" disabled={loading}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      <div className="cyber-divider"></div>

      <div className="progress-history-container">
        <h4 className="section-label">Recent History</h4>
        
        {history.length === 0 ? (
          <div className="empty-history">
            <div className="radar-sweep"></div>
            <p>Awaiting initial telemetry.</p>
          </div>
        ) : (
          <ul className="history-list">
            {history.map((item, index) => (
              <li key={item.id} className={`history-item slide-in-left ${editingId === item.id ? 'editing-pulse' : ''}`} style={{animationDelay: `${index * 0.05}s`}}>
                <div className="history-top">
                  <div>
                    <span className="history-date">{item.date}</span>
                    <span className="history-score" style={{ marginLeft: '10px' }}>Score: {item.score}/10</span>
                  </div>
                  
                  <button className="history-edit-btn" onClick={() => handleEditClick(item)}>
                    ✎ Edit
                  </button>
                </div>
                {item.notes && <p className="history-notes">{item.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}