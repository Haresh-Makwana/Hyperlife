import React, { useState, useEffect, useCallback } from "react";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import "../styles/NeuralGrid.css";

const DOMAIN_COLORS = {
  health: "#00ffe7", knowledge: "#a855f7", finance: "#ffb86c",
  productivity: "#10b981", creativity: "#eab308", social: "#ec4899", general: "#ffffff"
};

const getGlowColor = (hex) => {
    if(hex.startsWith('#') && hex.length === 7) {
        const r = parseInt(hex.slice(1,3), 16);
        const g = parseInt(hex.slice(3,5), 16);
        const b = parseInt(hex.slice(5,7), 16);
        return `rgba(${r}, ${g}, ${b}, 0.2)`;
    }
    return 'rgba(255,255,255,0.1)';
}

export default function NeuralGrid() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newDomain, setNewDomain] = useState("knowledge");
  const [newName, setNewName] = useState("");

  // 🚀 AI LOGGING STATES
  const [syncingSkillId, setSyncingSkillId] = useState(null); // Which skill card is open
  const [actionInput, setActionInput] = useState(""); // User's typed log
  const [isTransmitting, setIsTransmitting] = useState(false); // Loading state for AI
  const [activeNode, setActiveNode] = useState({ id: null, type: null }); // For pulse animations
  const [toastMessage, setToastMessage] = useState(null);

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) { navigate("/login"); return; }
    try {
      const res = await fetch("http://127.0.0.1:8000/api/skills", {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      if (res.ok) setSkills(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await fetch("http://127.0.0.1:8000/api/skills", {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain, name: newName })
      });
      if (res.ok) { setNewName(""); fetchData(); }
    } catch (err) { console.error(err); }
  };

  const showToast = (message) => {
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 5000);
  }

  // 🚀 THE NEW REAL-WORLD AI SYNC LOGIC
  const handleTransmitToAI = async (skill) => {
      if (!actionInput.trim()) return;
      setIsTransmitting(true);
      setActiveNode({ id: skill.id, type: 'train' }); // Start pulsing

      try {
          // 1. Send the text to Omni-Process (Gemini) to evaluate the action
          const aiRes = await fetch(`http://127.0.0.1:8000/api/omni-process`, { 
              method: 'POST', 
              headers: { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json" },
              body: JSON.stringify({ telemetry_text: `[Training Skill: ${skill.name}]: ${actionInput}` }) 
          });
          
          if (!aiRes.ok) throw new Error("AI Sync Failed.");
          const aiData = await aiRes.json();
          
          // AI calculates how much XP this action is actually worth!
          const earnedXp = aiData.gamification?.xp_gained || 15;
          const aiFeedback = aiData.analysis || "Action logged and verified.";

          // 2. Inject that calculated XP into the skill
          const injectRes = await fetch(`http://127.0.0.1:8000/api/skills/${skill.id}/inject`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json" },
              body: JSON.stringify({ xp_gained: earnedXp }) 
          });
          
          const injectData = await injectRes.json();
          
          if (injectRes.ok) {
              if (injectData.message.includes("LEVEL UP")) {
                  setActiveNode({ id: skill.id, type: 'levelup' });
                  showToast(`🚀 LEVEL UP! [${skill.name} -> LVL ${injectData.skill.level}] | AI: "${aiFeedback}" (+${earnedXp} XP)`);
              } else {
                  showToast(`⚡ DATA SYNCED | AI: "${aiFeedback}" (+${earnedXp} XP)`);
              }
              fetchData();
          }
      } catch (err) { 
          showToast("⚠️ ERROR: Neural link to AI Core severed. Try again.");
          console.error(err); 
      } finally {
          setIsTransmitting(false);
          setSyncingSkillId(null);
          setActionInput("");
          setTimeout(() => setActiveNode({ id: null, type: null }), 1000);
      }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Delete this skill? This will sever the neural pathway permanently.")) return;
      try {
          await fetch(`http://127.0.0.1:8000/api/skills/${id}`, {
              method: "DELETE", headers: { "Authorization": `Bearer ${getToken()}` }
          });
          fetchData();
      } catch (err) {}
  };

  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.domain]) acc[skill.domain] = [];
    acc[skill.domain].push(skill);
    return acc;
  }, {});

  if (loading) return <div className="grid-wrapper"><div className="grid-header"><h1>BOOTING NEURAL GRID...</h1></div></div>;

  return (
    <div className="grid-wrapper">
      
      {toastMessage && (
          <div className="cyber-toast">
              {toastMessage}
          </div>
      )}

      <div className="grid-header">
        <h1>NEURAL PATHWAYS</h1>
        <p>Synthesize and cultivate your active skill nodes.</p>
      </div>

      <div className="grid-forge">
          <form onSubmit={handleCreateSkill} className="grid-form">
              <select value={newDomain} onChange={(e) => setNewDomain(e.target.value)}>
                  {Object.keys(DOMAIN_COLORS).map(d => <option key={d} value={d}>{d.toUpperCase()} SECTOR</option>)}
              </select>
              <input type="text" placeholder="Designate new skill construct..." value={newName} onChange={(e) => setNewName(e.target.value)} maxLength="25" required />
              <button type="submit">SYNTHESIZE NODE</button>
          </form>
      </div>

      <div className="trees-container">
          {Object.keys(groupedSkills).map((domain, treeIndex) => {
              const domainColor = DOMAIN_COLORS[domain] || DOMAIN_COLORS.general;
              const glowColor = getGlowColor(domainColor);
              
              return (
                  <div key={domain} className="skill-tree" style={{ '--domain-color': domainColor, '--domain-color-glow': glowColor }}>
                      <div className="tree-root" style={{ borderColor: domainColor, boxShadow: `0 0 25px ${glowColor}, inset 0 0 10px ${glowColor}` }}>
                          <span style={{ color: domainColor }}>{domain.toUpperCase()}</span>
                      </div>
                      
                      <div className="tree-trunk"></div>

                      <div className="tree-branches">
                          {groupedSkills[domain].map((skill, nodeIndex) => {
                              let nodeClass = "node-box";
                              if (activeNode.id === skill.id) {
                                  if (activeNode.type === 'levelup') nodeClass += " level-up";
                                  else if (activeNode.type === 'train') nodeClass += " training";
                              }

                              const isSyncing = syncingSkillId === skill.id;

                              return (
                                  <div key={skill.id} className="skill-node" style={{ animationDelay: `${(treeIndex * 0.1) + (nodeIndex * 0.1)}s` }}>
                                      <div className="node-connector"></div>
                                      <div className={nodeClass}>
                                          <button className="del-btn" onClick={() => handleDelete(skill.id)}>×</button>
                                          <h4>{skill.name}</h4>
                                          <div className="node-stats">
                                              <span className="lvl">LVL {skill.level}</span>
                                              <span className="xp">{skill.xp} / 100 XP</span>
                                          </div>
                                          <div className="progress-bar-bg">
                                              <div className="progress-bar-fill" style={{ width: `${skill.xp}%` }}></div>
                                          </div>
                                          
                                          {/* 🚀 DYNAMIC ACTION LOGGER */}
                                          {!isSyncing ? (
                                              <button className="train-btn" onClick={() => { setSyncingSkillId(skill.id); setActionInput(""); }}>
                                                  [ LOG REAL-WORLD ACTION ]
                                              </button>
                                          ) : (
                                              <div className="sync-panel">
                                                  <textarea 
                                                      className="sync-input" 
                                                      placeholder="E.g., Read 2 chapters of a book, practiced coding for 45 mins..." 
                                                      value={actionInput}
                                                      onChange={(e) => setActionInput(e.target.value)}
                                                      disabled={isTransmitting}
                                                  />
                                                  <div className="sync-actions">
                                                      <button 
                                                          className="btn-submit" 
                                                          onClick={() => handleTransmitToAI(skill)}
                                                          disabled={isTransmitting || !actionInput.trim()}
                                                      >
                                                          {isTransmitting ? 'ANALYZING...' : 'SYNC WITH AI'}
                                                      </button>
                                                      <button 
                                                          className="btn-cancel" 
                                                          onClick={() => { setSyncingSkillId(null); setActionInput(""); }}
                                                          disabled={isTransmitting}
                                                      >
                                                          ABORT
                                                      </button>
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              )
                          })}
                      </div>
                  </div>
              )
          })}
      </div>
    </div>
  );
}