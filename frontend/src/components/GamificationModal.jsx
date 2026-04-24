import React from "react";
import "../styles/GamificationModal.css";

export default function GamificationModal({ isOpen, onClose, gamificationData }) {
  if (!isOpen || !gamificationData) return null;

  const { xp_awarded, leveled_up, current_level } = gamificationData;

  return (
    <div className="hyper-modal-overlay">
      <div className={`hyper-modal-card ${leveled_up ? "is-levelup" : ""}`}>
        
        {/* The background ambient light */}
        <div className="hyper-modal-glow"></div>

        <div className="hyper-modal-content">
          
          {/* Dynamic Icon */}
          <div className="hyper-modal-icon">
            {leveled_up ? "🎉" : "⚡"}
          </div>

          {/* Dynamic Title */}
          <h2 className="hyper-modal-title">
            {leveled_up ? "LEVEL UP!" : "PROGRESS SAVED"}
          </h2>

          {/* Dynamic Message */}
          <p className="hyper-modal-subtitle">
            {leveled_up ? (
              <>
                Congratulations! You have reached <span className="level-highlight">Level {current_level}</span>.
              </>
            ) : (
              <>
                Great job! You earned <span className="xp-highlight">+{xp_awarded} XP</span>.
              </>
            )}
          </p>

          <button className="hyper-modal-btn" onClick={onClose}>
            Continue
          </button>

        </div>
      </div>
    </div>
  );
}