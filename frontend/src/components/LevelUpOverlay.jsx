import React, { useState, useEffect } from "react";

export default function LevelUpOverlay({ level, onDismiss }) {
  const [glitch, setGlitch] = useState(true);

  // Play a glitch effect for 1.5 seconds, then stabilize into a smooth pulse
  useEffect(() => {
    const timer = setTimeout(() => setGlitch(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(3, 4, 7, 0.95)',
      backdropFilter: 'blur(10px)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.5s ease-out',
      overflow: 'hidden'
    }}>
      {/* 🚀 DYNAMIC CSS INJECTION FOR HOLOGRAPHIC EFFECTS */}
      <style>
        {`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes pulse-glow { 
            0%, 100% { text-shadow: 0 0 20px #00ffe7, 0 0 40px #00ffe7, 0 0 80px #7f5cff; transform: scale(1); }
            50% { text-shadow: 0 0 40px #00ffe7, 0 0 80px #00ffe7, 0 0 120px #7f5cff; transform: scale(1.05); }
          }
          .glitch-text {
            font-size: 5rem;
            font-weight: 900;
            color: #fff;
            font-family: monospace;
            letter-spacing: 10px;
            text-transform: uppercase;
            position: relative;
            animation: ${glitch ? 'glitch-anim 0.2s infinite' : 'pulse-glow 2s infinite'};
          }
          @keyframes glitch-anim {
            0% { transform: translate(0) }
            20% { transform: translate(-10px, 10px) }
            40% { transform: translate(-10px, -10px) }
            60% { transform: translate(10px, 10px) }
            80% { transform: translate(10px, -10px) }
            100% { transform: translate(0) }
          }
        `}
      </style>

      <div style={{ color: '#00ffe7', fontSize: '1.2rem', fontFamily: 'monospace', letterSpacing: '4px', marginBottom: '10px' }}>
        CONGRATULATIONS!
      </div>

      <div className="glitch-text">
        LEVEL UP
      </div>

      <div style={{ marginTop: '30px', fontSize: '1.5rem', color: '#8b92a5', fontFamily: 'monospace', textTransform: 'uppercase' }}>
        You are now Level:
      </div>

      <div style={{ 
        fontSize: '7rem', 
        fontWeight: '900', 
        color: '#7f5cff', 
        textShadow: '0 0 40px #7f5cff',
        marginTop: '-10px',
        fontFamily: 'monospace'
      }}>
        {level}
      </div>

      <button 
        onClick={onDismiss}
        style={{
          marginTop: '50px',
          padding: '15px 40px',
          background: 'transparent',
          border: '2px solid #00ffe7',
          color: '#00ffe7',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          letterSpacing: '2px',
          cursor: 'pointer',
          textTransform: 'uppercase',
          boxShadow: '0 0 15px rgba(0, 255, 231, 0.3)',
          transition: 'all 0.3s'
        }}
        onMouseOver={(e) => { e.target.style.background = '#00ffe7'; e.target.style.color = '#000'; e.target.style.boxShadow = '0 0 30px #00ffe7'; }}
        onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#00ffe7'; e.target.style.boxShadow = '0 0 15px rgba(0, 255, 231, 0.3)'; }}
      >
        Continue
      </button>

    </div>
  );
}