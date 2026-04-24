import React, { useState, useEffect, useCallback, useRef } from "react";
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom"; // 🚀 Imported for Upgrade Redirection

// 🚀 CAMERA ENGINE
const CameraRig = ({ focusedPlanetPos }) => {
  useFrame((state) => {
    if (focusedPlanetPos) {
      const target = new THREE.Vector3(focusedPlanetPos.x, focusedPlanetPos.y, focusedPlanetPos.z);
      const camPos = new THREE.Vector3(focusedPlanetPos.x + 6, focusedPlanetPos.y + 2, focusedPlanetPos.z + 8);
      state.camera.position.lerp(camPos, 0.05);
      state.camera.lookAt(target);
    } else {
      state.camera.position.lerp(new THREE.Vector3(0, 25, 40), 0.05);
      state.camera.lookAt(0, 0, 0);
    }
  });
  return null;
};

const CoreStar = () => (
  <mesh>
    <sphereGeometry args={[3, 32, 32]} />
    <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={4} toneMapped={false} />
  </mesh>
);

const Moon = ({ radius, speed, angleOffset, color }) => {
  const moonOrbitRef = useRef();
  useFrame((state, delta) => {
    if (moonOrbitRef.current) moonOrbitRef.current.rotation.y += delta * speed;
  });
  return (
    <group ref={moonOrbitRef} rotation={[0, angleOffset, 0]}>
      <mesh position={[radius, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} toneMapped={false} />
      </mesh>
    </group>
  );
};

const PlanetaryRing = ({ radius, color }) => {
  const ringRef = useRef();
  useFrame((state, delta) => {
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.2;
  });
  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2.2, 0, 0]}>
      <ringGeometry args={[radius + 1.5, radius + 2.5, 64]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} side={THREE.DoubleSide} transparent opacity={0.8} wireframe />
    </mesh>
  );
};

const PersonalPlanet = ({ planet, index, total, isFocused, anyFocused, onFocus }) => {
  const [hovered, setHovered] = useState(false);
  const orbitRef = useRef();
  const planetRef = useRef();
  
  let color = "#00ffe7"; 
  if (planet.type === 'Health') color = "#10b981";
  else if (planet.type === 'Knowledge') color = "#a855f7";
  else if (planet.type === 'Finance') color = "#eab308";

  const angle = (index / total) * Math.PI * 2;
  const radius = 12 + (index * 4); 
  const planetSize = Number(planet.size || 1.5) * 1.5;
  const currentStreak = planet.streak !== undefined ? planet.streak : 1; 

  useFrame((state, delta) => {
    if (orbitRef.current && !anyFocused) {
      orbitRef.current.rotation.y += delta * (0.15 + (index * 0.02));
    }
    if (planetRef.current) planetRef.current.rotation.y += delta * 0.5;
  });

  const handleInteraction = (e) => {
      e.stopPropagation();
      if (anyFocused) return; 
      const worldPosition = new THREE.Vector3();
      planetRef.current.getWorldPosition(worldPosition);
      onFocus(planet, worldPosition);
  };

  return (
    <group ref={orbitRef} rotation={[0, angle, 0]}>
      <group position={[radius, Math.sin(index) * 2, 0]}>
        <mesh 
          ref={planetRef} onClick={handleInteraction}
          onPointerOver={(e) => { e.stopPropagation(); if(!anyFocused) { setHovered(true); document.body.style.cursor = 'crosshair'; } }} 
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
        >
          <sphereGeometry args={[planetSize, 32, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isFocused || hovered ? 8 : 3} toneMapped={false} wireframe={isFocused || hovered} />
        </mesh>
        {Array.from({ length: currentStreak }).map((_, i) => (
          <Moon key={`moon-${i}`} radius={planetSize + 1.2 + (i * 0.4)} speed={2 + (i * 0.5)} angleOffset={(Math.PI * 2 / currentStreak) * i} color={color} />
        ))}
        {planetSize > 4 && <PlanetaryRing radius={planetSize} color={color} />}
      </group>
    </group>
  );
};

export default function PersonalUniverse({ onTransmissionSuccess }) {
  const navigate = useNavigate(); // 🚀 Navigation Hook
  
  const [planets, setPlanets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('operator'); // 🚀 Tracking User Tier
  
  const [focusedPlanet, setFocusedPlanet] = useState(null);
  const [focusedPosition, setFocusedPosition] = useState(null);
  const [hudInput, setHudInput] = useState("");
  
  const [isForging, setIsForging] = useState(false);
  const [newPlanetName, setNewPlanetName] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmitStatus, setTransmitStatus] = useState(null); 

  const [isCtrlHeld, setIsCtrlHeld] = useState(false);
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);

  // 🚀 TIER CALCULATION
  const currentRole = userRole.toLowerCase();
  const isUnlimited = ['commander', 'syndicate', 'overwatch', 'admin'].includes(currentRole);
  const maxNodes = isUnlimited ? Infinity : (currentRole === 'navigator' ? 15 : 5);
  const isAtCapacity = planets.length >= maxNodes;

  useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.key === "Control" || e.key === "Meta") setIsCtrlHeld(true);
    };
    const handleKeyUp = (e) => {
        if (e.key === "Control" || e.key === "Meta") setIsCtrlHeld(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const fetchPlanets = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/json" };
      const cacheBuster = `?t=${new Date().getTime()}`;
      
      // 🚀 1. Fetch User Role to enforce Tier Limits
      const meRes = await fetch(`http://127.0.0.1:8000/api/me${cacheBuster}`, { headers });
      if (meRes.ok) {
          const meData = await meRes.json();
          setUserRole(meData.role || 'operator');
      }

      // 2. Fetch Planets
      const coreRes = await fetch(`http://127.0.0.1:8000/api/planets${cacheBuster}`, { headers });
      let corePlanets = coreRes.ok ? await coreRes.json() : [];
      corePlanets = Array.isArray(corePlanets) ? corePlanets : (corePlanets.data || []);
      
      const customRes = await fetch(`http://127.0.0.1:8000/api/forge/nodes${cacheBuster}`, { headers });
      let customNodes = customRes.ok ? await customRes.json() : [];
      customNodes = Array.isArray(customNodes) ? customNodes.map(n => ({ ...n, type: 'Custom' })) : [];

      setPlanets([...corePlanets, ...customNodes]);
    } catch (err) { console.error("Universe offline."); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPlanets(); }, [fetchPlanets]);

  const handleFocus = (planetData, worldPos) => {
      setFocusedPlanet(planetData);
      setFocusedPosition(worldPos);
      setIsForging(false); 
      setTransmitStatus(null);
  };

  const handleAbort = () => {
      setFocusedPlanet(null);
      setFocusedPosition(null);
      setHudInput("");
      setTransmitStatus(null);
  };

  const handleForgePlanet = async (e) => {
    e.preventDefault();
    if (!newPlanetName.trim()) return;
    setIsSynthesizing(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/forge/synthesize`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ name: newPlanetName, type: "Custom", size: 1.5 })
      });
      
      if (res.ok) {
        const newPlanetData = await res.json();
        setPlanets(prev => [...prev, { ...newPlanetData.planet, type: 'Custom' }]);
        setNewPlanetName("");
        setIsForging(false);
      } else if (res.status === 403) {
        // 🚀 SERVER-SIDE REJECTION HANDLER (Fallback if UI bypass fails)
        const errData = await res.json();
        alert(errData.message);
        setIsForging(false);
      }
    } catch (err) {} 
    finally { setIsSynthesizing(false); }
  };

  const handleEradicateNode = async () => {
      if (!window.confirm(`CRITICAL WARNING: Eradicate [${focusedPlanet.name}]?`)) return;
      setIsDeleting(true);
      try {
          const endpoint = focusedPlanet.type === 'Custom' 
              ? `http://127.0.0.1:8000/api/forge/nodes/${focusedPlanet.id}`
              : `http://127.0.0.1:8000/api/planets/${focusedPlanet.id}`;
              
          const res = await fetch(endpoint, { 
              method: 'DELETE', 
              headers: { "Authorization": `Bearer ${getToken()}`, "Accept": "application/json" } 
          });
          
          if (res.ok) {
              setPlanets(prev => prev.filter(p => !(p.id === focusedPlanet.id && p.type === focusedPlanet.type)));
              handleAbort();
          } else {
              const errData = await res.json().catch(() => ({}));
              alert(`System Error: Eradication failed. ${errData.message || 'Check backend route.'}`);
          }
      } catch (err) {
          alert("Network Error during Eradication.");
      } 
      finally { setIsDeleting(false); }
  };

  const handleTransmitData = async () => {
      if (!hudInput.trim()) return;
      setIsTransmitting(true);
      setTransmitStatus(null); 

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
          const aiRes = await fetch(`http://127.0.0.1:8000/api/omni-process`, {
              method: 'POST',
              headers: { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json", "Accept": "application/json" },
              body: JSON.stringify({ telemetry_text: `[${focusedPlanet.name} Sector]: ${hudInput}` }),
              signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!aiRes.ok) throw new Error("Omni-Node analysis failed.");
          const aiData = await aiRes.json();
          
          let xpGained = 15;
          if (aiData.gamification && aiData.gamification.xp_gained !== undefined) xpGained = aiData.gamification.xp_gained;
          else if (aiData.xp_gained !== undefined) xpGained = aiData.xp_gained;

          const injectRes = await fetch(`http://127.0.0.1:8000/api/forge/inject-mass`, {
              method: 'POST',
              headers: { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json", "Accept": "application/json" },
              body: JSON.stringify({ id: focusedPlanet.id, is_custom: focusedPlanet.type === 'Custom', xp_gained: xpGained })
          });

          if (injectRes.ok) {
              const injectData = await injectRes.json();
              
              setPlanets(prev => prev.map(p => (p.id === focusedPlanet.id && p.type === focusedPlanet.type) ? { ...p, size: injectData.new_size, streak: injectData.new_streak } : p));
              setFocusedPlanet(prev => ({ ...prev, size: injectData.new_size, streak: injectData.new_streak }));
              setTransmitStatus({ type: 'success', text: `⚡ +${xpGained} XP | Node Mass Increased!` });
              setHudInput("");
              
              if (onTransmissionSuccess) onTransmissionSuccess();

              setTimeout(() => setTransmitStatus(null), 4000);
          } else {
              setTransmitStatus({ type: 'error', text: 'System Error: Mass injection failed.' });
          }
      } catch (err) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
              setTransmitStatus({ type: 'error', text: 'Timeout: AI Node Offline or Overloaded.' });
          } else {
              setTransmitStatus({ type: 'error', text: 'Network connection severed.' });
          }
      } finally {
          setIsTransmitting(false); 
      }
  };

  if (loading) return <div style={{ color: '#00ffe7', fontFamily: 'monospace', textAlign: 'center', padding: '20px' }}>Calibrating 3D Matrix...</div>;

  let hudColor = "#00ffe7";
  if (focusedPlanet?.type === 'Health') hudColor = "#10b981";
  if (focusedPlanet?.type === 'Knowledge') hudColor = "#a855f7";
  if (focusedPlanet?.type === 'Finance') hudColor = "#eab308";

  return (
    <div 
      style={{ width: '100%', height: '450px', borderRadius: '16px', overflow: 'hidden', border: `1px solid rgba(0, 255, 231, 0.3)`, boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)', position: 'relative', background: '#010204', transition: 'all 0.5s' }}
      onMouseEnter={() => setIsHoveringCanvas(true)}
      onMouseLeave={() => setIsHoveringCanvas(false)}
    >
      
      <div style={{ position: 'absolute', top: '15px', left: '20px', zIndex: 10, pointerEvents: 'none', opacity: focusedPlanet ? 0 : 1, transition: 'opacity 0.3s' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', textShadow: '0 0 10px #00ffe7', textTransform: 'uppercase', letterSpacing: '2px' }}>Your Constellation</h3>
        <p style={{ margin: '2px 0 0 0', color: '#8b92a5', fontSize: '0.8rem', fontFamily: 'monospace' }}>
            Orbiting Nodes: <strong style={{color: isAtCapacity ? '#ef4444' : '#00ffe7'}}>{planets.length} / {isUnlimited ? '∞' : maxNodes}</strong>
        </p>
      </div>

      {isHoveringCanvas && !isCtrlHeld && !focusedPlanet && !isForging && (
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: '#8b92a5', padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', pointerEvents: 'none', zIndex: 10, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace' }}>
              Hold <strong style={{color: '#fff'}}>CTRL</strong> / <strong style={{color: '#fff'}}>CMD</strong> to Zoom
          </div>
      )}

      {/* 🚀 FIXED: GATED "SYNTHESIZE NODE" BUTTON */}
      {!focusedPlanet && !isForging && (
         <button 
            onClick={() => {
                if (isAtCapacity) {
                    if (window.confirm("Matrix Capacity Reached 🔒\nUpgrade your tier to synthesize more nodes. View plans?")) {
                        navigate('/pricing');
                    }
                } else {
                    setIsForging(true);
                }
            }} 
            style={{ 
                position: 'absolute', bottom: '20px', right: '20px', zIndex: 10, 
                background: isAtCapacity ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 255, 231, 0.1)', 
                border: `1px solid ${isAtCapacity ? '#ef4444' : '#00ffe7'}`, 
                color: isAtCapacity ? '#ef4444' : '#00ffe7', 
                padding: '10px 20px', borderRadius: '8px', fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', 
                boxShadow: `0 0 15px ${isAtCapacity ? 'rgba(239,68,68,0.2)' : 'rgba(0,255,231,0.2)'}`, transition: 'all 0.3s' 
            }}
         >
            {isAtCapacity ? "🔒 CAPACITY REACHED" : "+ Synthesize Node"}
         </button>
      )}

      {isForging && !focusedPlanet && (
         <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(3,4,7,0.95)', border: '1px solid #00ffe7', padding: '30px', borderRadius: '12px', zIndex: 30, width: '350px', boxShadow: '0 0 50px rgba(0, 255, 231, 0.3)', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.3s ease-out' }}>
             <h3 style={{ color: '#00ffe7', margin: '0 0 15px 0', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '2px' }}>Genesis Forge</h3>
             <form onSubmit={handleForgePlanet}>
                 <input type="text" value={newPlanetName} onChange={(e) => setNewPlanetName(e.target.value)} placeholder="e.g. Coding, Music, Fitness..." disabled={isSynthesizing} style={{ width: '100%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,255,231,0.4)', color: '#fff', padding: '12px', borderRadius: '6px', outline: 'none', fontFamily: 'monospace', marginBottom: '15px' }} autoFocus />
                 <div style={{ display: 'flex', gap: '10px' }}>
                     <button type="button" onClick={() => setIsForging(false)} disabled={isSynthesizing} style={{ flex: 1, background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace' }}>ABORT</button>
                     <button type="submit" disabled={isSynthesizing || !newPlanetName.trim()} style={{ flex: 2, background: '#00ffe7', border: 'none', color: '#000', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase' }}>{isSynthesizing ? "Forging..." : "Ignite Core"}</button>
                 </div>
             </form>
         </div>
      )}

      {focusedPlanet && (
        <div style={{ position: 'absolute', top: '0', bottom: '0', right: '0', width: '350px', background: 'linear-gradient(270deg, rgba(3,4,7,0.95) 40%, rgba(3,4,7,0) 100%)', zIndex: 20, padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', animation: 'slideInRight 0.4s ease-out' }}>
            <h2 style={{ color: hudColor, margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '2px', textShadow: `0 0 15px ${hudColor}` }}>{focusedPlanet.name}</h2>
            
            <p style={{ color: '#8b92a5', fontFamily: 'monospace', margin: '0 0 20px 0', textTransform: 'uppercase' }}>
              Sector: {focusedPlanet.type} | Mass: {Number(focusedPlanet.size).toFixed(1)}u | Moons: {focusedPlanet.streak || 1}
            </p>

            {transmitStatus && (
                <div style={{ 
                    background: transmitStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                    border: `1px solid ${transmitStatus.type === 'success' ? '#10b981' : '#ef4444'}`, 
                    color: transmitStatus.type === 'success' ? '#10b981' : '#ef4444', 
                    padding: '10px', borderRadius: '6px', marginBottom: '15px', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 'bold',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    {transmitStatus.text}
                </div>
            )}

            <div style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid rgba(255,255,255,0.1)`, padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ color: '#d1d5db', fontSize: '0.85rem', margin: '0 0 10px 0' }}>DIRECT NODE INJECTION</p>
                
                <input 
                  type="text" 
                  value={hudInput} 
                  onChange={(e) => setHudInput(e.target.value)} 
                  placeholder={`Log ${focusedPlanet.name} action...`} 
                  disabled={isTransmitting}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.8)', border: `1px solid ${hudColor}50`, color: '#fff', padding: '10px', borderRadius: '4px', outline: 'none', fontFamily: 'monospace' }} 
                />
                
                <button 
                  onClick={handleTransmitData}
                  disabled={isTransmitting || !hudInput.trim()}
                  style={{ width: '100%', marginTop: '10px', background: isTransmitting ? '#374151' : `${hudColor}20`, border: `1px solid ${isTransmitting ? '#4b5563' : hudColor}`, color: isTransmitting ? '#9ca3af' : hudColor, padding: '10px', borderRadius: '4px', cursor: isTransmitting ? 'not-allowed' : 'pointer', fontWeight: 'bold', textTransform: 'uppercase', transition: 'all 0.3s' }}
                >
                  {isTransmitting ? "ANALYZING..." : "TRANSMIT DATA"}
                </button>
            </div>

            <button onClick={handleEradicateNode} disabled={isDeleting} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '15px' }}>{isDeleting ? "Eradicating..." : "Eradicate Node"}</button>
            <button onClick={handleAbort} style={{ background: 'transparent', border: 'none', color: '#8b92a5', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'monospace', textAlign: 'left', marginTop: 'auto' }}>[X] ABORT DEEP-DIVE</button>
        </div>
      )}

      <Canvas camera={{ position: [0, 25, 40], fov: 50 }}>
        <ambientLight intensity={0.1} />
        <pointLight position={[0, 0, 0]} intensity={2} color="#ffffff" />
        <Stars radius={50} depth={20} count={2000} factor={3} saturation={0} fade speed={1} />
        <CoreStar />
        {planets.map((planet, idx) => (
          <PersonalPlanet key={`personal-planet-${planet.type}-${planet.id || idx}`} planet={planet} index={idx} total={planets.length} isFocused={focusedPlanet?.id === planet.id && focusedPlanet?.type === planet.type} anyFocused={!!focusedPlanet} onFocus={handleFocus} />
        ))}
        {!focusedPlanet && <OrbitControls enablePan={false} enableZoom={isCtrlHeld} enableRotate={true} maxDistance={60} minDistance={10} />}
        <CameraRig focusedPlanetPos={focusedPosition} />
        <EffectComposer disableNormalPass><Bloom luminanceThreshold={1} mipmapBlur intensity={focusedPlanet ? 0.8 : 1.5} /></EffectComposer>
      </Canvas>
    </div>
  );
}