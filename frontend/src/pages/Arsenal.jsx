import React, { useState, useEffect, useCallback } from "react";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import "../styles/Arsenal.css";

export default function Arsenal() {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState([]);
  const [userStats, setUserStats] = useState({ level: 1, xp: 0 });
  const [newTitle, setNewTitle] = useState("");
  const [newCost, setNewCost] = useState("");
  const [loading, setLoading] = useState(true);

  // 🚀 NEW INTERACTIVE STATES
  const [confirmingId, setConfirmingId] = useState(null);
  const [purchasingId, setPurchasingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) { navigate("/login"); return; }
    
    try {
      const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/json" };
      // Get User XP
      const userRes = await fetch("http://127.0.0.1:8000/api/user", { headers });
      if (userRes.ok) {
          const userData = await userRes.json();
          setUserStats({ level: userData.level || 1, xp: userData.xp || 0 });
      }
      // Get Rewards
      const rewardRes = await fetch("http://127.0.0.1:8000/api/rewards", { headers });
      if (rewardRes.ok) setRewards(await rewardRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateReward = async (e) => {
    e.preventDefault();
    if (!newTitle || !newCost) return;
    try {
      const res = await fetch("http://127.0.0.1:8000/api/rewards", {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, cost: parseInt(newCost) })
      });
      if (res.ok) {
        setNewTitle(""); setNewCost(""); fetchData();
        showToast("PROTOCOL ADDED TO DATABASE.", "success");
      }
    } catch (err) { showToast("SYSTEM ERROR.", "error"); }
  };

  const handlePurchaseClick = (reward) => {
      // 🚀 FIXED: Accurate frontend math to check affordability
      const totalXp = ((userStats.level - 1) * 100) + userStats.xp;
      const canAfford = totalXp >= reward.cost;
      
      if (!canAfford) {
          showToast("INSUFFICIENT XP. ACCESS DENIED.", "error");
          return;
      }

      // Step 1: Require Double Click to Confirm
      if (confirmingId !== reward.id) {
          setConfirmingId(reward.id);
          setTimeout(() => setConfirmingId(null), 3000); // Auto-cancel confirm after 3s
          return;
      }

      // Step 2: Trigger Glitch/Decrypt Animation
      setConfirmingId(null);
      setPurchasingId(reward.id);

      // Simulate a network decryption delay for visual effect
      setTimeout(async () => {
          try {
            const res = await fetch(`http://127.0.0.1:8000/api/rewards/${reward.id}/purchase`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${getToken()}`, "Accept": "application/json" }
            });
            const data = await res.json();
            
            if (res.ok) {
                showToast(`[${reward.title}] UNLOCKED. XP RETAINED.`, "success");
                setUserStats({ level: data.new_level, xp: data.new_xp });
            } else {
                showToast(data.error || "DECRYPTION FAILED.", "error");
            }
          } catch (err) { 
              showToast("NETWORK INTERFERENCE.", "error"); 
          } finally {
              setPurchasingId(null);
          }
      }, 1200); // 1.2s Decrypting Animation
  };

  const handleDelete = async (id) => {
      try {
          await fetch(`http://127.0.0.1:8000/api/rewards/${id}`, {
              method: "DELETE", headers: { "Authorization": `Bearer ${getToken()}` }
          });
          showToast("PROTOCOL DELETED.", "error");
          fetchData();
      } catch (err) {}
  };

  if (loading) return <div className="arsenal-wrapper" style={{justifyContent: 'center', display: 'flex', alignItems: 'center'}}><div className="glitch-text">Establishing Secure Uplink...</div></div>;

  return (
    <div className="arsenal-wrapper">
      
      {/* IN-GAME NOTIFICATION SYSTEM */}
      {toast && (
          <div className={`arsenal-toast ${toast.type}`}>
              <div className="toast-icon">{toast.type === 'success' ? '✓' : '⚠️'}</div>
              <div className="toast-msg">{toast.msg}</div>
          </div>
      )}

      {/* HEADER & WALLET */}
      <div className="arsenal-header">
        <div>
            <h1 className="arsenal-title">THE ARSENAL</h1>
            {/* 🚀 FIXED: Updated subtitle to match Milestone logic */}
            <p className="arsenal-subtitle">Reach XP milestones to unlock real-world protocols.</p>
        </div>
        <div className="wallet-card">
            <span className="wallet-label">Secure Balance</span>
            <div className="wallet-balance">
                <span className="wallet-lvl">LVL {userStats.level}</span>
                <span className="wallet-xp">{userStats.xp} XP</span>
            </div>
        </div>
      </div>

      {/* COMMAND TERMINAL UI */}
      <div className="terminal-container">
          <div className="terminal-top-bar">
              <div className="term-dots">
                  <span className="dot red"></span><span className="dot yellow"></span><span className="dot green"></span>
              </div>
              <span className="term-title">SYS_ADMIN // ADD_PROTOCOL.exe</span>
          </div>
          <form onSubmit={handleCreateReward} className="terminal-body">
              <div className="term-input-group">
                  <span className="term-prompt">{">"}</span>
                  <input type="text" placeholder="DEFINE_REWARD_TITLE..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
              </div>
              <div className="term-input-group">
                  <span className="term-prompt" style={{color: '#ffb86c'}}>XP</span>
                  {/* 🚀 FIXED: Updated placeholder text */}
                  <input type="number" placeholder="SET_XP_MILESTONE..." value={newCost} onChange={(e) => setNewCost(e.target.value)} min="1" required />
              </div>
              <button type="submit" className="term-btn">[ INJECT PROTOCOL ]</button>
          </form>
      </div>

      {/* STOREFRONT GRID */}
      <div className="arsenal-grid">
          {rewards.length === 0 ? (
              <div className="empty-state-msg">NO PROTOCOLS DETECTED IN LOCAL MAINFRAME. INITIALIZE A NEW REWARD ABOVE.</div>
          ) : (
              rewards.map(reward => {
                  // 🚀 FIXED: Safe rendering math
                  const totalXp = ((userStats.level - 1) * 100) + userStats.xp;
                  const canAfford = totalXp >= reward.cost;
                  const isConfirming = confirmingId === reward.id;
                  const isPurchasing = purchasingId === reward.id;
                  
                  return (
                      <div key={reward.id} className={`reward-card ${canAfford ? 'affordable' : 'locked'} ${isPurchasing ? 'glitching' : ''}`}>
                          <button className="delete-reward" onClick={() => handleDelete(reward.id)}>✕</button>
                          
                          <div className="reward-content">
                              <h4>{reward.title}</h4>
                              <div className="reward-cost">⚡ {reward.cost} XP</div>
                          </div>

                          <button 
                              className={`purchase-btn ${isConfirming ? 'confirm-state' : ''} ${isPurchasing ? 'processing-state' : ''}`} 
                              onClick={() => handlePurchaseClick(reward)}
                          >
                              {isPurchasing ? (
                                  <span className="cyber-glitch-text">DECRYPTING...</span>
                              ) : isConfirming ? (
                                  "CONFIRM UNLOCK?"
                              ) : canAfford ? (
                                  "INITIATE UNLOCK"
                              ) : (
                                  "LOCKED"
                              )}
                          </button>
                      </div>
                  )
              })
          )}
      </div>

    </div>
  );
}