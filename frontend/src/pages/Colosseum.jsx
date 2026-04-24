import React, { useState, useEffect, useCallback } from "react";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import "../styles/Colosseum.css";

export default function Colosseum() {
  const navigate = useNavigate();
  const [duels, setDuels] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // New Challenge Form
  const [opponentId, setOpponentId] = useState("");
  const [title, setTitle] = useState("");
  const [wager, setWager] = useState(100);
  const [targetScore, setTargetScore] = useState(7);

  // AI Proof Logging States
  const [activeDuelId, setActiveDuelId] = useState(null);
  const [proofInput, setProofInput] = useState("");
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "default" });

  const showToast = (message, type = "default") => {
      setToast({ visible: true, message, type });
      setTimeout(() => setToast({ visible: false, message: "", type: "default" }), 5000);
  };

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) { navigate("/login"); return; }
    
    try {
      const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/json" };
      
      let userRes = await fetch("http://127.0.0.1:8000/api/user", { headers });
      if (!userRes.ok) userRes = await fetch("http://127.0.0.1:8000/api/me", { headers });
      
      if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData?.data || userData?.user || userData);
      } else {
          throw new Error("Failed to authenticate user.");
      }

      const opsRes = await fetch("http://127.0.0.1:8000/api/colosseum/operators", { headers });
      if (opsRes.ok) setOperators(await opsRes.json() || []);

      const duelsRes = await fetch("http://127.0.0.1:8000/api/colosseum/duels", { headers });
      if (duelsRes.ok) setDuels(await duelsRes.json() || []);
      
      setErrorMsg(null);
    } catch (err) { 
      console.error("Colosseum Error:", err);
      setErrorMsg("Failed to connect to the server. Is the backend running?");
    } finally { 
      setLoading(false); 
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChallenge = async (e) => {
    e.preventDefault();
    if (!opponentId || !title) return;
    if (!window.confirm(`Initiate duel? ${wager} XP will be locked in the Colosseum vault.`)) return;

    try {
      const res = await fetch("http://127.0.0.1:8000/api/colosseum/challenge", {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ opponent_id: opponentId, title, wager: parseInt(wager), target_score: parseInt(targetScore) })
      });
      const data = await res.json();
      if (res.ok) { 
          showToast("⚔️ Challenge broadcasted to the network.", "success"); 
          fetchData(); 
          setTitle(""); 
      } else { 
          showToast(`⚠️ ${data.error || "Challenge failed."}`, "error"); 
      }
    } catch (err) { showToast("⚠️ Network Error.", "error"); }
  };

  const handleAccept = async (id, wagerAmount) => {
    if (!window.confirm(`Accept duel? ${wagerAmount} XP will be deducted as your bet.`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/colosseum/${id}/accept`, {
        method: "POST", headers: { "Authorization": `Bearer ${getToken()}` }
      });
      if (res.ok) { 
          showToast("🛡️ Challenge Accepted. The duel begins!", "success"); 
          fetchData(); 
      } else { 
          showToast("⚠️ Action failed.", "error"); 
      }
    } catch (err) { showToast("⚠️ Network Error.", "error"); }
  };

  // 🚀 AI-DRIVEN STRIKE MECHANIC
  const handleSubmitProof = async (duel) => {
      if (!proofInput.trim()) return;
      setIsTransmitting(true);

      try {
          // 1. Send Proof to AI for Verification
          const aiRes = await fetch("http://127.0.0.1:8000/api/omni-process", {
              method: "POST",
              headers: { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json" },
              body: JSON.stringify({ telemetry_text: `[Colosseum Duel: ${duel.title}] Proof of action: ${proofInput}` })
          });
          const aiData = await aiRes.json();
          const aiFeedback = aiData.analysis || "Action verified by system.";

          // 2. If AI didn't crash, log the strike to the backend
          const res = await fetch(`http://127.0.0.1:8000/api/colosseum/${duel.id}/strike`, {
              method: "POST", headers: { "Authorization": `Bearer ${getToken()}` }
          });
          
          if (res.ok) {
              showToast(`⚡ STRIKE LANDED! AI: "${aiFeedback}"`, "success");
              fetchData();
              setActiveDuelId(null);
              setProofInput("");
          } else {
              const errData = await res.json();
              showToast(`⚠️ ${errData.error || "Strike failed."}`, "error");
          }
      } catch (err) {
          showToast("⚠️ Neural link to AI severed. Try again.", "error");
      } finally {
          setIsTransmitting(false);
      }
  };

  if (loading) return <div className="colosseum-wrapper center">Loading Colosseum Data...</div>;
  if (errorMsg) return <div className="colosseum-wrapper center" style={{color: '#ef4444'}}>⚠️ {errorMsg}</div>;
  if (!currentUser) return <div className="colosseum-wrapper center" style={{color: '#ffaa00'}}>User profile missing. Please log in again.</div>;

  return (
    <div className="colosseum-wrapper">
      
      {toast.visible && (
          <div className={`cyber-toast ${toast.type === 'success' ? 'success' : ''}`}>
              {toast.message}
          </div>
      )}

      <div className="colosseum-header">
        <h1>THE COLOSSEUM</h1>
        <p>Wager XP. Destroy your opponents. Claim the reward pool.</p>
      </div>

      <div className="colosseum-layout">
        {/* LEFT COLUMN: MATCHMAKING */}
        <div className="matchmaking-panel">
          <h3>CHALLENGE OPERATOR</h3>
          <form onSubmit={handleChallenge} className="challenge-form">
            <label>Select Target</label>
            <select value={opponentId} onChange={(e) => setOpponentId(e.target.value)} required>
              <option value="">-- Choose Opponent --</option>
              {Array.isArray(operators) && operators.map(op => (
                  <option key={op.id} value={op.id}>{op.name} (Level {op.level || 1})</option>
              ))}
            </select>
            
            <label>Combat Protocol (e.g., 7 Days of Gym)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Name your challenge..." />
            
            <div className="split-inputs">
                <div>
                    <label>XP Bet</label>
                    <input type="number" value={wager} onChange={(e) => setWager(e.target.value)} min="50" step="50" required />
                </div>
                <div>
                    <label>Target Score</label>
                    <input type="number" value={targetScore} onChange={(e) => setTargetScore(e.target.value)} min="1" required />
                </div>
            </div>

            <div className="pot-preview">TOTAL REWARD POOL: <span>{(wager || 0) * 2} XP</span></div>
            <button type="submit" className="strike-btn primary" style={{marginTop: '10px'}}>INITIATE DUEL</button>
          </form>
        </div>

        {/* RIGHT COLUMN: ACTIVE ARENA */}
        <div className="arena-panel">
          <h3>ACTIVE BATTLEGROUNDS</h3>
          
          {(!Array.isArray(duels) || duels.length === 0) ? (
              <div className="empty-arena">No combat operations active right now.</div>
          ) : (
              <div className="duels-list">
                  {duels.map(duel => {
                      const isChallenger = duel?.challenger_id === currentUser?.id;
                      const me = isChallenger ? duel?.challenger : duel?.opponent;
                      const them = isChallenger ? duel?.opponent : duel?.challenger;
                      const myScore = isChallenger ? (duel?.challenger_score || 0) : (duel?.opponent_score || 0);
                      const theirScore = isChallenger ? (duel?.opponent_score || 0) : (duel?.challenger_score || 0);
                      const target = duel?.target_score || 1;
                      
                      const isSyncing = activeDuelId === duel.id;

                      return (
                          <div key={duel.id} className={`duel-card status-${duel?.status || 'pending'}`}>
                              <div className="duel-card-header">
                                  <h4>{duel?.title || "Unknown Protocol"}</h4>
                                  <span className="wager-badge">POOL: {(duel?.wager || 0) * 2} XP</span>
                              </div>

                              <div className="vs-container">
                                  <div className="fighter me">
                                      <span className="name">YOU</span>
                                      <span className="score">{myScore}</span>
                                  </div>
                                  <div className="vs-badge">VS</div>
                                  <div className="fighter them">
                                      <span className="name">{them?.name || "Unknown"}</span>
                                      <span className="score">{theirScore}</span>
                                  </div>
                              </div>

                              {/* Fighting Game Health Bars */}
                              <div className="progress-dual">
                                  <div className="prog-me" style={{width: `${Math.min((myScore/target)*100, 100)}%`}}></div>
                                  <div className="vs-divider"></div>
                                  <div className="prog-them" style={{width: `${Math.min((theirScore/target)*100, 100)}%`}}></div>
                              </div>

                              {/* Action States */}
                              <div className="duel-actions">
                                  {duel?.status === 'pending' && isChallenger && <span className="strike-btn" style={{display: 'block', cursor: 'default', opacity: 0.7}}>AWAITING TARGET ACCEPTANCE...</span>}
                                  
                                  {duel?.status === 'pending' && !isChallenger && (
                                      <button className="strike-btn primary" onClick={() => handleAccept(duel.id, duel.wager)}>
                                          ACCEPT DUEL ({duel.wager} XP)
                                      </button>
                                  )}
                                  
                                  {duel?.status === 'active' && !isSyncing && (
                                      <button className="strike-btn primary" onClick={() => { setActiveDuelId(duel.id); setProofInput(""); }}>
                                          [ LAUNCH STRIKE (+1) ]
                                      </button>
                                  )}

                                  {duel?.status === 'active' && isSyncing && (
                                      <div className="proof-panel">
                                          <textarea 
                                              className="proof-input" 
                                              placeholder="Provide proof of action to the AI judge (e.g., 'I finished my 30 min workout')..." 
                                              value={proofInput}
                                              onChange={(e) => setProofInput(e.target.value)}
                                              disabled={isTransmitting}
                                          />
                                          <div className="proof-actions">
                                              <button 
                                                  className="btn-submit" 
                                                  onClick={() => handleSubmitProof(duel)}
                                                  disabled={isTransmitting || !proofInput.trim()}
                                              >
                                                  {isTransmitting ? 'VERIFYING...' : 'CONFIRM STRIKE'}
                                              </button>
                                              <button 
                                                  className="btn-cancel" 
                                                  onClick={() => setActiveDuelId(null)}
                                                  disabled={isTransmitting}
                                              >
                                                  ABORT
                                              </button>
                                          </div>
                                      </div>
                                  )}

                                  {duel?.status === 'completed' && (
                                      <div className={duel?.winner_id === currentUser?.id ? 'winner-banner' : 'loser-banner'}>
                                          {duel?.winner_id === currentUser?.id ? '🏆 FATALITY - YOU CLAIMED THE POOL' : '💀 DEFEATED - WAGER LOST'}
                                      </div>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
          )}
        </div>
      </div>
    </div>
  );
}