import React from "react";

export default function BlackoutScreen() {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#010101',
      backgroundImage: 'radial-gradient(circle at center, #1a0505 0%, #000000 100%)',
      zIndex: 999999, // Absolute highest layer
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none',
      overflow: 'hidden'
    }}>
      <style>
        {`
          @keyframes violent-glitch {
            0% { transform: translate(0) }
            10% { transform: translate(-10px, 10px); color: #fff; }
            20% { transform: translate(10px, -10px); color: #ef4444; }
            30% { transform: translate(-10px, -5px) }
            40% { transform: translate(10px, 5px) }
            50% { transform: translate(-5px, 10px) }
            60% { transform: translate(5px, -10px); color: #fff; }
            70% { transform: translate(-10px, 5px) }
            80% { transform: translate(10px, -5px) }
            90% { transform: translate(-5px, -10px); color: #ef4444; }
            100% { transform: translate(0) }
          }
          .blackout-text {
            font-size: 5vw;
            font-weight: 900;
            color: #ef4444;
            font-family: monospace;
            letter-spacing: 5px;
            text-transform: uppercase;
            text-shadow: 0 0 20px #ef4444, 0 0 40px #ef4444;
            animation: violent-glitch 0.2s infinite;
          }
        `}
      </style>

      <div style={{ fontSize: '4rem', marginBottom: '20px', animation: 'violent-glitch 0.5s infinite' }}>⚠️</div>
      <div className="blackout-text">NEURAL LINK SEVERED</div>
      <div style={{ marginTop: '30px', color: '#8b92a5', fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '2px', textAlign: 'center' }}>
        SYSTEM OVERRIDE INITIATED BY ADMIN. <br />
        AWAITING PROTOCOL RESTORATION.
      </div>
    </div>
  );
}