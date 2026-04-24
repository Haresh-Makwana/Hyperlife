import React from 'react';

export default function VoiceCommandModal({ isListening, aiResponse, gamification, isProcessing, onStop, onClose }) {
  
  if (!isListening && !isProcessing && !aiResponse) return null;

  return (
    <div style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        backgroundColor: 'rgba(5, 8, 15, 0.85)', display: 'flex', justifyContent: 'center', 
        alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' 
    }}>
      <div style={{ 
          background: '#0d1117', border: '1px solid rgba(0, 255, 231, 0.15)', 
          borderRadius: '24px', padding: '30px', width: '90%', maxWidth: '450px', 
          textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' 
      }}>

        {/* State 1: Active Microphone */}
        {isListening && (
            <div>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #00ffe7, #0077ff)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 255, 231, 0.4)' }}>
                    <span style={{ fontSize: '2rem' }}>🎤</span>
                </div>
                <h2 style={{ color: '#fff', margin: '0 0 5px 0' }}>Listening...</h2>
                <p style={{ color: '#8b92a5', fontSize: '0.9rem', marginBottom: '20px' }}>Speak your activity clearly.</p>
                <button onClick={onStop} style={{ padding: '12px 24px', background: 'rgba(255, 95, 109, 0.1)', color: '#ff5f6d', border: '1px solid #ff5f6d', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Stop Recording
                </button>
            </div>
        )}

        {/* State 2: Processing Audio/Text */}
        {isProcessing && (
            <div>
                 <div style={{ width: '50px', height: '50px', border: '4px solid #1e293b', borderTop: '4px solid #00ffe7', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }}>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                 </div>
                 <h2 style={{ color: '#fff', margin: 0 }}>Syncing Telemetry...</h2>
                 <p style={{ color: '#8b92a5', fontSize: '0.9rem', marginTop: '10px' }}>Omni-Node is processing your log.</p>
            </div>
        )}

        {/* State 3: Final Analysis (Fixed Layout) */}
        {aiResponse && !isProcessing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 style={{ color: '#fff', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Omni-Analysis</h2>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        
                        {/* Domain Tag */}
                        <span style={{ background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            {aiResponse.domain || 'General'}
                        </span>

                        {/* XP Tag */}
                        {gamification && (
                            <span style={{ color: '#00ffe7', fontWeight: '900', fontSize: '1.1rem', textShadow: '0 0 10px rgba(0, 255, 231, 0.4)' }}>
                                +{gamification.xp_changed || gamification.xp_gained || 10} XP
                            </span>
                        )}
                    </div>

                    {/* Insight Text */}
                    <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                        🤖 {aiResponse.insight || aiResponse}
                    </p>
                </div>

                {/* Fixed DONE Button - Will no longer overlap */}
                <button onClick={onClose} style={{ width: '100%', padding: '14px', background: 'rgba(0, 255, 231, 0.1)', color: '#00ffe7', border: '1px solid rgba(0, 255, 231, 0.3)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.2s' }}>
                    DONE
                </button>
            </div>
        )}

      </div>
    </div>
  );
}