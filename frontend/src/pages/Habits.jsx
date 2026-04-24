import React, { useState, useEffect } from "react";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";

// 🚀 IMPORT THE MODAL AND ITS STYLES
import VoiceCommandModal from "./VoiceCommandModal";
import "../styles/UserDashboard.css"; 
import "../styles/Habits.css"; 

const DOMAINS = ["All", "Health", "Knowledge", "Finance", "Productivity", "Creativity", "Social"];

export default function Habits() {
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Health");
  const [habits, setHabits] = useState([]);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  
  // 🎙️ VOICE MODAL STATES
  const [isListening, setIsListening] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    fetchHabits();
  }, [navigate]);

  const fetchHabits = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/habits", {
        headers: { "Authorization": `Bearer ${getToken()}`, "Accept": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        const formattedHabits = data.map(h => ({
          id: h.id,
          title: h.title,
          category: h.planet ? h.planet.key.charAt(0).toUpperCase() + h.planet.key.slice(1) : "Health",
          streak: h.streak || 0
        }));
        setHabits(formattedHabits);
      } else {
        setError("Failed to sync protocols with server.");
      }
    } catch (err) {
      setError("Network error. Is Laravel running?");
    }
  };

  // 🚀 UPDATED VOICE COMMAND LOGIC
  const startVoiceCommand = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("System Error: Your browser does not support Voice Recognition.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setShowVoiceModal(true); // Open the visual modal!
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const formattedTranscript = transcript.charAt(0).toUpperCase() + transcript.slice(1);
      setTitle(formattedTranscript); // Instantly sets the input box text!
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setShowVoiceModal(false);
      alert(`Voice Error: ${event.error}. Try again.`);
    };

    recognition.onend = () => {
      setIsListening(false);
      setShowVoiceModal(false); // Close the modal as soon as speaking stops
    };

    recognition.start();
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError("Habit title cannot be empty."); return; }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`, "Accept": "application/json" },
        body: JSON.stringify({ title: title, planet_key: category.toLowerCase() })
      });

      if (res.ok) {
        fetchHabits(); setTitle(""); setError(""); setActiveFilter("All");
      } else {
        const errData = await res.json(); setError(errData.message || "Failed to deploy protocol.");
      }
    } catch (err) { setError("Network error. Is Laravel running?"); }
  };

  const handleComplete = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/habits/${id}/complete`, {
        method: "POST", headers: { "Authorization": `Bearer ${getToken()}`, "Accept": "application/json" }
      });
      const data = await res.json();
      if (res.ok) {
        setHabits(habits.map(h => h.id === id ? { ...h, streak: data.streak } : h));
        if (data.gamification) {
          alert(`🔥 Protocol Synced! +${data.gamification.xp_awarded} XP Gained!`);
        }
      } else { alert(`⚠️ ${data.message}`); }
    } catch (err) { console.error("Failed to complete protocol:", err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this habit permanently? This will cost you 10 XP.")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/habits/${id}`, {
        method: "DELETE", headers: { "Authorization": `Bearer ${getToken()}`, "Accept": "application/json" }
      });
      if (res.ok) {
        setHabits(habits.filter(habit => habit.id !== id));
        alert(`🗑️ Protocol Deleted. -10 XP.`);
      }
    } catch (err) { console.error("Failed to delete protocol:", err); }
  };

  const getCategoryTheme = (cat) => {
    const lowerCat = cat.toLowerCase();
    switch (lowerCat) {
      case "health": return "theme-cyan"; case "knowledge": return "theme-purple";
      case "finance": return "theme-orange"; case "productivity": return "theme-green";
      case "creativity": return "theme-yellow"; case "social": return "theme-pink";
      default: return "theme-cyan";
    }
  };

  const getCategoryHex = (cat) => {
    const lowerCat = cat.toLowerCase();
    switch (lowerCat) {
      case "health": return "#00ffe7"; case "knowledge": return "#a855f7";
      case "finance": return "#ffb86c"; case "productivity": return "#10b981";
      case "creativity": return "#eab308"; case "social": return "#ec4899";
      default: return "#00ffe7";
    }
  };

  const getNextMilestone = (streak) => {
      if (streak < 7) return 7;
      if (streak < 21) return 21;
      if (streak < 90) return 90;
      return streak + 30; 
  };

  const filteredHabits = activeFilter === "All" 
    ? habits 
    : habits.filter(h => h.category.toLowerCase() === activeFilter.toLowerCase());

  return (
    <div className="habits-container">
      <div className="habit-bg-wrapper">
        <div className="habit-ambient-glow habit-glow-top"></div>
        <div className="habit-ambient-glow habit-glow-bottom"></div>
      </div>

      <div className="habits-content">
        
        <button onClick={() => navigate("/dashboard")} className="habit-return-btn habit-entrance">
          ← Return to Dashboard
        </button>

        <section className="habits-header habit-entrance habit-delay-1">
          <div className="tagline-pill"><span className="sparkle">🧬</span> Behavioral Engine</div>
          <h1 className="habits-title">Master Your <span className="text-gradient">Routines.</span></h1>
          <p className="habits-subtitle">Deploy daily protocols to build your universe. Consistency generates XP and expands your core domains.</p>
        </section>

        <section className="habit-creator habit-entrance habit-delay-2">
          <div className="habit-glass-form">
            {error && <div className="system-alert">{error}</div>}
            <form onSubmit={handleAddHabit} className="habit-form-grid">
              <div className="habit-input-group">
                <input 
                  type="text" 
                  placeholder=" " 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                />
                <label>Define Protocol (Habit Name)</label>
                <div className="input-glow-line"></div>
              </div>
              <div className="habit-select-group">
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {DOMAINS.filter(d => d !== "All").map(d => (
                      <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <div className="input-glow-line"></div>
              </div>
              
              <div className="habit-form-actions">
                {/* 🎤 Trigger for the Modal */}
                <button 
                  type="button" 
                  className={`habit-mic-btn ${isListening ? 'listening' : ''}`} 
                  onClick={startVoiceCommand}
                  title="Use Voice Command"
                >
                  🎤
                </button>
                <button type="submit" className="habit-btn-submit habit-pulse-btn">Deploy Habit</button>
              </div>

            </form>
          </div>
        </section>

        <section className="habits-list-section habit-entrance habit-delay-3">
          <div className="list-header-row">
             <h2 className="section-heading" style={{ borderBottom: 'none', marginBottom: 0 }}>Active Protocols</h2>
             
             <div className="habit-filters">
                {DOMAINS.map(domain => (
                    <button 
                        key={domain} 
                        className={`filter-pill ${activeFilter === domain ? 'active' : ''}`}
                        onClick={() => setActiveFilter(domain)}
                    >
                        {domain}
                    </button>
                ))}
             </div>
          </div>

          <div className="habits-grid">
            {filteredHabits.length === 0 ? (
              <div className="empty-state-box">
                  <p className="empty-state">No protocols found for this sector. Deploy a new habit to begin.</p>
              </div>
            ) : (
              filteredHabits.map((habit) => {
                const themeClass = getCategoryTheme(habit.category);
                const hexColor = getCategoryHex(habit.category);
                const nextMilestone = getNextMilestone(habit.streak);
                const progressPercent = Math.min((habit.streak / nextMilestone) * 100, 100);

                return (
                  <div key={habit.id} className={`habit-card ${themeClass}`}>
                    
                    <div className="habit-card-top">
                        <div className="habit-card-left">
                        <div className={`habit-node ${themeClass}-node`}></div>
                        <div className="habit-info">
                            <h3>{habit.title}</h3>
                            <span className={`habit-tag ${themeClass}-tag`}>{habit.category}</span>
                        </div>
                        </div>
                        <div className="habit-card-right">
                        <div className="habit-streak">
                            <span className="streak-icon">🔥</span>
                            <span className="streak-count">{habit.streak} Days</span>
                        </div>
                        <div className="habit-actions">
                            <button className="h-btn complete-btn" onClick={() => handleComplete(habit.id)} title="Mark Complete">✓</button>
                            <button className="h-btn delete-btn" onClick={() => handleDelete(habit.id)} title="Abandon Habit">✕</button>
                        </div>
                        </div>
                    </div>

                    <div className="habit-milestone-wrapper">
                        <div className="milestone-labels">
                            <span>Current: {habit.streak}</span>
                            <span>Next Milestone: {nextMilestone} Days</span>
                        </div>
                        <div className="milestone-track">
                            <div className="milestone-fill" style={{ width: `${progressPercent}%`, backgroundColor: hexColor, boxShadow: `0 0 10px ${hexColor}` }}></div>
                        </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* 🚀 INJECT THE VOICE COMMAND MODAL */}
      {showVoiceModal && (
        <VoiceCommandModal 
          isListening={isListening}
          transcript={null} // We don't need the transcript in the modal since it fills the input
          aiResponse={null} // AI processing is not needed for habits creation
          gamification={null}
          isProcessing={false}
          onStart={startVoiceCommand}
          onClose={() => setShowVoiceModal(false)}
        />
      )}
    </div>
  );
}