import React, { useState, useEffect } from "react";
import { getToken } from "../utils/auth";
import "../styles/SyndicateGrid.css";

export default function SyndicateGrid() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSyndicate = async () => {
      try {
        const token = getToken();
        if (!token) return;

        const res = await fetch(`http://127.0.0.1:8000/api/syndicate?t=${new Date().getTime()}`, {
          headers: { 
            "Authorization": `Bearer ${token}`, 
            "Accept": "application/json" 
          }
        });

        if (res.ok) {
          const data = await res.json();
          setLeaders(data);
        }
      } catch (err) {
        console.error("Leaderboard offline.");
      } finally {
        setLoading(false);
      }
    };

    fetchSyndicate();
    // Ping the leaderboard every 30 seconds for live updates
    const interval = setInterval(fetchSyndicate, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="syndicate-wrapper loading-state">
        <div className="scanner-line"></div>
        <p>Loading Leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="syndicate-wrapper">
      <div className="syndicate-header">
        <div className="header-title">
          <h3>LEADERBOARD</h3>
          <span className="live-badge">● LIVE</span>
        </div>
        <p>Global User Rankings</p>
      </div>

      <div className="syndicate-list">
        {leaders.length === 0 ? (
          <div className="no-data">No users found on the leaderboard.</div>
        ) : (
          leaders.map((user, index) => {
            const rank = index + 1;
            let rankClass = "rank-standard";
            if (rank === 1) rankClass = "rank-apex";
            if (rank === 2) rankClass = "rank-elite";
            if (rank === 3) rankClass = "rank-vanguard";

            return (
              <div key={user.id} className={`syndicate-row ${rankClass}`}>
                <div className="row-left">
                  <div className="rank-number">{rank < 10 ? `0${rank}` : rank}</div>
                  <div className="operator-info">
                    <h4>{user.name}</h4>
                    <span className="level-badge">LVL {user.level}</span>
                  </div>
                </div>

                <div className="row-right">
                  <div className="xp-readout">
                    <span className="xp-value">{user.xp}</span>
                    <span className="xp-label">XP</span>
                  </div>
                  
                  {/* Show their biggest planet to flex on others */}
                  {user.top_planet ? (
                    <div className="top-node">
                      <span className="node-label">Top Goal:</span>
                      <span className="node-name">{user.top_planet.name}</span>
                      <span className="node-mass">({Number(user.top_planet.size).toFixed(1)} pts)</span>
                    </div>
                  ) : (
                    <div className="top-node empty-node">No active goals.</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}