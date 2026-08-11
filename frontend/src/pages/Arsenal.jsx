import React, { useState, useEffect, useCallback } from "react";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import Skeleton from "../components/Skeleton"; // 🚀 INJECTED SKELETON COMPONENT
import "../styles/Arsenal.css";

export default function Arsenal() {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState([]);
  const [userStats, setUserStats] = useState({ level: 1, xp: 0 });
  const [newTitle, setNewTitle] = useState("");
  const [newCost, setNewCost] = useState("");
  const [loading, setLoading] = useState(true);

  // INTERACTIVE STATES
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
      const userRes = await fetch("https://hyperlife-backend.onrender.com/api/user", { headers });
      if (userRes.ok) {
          const userData = await userRes.json();
          setUserStats({ level: userData.level || 1, xp: userData.xp || 0 });
      }
      // Get Rewards
      const rewardRes = await fetch("https://hyperlife-backend.onrender.com/api/rewards", { headers });
      if (rewardRes.ok) setRewards(await rewardRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateReward = async (e) => {
    e.preventDefault();
    if (!newTitle || !newCost) return;
    try {
      const res = await fetch("https://hyperlife-backend.onrender.com/api/rewards", {
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
      const totalXp = ((userStats.level - 1) * 100) + userStats.xp;
      const canAfford = totalXp >= reward.cost;
      
      if (!canAfford) {
          showToast("INSUFFICIENT XP. ACCESS DENIED.", "error");
          return;
      }

      if (confirmingId !== reward.id) {
          setConfirmingId(reward.id);
          setTimeout(() => setConfirmingId(null), 3000); 
          return;
      }

      setConfirmingId(null);
      setPurchasingId(reward.id);

      setTimeout(async () => {
          try {
            const res = await fetch(`https://hyperlife-backend.onrender.com/api/rewards/${reward.id}/purchase`, {
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
      }, 1200); 
  };

  const handleDelete = async (id) => {
      try {
          await fetch(`https://hyperlife-backend.onrender.com/api/rewards/${id}`, {
              method: "DELETE", headers: { "Authorization": `Bearer ${getToken()}` }
          });
          showToast("PROTOCOL DELETED.", "error");
          fetchData();
      } catch (err) {}
  };

  // 🚀 REMOVED THE OLD FULL-SCREEN LOADING BLOCK
  // We now let the UI render and use skeletons for the missing data.

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
            <p className="arsenal-subtitle">Reach XP milestones to unlock real-world protocols.</p>
        </div>
        <div className="wallet-card">
            <span className="wallet-label">Secure Balance</span>
            
            {/* 🚀 WALLET SKELETON */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', marginTop: '5px' }}>
                    <Skeleton variant="text" width="60px" height="14px" />
                    <Skeleton variant="text" width="100px" height="24px" />
                </div>
            ) : (
                <div className="wallet-balance">
                    <span className="wallet-lvl">LVL {userStats.level}</span>
                    <span className="wallet-xp">{userStats.xp} XP</span>
                </div>
            )}
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
                  <input type="text" placeholder="DEFINE_REWARD_TITLE..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required disabled={loading} />
              </div>
              <div className="term-input-group">
                  <span className="term-prompt" style={{color: '#ffb86c'}}>XP</span>
                  <input type="number" placeholder="SET_XP_MILESTONE..." value={newCost} onChange={(e) => setNewCost(e.target.value)} min="1" required disabled={loading} />
              </div>
              <button type="submit" className="term-btn" disabled={loading}>[ INJECT PROTOCOL ]</button>
          </form>
      </div>

      {/* STOREFRONT GRID */}
      <div className="arsenal-grid">
          {/* 🚀 REWARD CARDS SKELETON */}
          {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`skeleton-${idx}`} className="reward-card locked" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Skeleton variant="rectangular" width="70%" height="24px" />
                          <Skeleton variant="circular" width="24px" height="24px" />
                      </div>
                      <Skeleton variant="text" width="40%" height="16px" />
                      <Skeleton variant="rectangular" width="100%" height="45px" style={{ marginTop: 'auto' }} />
                  </div>
              ))
          ) : rewards.length === 0 ? (
              <div className="empty-state-msg">NO PROTOCOLS DETECTED IN LOCAL MAINFRAME. INITIALIZE A NEW REWARD ABOVE.</div>
          ) : (
              rewards.map(reward => {
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