import React, { useRef, useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture, useFBX, Html, Ring, Line, Trail } from "@react-three/drei";
import { EffectComposer, Bloom, Noise } from "@react-three/postprocessing";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api"; 
import * as THREE from "three";

import "../styles/Universe3D.css";

const DOMAIN_COLORS = {
  health: "#00ffe7", knowledge: "#a855f7", finance: "#ffb86c",
  productivity: "#10b981", creativity: "#eab308", social: "#ec4899", general: "#ffffff"
};

const getPlanetDomain = (planet) => {
    if (!planet) return 'General';
    if (planet.domain) return planet.domain;
    if (planet.type && planet.type !== 'Custom') return planet.type; 
    return 'General';
};
const getPlanetColor = (planet) => DOMAIN_COLORS[getPlanetDomain(planet).toLowerCase()] || DOMAIN_COLORS.general;

const getOrbitData = (planet, ringIndex = 2) => {
  const radii = { 1: 12, 2: 20, 3: 28 };
  const speeds = { 1: 0.08, 2: 0.04, 3: 0.02 };
  const idNum = parseInt(planet.id) || 1;
  const radius = radii[ringIndex] + (idNum % 3) * 0.5 - 0.5; 
  const speed = speeds[ringIndex] + (idNum % 5) * 0.005 * (idNum % 2 === 0 ? 1 : -1);
  const yOffset = ((idNum % 5) - 2) * 0.8;
  return { radius, speed, yOffset };
};

// Renamed from getEntropyState for user readability
const getGoalStatus = (planet, futureDays = 0) => {
  if (!planet || !planet.updated_at) return { isAtRisk: false, isHealthy: true, sizeMultiplier: 1 };
  
  const lastUpdate = new Date(planet.updated_at).getTime();
  const hoursSinceRealUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60);
  const simulatedHours = hoursSinceRealUpdate + (futureDays * 24);
  const isCurrentlyActive = hoursSinceRealUpdate < 24;
  
  let isAtRisk = simulatedHours > 48;
  let isHealthy = simulatedHours < 24;
  let sizeMultiplier = 1;
  
  if (futureDays > 0) {
      if (isCurrentlyActive) { isAtRisk = false; isHealthy = true; sizeMultiplier = 1 + (futureDays * 0.05); } 
      else { isAtRisk = true; isHealthy = false; sizeMultiplier = Math.max(0.2, 1 - (futureDays * 0.05)); }
  }
  return { isAtRisk, isHealthy, sizeMultiplier };
};

// Renamed from SpatialWormhole
function DailyBonusPortal({ onClick }) {
    const ref = useRef();
    const [hovered, setHovered] = useState(false);
    
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.z -= delta * 2;
            ref.current.rotation.y += delta * 0.5;
        }
    });

    return (
        <group position={[35, 10, -30]}>
            <mesh ref={ref} onClick={(e) => { e.stopPropagation(); onClick(); }} onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor='pointer'; }} onPointerOut={() => { setHovered(false); document.body.style.cursor='auto'; }}>
                <torusGeometry args={[3, 0.8, 16, 100]} />
                <meshStandardMaterial color="#7f5cff" emissive="#a855f7" emissiveIntensity={hovered ? 8 : 4} wireframe />
                <pointLight color="#a855f7" intensity={5} distance={30} decay={2} />
            </mesh>
            {hovered && (
                <Html position={[0, -4, 0]} center style={{ pointerEvents: 'none' }}>
                    <div style={{ background: 'rgba(127, 92, 255, 0.8)', color: '#fff', padding: '5px 10px', borderRadius: '4px', fontFamily: 'monospace', border: '1px solid #a855f7', whiteSpace: 'nowrap', textTransform: 'uppercase', boxShadow: '0 0 20px #a855f7' }}>
                        Claim Daily Bonus
                    </div>
                </Html>
            )}
        </group>
    );
}

// Renamed from DataPrism
function RewardCrystal({ planetSize, color }) {
    const ref = useRef();
    useFrame((state, delta) => {
        if (!ref.current) return;
        ref.current.rotation.x += delta * 2;
        ref.current.rotation.y += delta * 2;
        const time = state.clock.elapsedTime;
        ref.current.position.y = Math.sin(time * 1.5) * (planetSize + 2.5);
        ref.current.position.z = Math.cos(time * 1.5) * (planetSize + 2.5);
    });
    return (
        <mesh ref={ref} onClick={(e) => { e.stopPropagation(); alert("Reward Crystal Collected!"); }}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} transparent opacity={0.9} />
        </mesh>
    );
}

// Renamed from ThreatAsteroid
function WarningMeteor({ planetSize, onDefend }) {
    const groupRef = useRef();
    const [isExploding, setIsExploding] = useState(false);
    const [scale, setScale] = useState(1);
    const [opacity, setOpacity] = useState(1);
    const distance = planetSize + 1.5;
    const speed = 2.5; 

    useFrame(({ clock }, delta) => {
        if (groupRef.current) { groupRef.current.rotation.y -= delta * speed; groupRef.current.rotation.z += delta * (speed / 2); }
        if (isExploding) { setScale(prev => prev + delta * 8); setOpacity(prev => Math.max(0, prev - delta * 3)); }
    });

    const handleInteract = (e) => { e.stopPropagation(); if (isExploding) return; setIsExploding(true); setTimeout(() => onDefend(), 400); };
    if (opacity === 0) return null;

    return (
        <group ref={groupRef} rotation={[Math.PI / 4, 0, 0]}>
            <mesh position={[distance, 0, 0]} onClick={handleInteract} scale={[scale, scale, scale]}>
                <icosahedronGeometry args={[0.4, 0]} />
                <meshStandardMaterial color="#ff003c" emissive="#ff003c" emissiveIntensity={isExploding ? 10 : 4} wireframe={isExploding} roughness={0.1} transparent opacity={opacity} />
            </mesh>
        </group>
    );
}

function HabitMoon({ index, total, planetSize, color, onComplete }) {
    const groupRef = useRef();
    const [completed, setCompleted] = useState(false);
    const [laserOpacity, setLaserOpacity] = useState(0);
    const angleOffset = (index / total) * Math.PI * 2;
    const distance = planetSize + 2.5 + (index * 0.8); 
    const speed = 1.5 + (index * 0.2); 

    useFrame(({ clock }, delta) => {
        if (groupRef.current) groupRef.current.rotation.y += delta * speed;
        if (laserOpacity > 0) setLaserOpacity(prev => Math.max(0, prev - delta * 2));
    });

    const handleInteract = (e) => { e.stopPropagation(); if (completed) return; setCompleted(true); setLaserOpacity(1); onComplete(); };

    return (
        <group ref={groupRef} rotation={[0, angleOffset, 0]}>
            <mesh position={[distance, 0, 0]} onClick={handleInteract}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color={completed ? color : '#374151'} emissive={completed ? color : '#000000'} emissiveIntensity={completed ? 6 : 0} roughness={completed ? 0.2 : 0.9} />
            </mesh>
            {laserOpacity > 0 && (
                <mesh rotation={[0, 0, Math.PI / 2]} position={[distance / 2, 0, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, distance, 8]} />
                    <meshBasicMaterial color={color} transparent opacity={laserOpacity} />
                </mesh>
            )}
        </group>
    );
}

// Renamed from SynergyLines
function ConnectionLines({ links, planets, orbitMappings, timePaused }) {
    const linesRef = useRef([]);
    useFrame(({ clock }) => {
        if (timePaused) return; 
        const t = clock.getElapsedTime();
        links.forEach((link, idx) => {
            const p1 = planets.find(p => p.id === link.source);
            const p2 = planets.find(p => p.id === link.target);
            if (p1 && p2 && linesRef.current[idx] && linesRef.current[idx].geometry) {
                const o1 = getOrbitData(p1, orbitMappings[p1.id] || 2);
                const o2 = getOrbitData(p2, orbitMappings[p2.id] || 2);
                const pos1 = new THREE.Vector3(Math.cos(t * o1.speed) * o1.radius, o1.yOffset, Math.sin(t * o1.speed) * o1.radius);
                const pos2 = new THREE.Vector3(Math.cos(t * o2.speed) * o2.radius, o2.yOffset, Math.sin(t * o2.speed) * o2.radius);
                
                linesRef.current[idx].geometry.setPositions([pos1.x, pos1.y, pos1.z, pos2.x, pos2.y, pos2.z]);
                if (linesRef.current[idx].material) {
                    linesRef.current[idx].material.dashOffset -= 0.05;
                }
            }
        });
    });
    
    return (
        <group>
            {links.map((link, idx) => {
                const p1 = planets.find(p => p.id === link.source);
                const p2 = planets.find(p => p.id === link.target);
                
                if (!p1 || !p2) return null; 

                return (
                    <Line 
                        key={idx} 
                        ref={(el) => linesRef.current[idx] = el} 
                        points={[[0,0,0], [0,0,0]]} 
                        color={p1 ? getPlanetColor(p1) : "#00ffe7"} 
                        lineWidth={4} 
                        transparent 
                        opacity={0.8} 
                        dashed={true}
                        dashScale={20}
                        dashSize={4}
                        dashOffset={0}
                    />
                );
            })}
        </group>
    );
}

function CameraController({ activePlanet, orbitMappings, controlsRef, mode, isBonusPortalActive }) {
  useFrame((state) => {
    if (!controlsRef.current) return;
    const t = state.clock.getElapsedTime();
    let targetPos = new THREE.Vector3(0, 0, 0); 
    let camPos = new THREE.Vector3(0, 40, 70); 

    if (isBonusPortalActive) {
        targetPos.set(35, 10, -30);
        camPos.set(35, 15, -10);
    } else if (activePlanet && activePlanet.id && mode === 'explore') {
      const { radius, speed, yOffset } = getOrbitData(activePlanet, orbitMappings[activePlanet.id] || 2);
      const x = Math.cos(t * speed) * radius;
      const z = Math.sin(t * speed) * radius;
      targetPos.set(x, yOffset, z);
      camPos.set(x + 6, yOffset + 3, z + 10); 
    } else if (activePlanet && activePlanet.isSun && mode === 'explore') {
      camPos.set(0, 8, 20); targetPos.set(0, 0, 0);
    } else if (mode === 'link' || mode === 'simulate' || mode === 'prioritize') {
      camPos = new THREE.Vector3(25, 45, 70); 
      targetPos.set(25, 0, 0); 
    }
    
    state.camera.position.lerp(camPos, 0.04);
    controlsRef.current.target.lerp(targetPos, 0.04);
  });
  return null;
}

// Renamed from CinematicSun
function CentralCore({ level, onClick }) {
  const ref = useRef();
  const diskRef = useRef();

  useFrame(({ clock }, delta) => { 
      if (ref.current) ref.current.rotation.y -= delta * 0.2; 
      if (diskRef.current) diskRef.current.rotation.z -= delta * 1.5; 
  });

  const fbx = useFBX("/planets/UnstableStar.fbx");
  const texture = useTexture("/planets/suncyl1.jpg");
  const clonedFbx = useMemo(() => fbx.clone(), [fbx]);
  
  const isBlueGiant = level >= 10 && level < 25;
  const isBlackHole = level >= 25;
  const sunColor = isBlackHole ? "#000000" : (isBlueGiant ? "#00ffe7" : "#ffaa00");
  const glowColor = isBlackHole ? "#a855f7" : sunColor; 

  useMemo(() => {
    if (texture) texture.colorSpace = THREE.SRGBColorSpace;
    clonedFbx.traverse((child) => {
      if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({ 
              map: isBlackHole ? null : texture, color: isBlackHole ? "#000000" : "#ffffff",
              emissive: new THREE.Color(sunColor), emissiveIntensity: isBlackHole ? 0 : (isBlueGiant ? 5.0 : 4.0), emissiveMap: isBlackHole ? null : texture 
          });
      }
    });
  }, [clonedFbx, texture, isBlackHole, sunColor, isBlueGiant]);

  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onClick(); }} onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor='pointer'; }} onPointerOut={() => { document.body.style.cursor='auto'; }}>
      {isBlackHole ? (
          <group>
              <mesh><sphereGeometry args={[2.5, 32, 32]}/><meshBasicMaterial color="#000000" /></mesh>
              <mesh ref={diskRef} rotation={[Math.PI / 2.2, 0, 0]}><ringGeometry args={[2.8, 4.5, 64]} /><meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={8} side={THREE.DoubleSide} transparent opacity={0.9} /></mesh>
          </group>
      ) : (
          <primitive object={clonedFbx} scale={isBlueGiant ? 0.12 : 0.08} />
      )}
      <pointLight intensity={isBlackHole ? 1.5 : 4} color={glowColor} distance={250} decay={2} />
    </group>
  );
}

function OrbitWrapper({ planet, orbitRing, isActive, onClick, mode, futureDays, linkBase, pendingLink, goalLinks, onMoonComplete, onDefend, children }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false); 
  const color = getPlanetColor(planet); 
  const { radius, speed, yOffset } = getOrbitData(planet, orbitRing);
  const { isAtRisk } = getGoalStatus(planet, futureDays);
  
  const target = planet.target_xp || 1000;
  const current = planet.current_xp || 0;
  const progressRatio = Math.min(current / target, 1); 
  const baseSize = (planet.size * 0.1) + 0.5;

  useFrame(({ clock }) => {
    if (mode === 'link' || mode === 'prioritize') return; 
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.x = Math.cos(t * speed) * radius;
      ref.current.position.z = Math.sin(t * speed) * radius;
      ref.current.position.y = yOffset;
      ref.current.rotation.y += isAtRisk ? 0.002 : 0.01 + (progressRatio * 0.02); 
    }
  });

  const isLinkModeActive = mode === 'link' && linkBase;
  const isSource = linkBase && linkBase.id === planet.id;
  const isPendingTarget = pendingLink && pendingLink.id === planet.id;
  const isLinkedToSource = linkBase && goalLinks.some(t => (t.source === linkBase.id && t.target === planet.id) || (t.source === planet.id && t.target === linkBase.id));

  let displayTag = planet.name;
  if (isAtRisk) displayTag = `⚠️ AT RISK: ${planet.name}`;
  
  if (isLinkModeActive && !isSource) {
      if (isPendingTarget) {
          displayTag = `✅ CONFIRM CONNECTION`;
      } else if (hovered && !pendingLink) {
          displayTag = isLinkedToSource ? `❌ UNLINK ${planet.name}` : `🔗 LINK TO ${planet.name}`;
      }
  }

  const opacityMultiplier = (isLinkModeActive && !isSource && !isLinkedToSource && !isPendingTarget) ? 0.4 : 1;

  return (
    <group>
      <Ring args={[radius - 0.03, radius + 0.03, 64]} position={[0, yOffset, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={isAtRisk ? '#ef4444' : color} transparent opacity={(isActive ? 0.8 : (isAtRisk ? 0.2 : 0.3)) * opacityMultiplier} side={THREE.DoubleSide} />
      </Ring>
      
      <Trail width={isAtRisk ? 0.8 : 2.5} length={isAtRisk ? 3 : 10} color={isAtRisk ? '#ef4444' : color} attenuation={(t) => t * t}>
          <group 
            ref={ref} 
            onClick={(e) => { e.stopPropagation(); onClick(planet); }} 
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHovered(true); }} 
            onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
          >
            {children}
            {!isAtRisk && futureDays === 0 && <RewardCrystal planetSize={baseSize} color={color} />}
            {!isAtRisk && futureDays === 0 && Array.from({ length: 3 }).map((_, i) => (<HabitMoon key={`moon-${i}`} index={i} total={3} planetSize={baseSize} color={color} onComplete={() => onMoonComplete(planet)} />))}
            {isAtRisk && futureDays === 0 && <WarningMeteor planetSize={baseSize} onDefend={() => onDefend(planet)} />}
            
            <Html position={[0, 2.5, 0]} center style={{ pointerEvents: 'none', opacity: opacityMultiplier }}>
              <div 
                className={`planet-floating-tag ${(isActive || isSource || (hovered && isLinkModeActive && !pendingLink)) ? 'active-tag' : ''}`} 
                style={{ 
                    borderColor: isAtRisk ? '#ef4444' : color, 
                    background: (isActive || (hovered && isLinkModeActive && !pendingLink)) ? color : 'rgba(0,0,0,0.8)', 
                    color: (isActive || (hovered && isLinkModeActive && !pendingLink)) ? '#000' : (isAtRisk ? '#ff8a8a' : '#fff'), 
                    boxShadow: (isActive || isSource || isPendingTarget) ? `0 0 25px ${color}` : (isAtRisk ? '0 0 15px rgba(239,68,68,0.5)' : 'none'), 
                    animation: (isLinkModeActive && !isSource && !isLinkedToSource && !isPendingTarget) ? 'pulse-mic 1.5s infinite' : 'none',
                    transition: 'all 0.2s ease-in-out'
                }}
              >
                {displayTag}
              </div>
            </Html>
          </group>
      </Trail>
    </group>
  );
}

function PlanetOne({ planet }) {
  const ref = useRef();
  const { isAtRisk, isHealthy } = getGoalStatus(planet);
  const color = getPlanetColor(planet);
  const fbx = useFBX("/planets/crystle-planet.fbx");
  const texture = useTexture("/planets/crystal_planet7_Albedo2.jpg");
  const cloned = useMemo(() => fbx.clone(), [fbx]);
  
  useMemo(() => {
    if (texture) texture.colorSpace = THREE.SRGBColorSpace;
    cloned.traverse((child) => { 
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({ 
          map: isAtRisk ? null : texture, 
          color: isAtRisk ? "#450a0a" : "#ffffff", 
          emissive: isAtRisk ? "#ef4444" : color, 
          emissiveIntensity: isAtRisk ? 2.5 : (isHealthy ? 5.0 : 3.0), 
          roughness: isAtRisk ? 0.9 : 0.2, 
          transparent: true 
        }); 
      }
    });
  }, [cloned, texture, isAtRisk, isHealthy, color]);
  
  useFrame((state, delta) => { if (ref.current) ref.current.rotation.y += (isAtRisk ? 0.05 : (isHealthy ? 0.8 : 0.3)) * delta; });
  return (
    <group>
       <primitive ref={ref} object={cloned} scale={0.002} />
       <pointLight intensity={isAtRisk ? 1.5 : 4} color={isAtRisk ? "#ef4444" : color} distance={30} decay={2} />
    </group>
  );
}

function PlanetTwo({ planet }) {
  const ref = useRef();
  const { isAtRisk, isHealthy } = getGoalStatus(planet);
  const texture = useTexture("/planets/2k_neptune.jpg");
  if (texture) texture.colorSpace = THREE.SRGBColorSpace;
  
  useFrame((state, delta) => { if (ref.current) ref.current.rotation.y += (isAtRisk ? 0.05 : (isHealthy ? 0.8 : 0.3)) * delta; });
  
  return (
    <group>
        <mesh ref={ref}>
          <sphereGeometry args={[0.6, 64, 64]} />
          <meshStandardMaterial 
            map={isAtRisk ? null : texture} 
            color={isAtRisk ? "#450a0a" : "#ffffff"} 
            emissive={isAtRisk ? "#ef4444" : "#3b82f6"} 
            emissiveIntensity={isAtRisk ? 2.5 : (isHealthy ? 4.0 : 2.5)} 
            roughness={isAtRisk ? 0.9 : 0.3} 
          />
        </mesh>
        <pointLight intensity={isAtRisk ? 1.5 : 3.5} color={isAtRisk ? "#ef4444" : "#3b82f6"} distance={30} decay={2} />
    </group>
  );
}

function PlanetThree({ planet }) {
  const ref = useRef();
  const { isAtRisk, isHealthy } = getGoalStatus(planet);
  const color = getPlanetColor(planet); 
  
  useFrame((state, delta) => { if (ref.current) ref.current.rotation.y += (isAtRisk ? 0.05 : (isHealthy ? 0.8 : 0.3)) * delta; });
  
  return (
    <group>
        <mesh ref={ref}>
          <sphereGeometry args={[0.8, 64, 64]} />
          <meshStandardMaterial 
            color={isAtRisk ? "#450a0a" : color} 
            emissive={isAtRisk ? "#ef4444" : color} 
            emissiveIntensity={isAtRisk ? 3.0 : (isHealthy ? 6.0 : 4.0)} 
            roughness={isAtRisk ? 0.9 : 0.7} 
            wireframe={!isAtRisk} 
          />
        </mesh>
        <pointLight intensity={isAtRisk ? 1.5 : 4.5} color={isAtRisk ? "#ef4444" : color} distance={30} decay={2} />
    </group>
  );
}

function GenericPlanet({ planet, futureDays }) {
  const ref = useRef();
  const { isAtRisk, isHealthy, sizeMultiplier } = getGoalStatus(planet, futureDays);
  const color = getPlanetColor(planet);
  const progressRatio = Math.min((planet.current_xp || 0) / (planet.target_xp || 1000), 1); 
  const isHologram = progressRatio < 0.1;
  const isCompleted = progressRatio >= 1;
  const baseSize = (planet.size * 0.1) + 0.5;
  const simulatedSize = baseSize * sizeMultiplier;

  useFrame((state, delta) => { if (ref.current) ref.current.rotation.y += (isAtRisk ? 0.05 : (isHealthy ? 0.8 : 0.3)) * delta; });
  const finalColor = isAtRisk ? "#450a0a" : color;
  const finalEmissive = isAtRisk ? "#ef4444" : color;
  const finalIntensity = isAtRisk ? 2.5 : (isHealthy ? 5.5 + progressRatio : 3.5 + progressRatio);

  return (
    <group>
        <mesh ref={ref}>
          <sphereGeometry args={[simulatedSize, 32, 32]} />
          <meshStandardMaterial 
            color={finalColor} 
            emissive={finalEmissive} 
            emissiveIntensity={isCompleted ? 8 : finalIntensity} 
            roughness={isAtRisk ? 0.9 : 0.2} 
            wireframe={isHologram && !isAtRisk} 
            transparent={true} 
            opacity={isAtRisk ? 0.9 : (isHologram ? 0.7 : 1)} 
          />
        </mesh>
        <pointLight intensity={isAtRisk ? 1.5 : 4.0 * sizeMultiplier} color={finalEmissive} distance={35 * sizeMultiplier} decay={2} />
    </group>
  );
}

function SpaceScene({ planets, orbitMappings, level, activePlanet, onPlanetClick, onSunClick, onBackgroundClick, mode, hoveredRing, futureDays, goalLinks, linkBase, pendingLink, onMoonComplete, onDefend, onWormholeClick, isBonusPortalActive }) {
  const controlsRef = useRef();
  return (
    <Canvas camera={{ position: [0, 30, 60], fov: 45 }} onPointerMissed={onBackgroundClick}>
      <color attach="background" args={['#010204']} /> 
      <ambientLight intensity={0.8} color="#ffffff" /> 
      <Stars radius={150} depth={50} count={6000} factor={4} fade speed={1.5} />
      <CameraController activePlanet={activePlanet} orbitMappings={orbitMappings} controlsRef={controlsRef} mode={mode} isBonusPortalActive={isBonusPortalActive} />
      
      <group rotation={[-Math.PI / 2, 0, 0]}>
          <Ring args={[11.8, 12.2, 128]}>
              <meshBasicMaterial color="#ff003c" transparent opacity={mode === 'prioritize' ? (hoveredRing === 1 ? 0.8 : 0.2) : 0.15} side={THREE.DoubleSide} />
          </Ring>
          <Ring args={[19.8, 20.2, 128]}>
              <meshBasicMaterial color="#00ffe7" transparent opacity={mode === 'prioritize' ? (hoveredRing === 2 ? 0.8 : 0.15) : 0.1} side={THREE.DoubleSide} />
          </Ring>
          <Ring args={[27.8, 28.2, 128]}>
              <meshBasicMaterial color="#a855f7" transparent opacity={mode === 'prioritize' ? (hoveredRing === 3 ? 0.8 : 0.15) : 0.1} side={THREE.DoubleSide} />
          </Ring>
      </group>

      <Suspense fallback={null}>
        <CentralCore level={level} onClick={onSunClick} />
        <DailyBonusPortal onClick={onWormholeClick} />
        <ConnectionLines links={goalLinks} orbitMappings={orbitMappings} planets={planets} timePaused={mode === 'link' || mode === 'prioritize'} />
        {planets.map((planet, index) => (
          <OrbitWrapper key={planet.id} planet={planet} orbitRing={orbitMappings[planet.id] || 2} isActive={activePlanet?.id === planet.id} onClick={onPlanetClick} mode={mode} futureDays={futureDays} linkBase={linkBase} pendingLink={pendingLink} goalLinks={goalLinks} onMoonComplete={onMoonComplete} onDefend={onDefend}>
            {index === 0 ? <PlanetOne planet={planet} /> : index === 1 ? <PlanetTwo planet={planet} /> : index === 2 ? <PlanetThree planet={planet} /> : <GenericPlanet planet={planet} futureDays={futureDays} />}
          </OrbitWrapper>
        ))}
      </Suspense>
      <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.15} mipmapBlur intensity={mode==='simulate' ? 4.5 : 3.0} />
          {mode === 'simulate' && <Noise opacity={0.05} />} 
      </EffectComposer>
      <OrbitControls ref={controlsRef} enableZoom={true} enablePan={false} maxDistance={100} minDistance={5} makeDefault />
    </Canvas>
  );
}

export default function Universe3D() {
  const [planets, setPlanets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState(1);
  
  const [universeMode, setUniverseMode] = useState('explore'); 
  const [activePlanetData, setActivePlanetData] = useState(null); 
  
  const [hoveredRing, setHoveredRing] = useState(null);

  const [futureDays, setFutureDays] = useState(0); 
  const [isPlayingTime, setIsPlayingTime] = useState(false); 

  const [linkBase, setLinkBase] = useState(null); 
  const [pendingLink, setPendingLink] = useState(null); 
  const [goalLinks, setGoalLinks] = useState([]); 

  const [hudInput, setHudInput] = useState("");
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmitStatus, setTransmitStatus] = useState(null);

  const [isBonusPortalActive, setIsBonusPortalActive] = useState(false);
  const [bountyText, setBountyText] = useState("");
  const [isExplosionFlash, setIsExplosionFlash] = useState(false);

  const [orbitMappings, setOrbitMappings] = useState(() => JSON.parse(localStorage.getItem('hyperlife_orbits')) || {});

  const fetchData = useCallback(async () => {
    try {
      const statRes = await apiFetch(`/activity-stats`).catch(() => ({}));
      if (statRes && statRes.user_level) setLevel(statRes.user_level);

      const corePlanets = await apiFetch(`/planets`).catch(() => []);
      const customNodes = await apiFetch(`/forge/nodes`).catch(() => []);
      
      const safeCore = Array.isArray(corePlanets) ? corePlanets : (corePlanets.data || []);
      const safeCustom = Array.isArray(customNodes) ? customNodes.map(n => ({ ...n, type: 'Custom' })) : [];

      const merged = [...safeCore, ...safeCustom];
      setPlanets(merged);
      
      setActivePlanetData(prev => {
          if (prev && !prev.isSun) {
              const updated = merged.find(p => p.id === prev.id && p.type === prev.type);
              return updated || prev;
          }
          return prev;
      });
    } catch (err) { console.error("Universe offline.", err); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]); 

  useEffect(() => {
      let interval;
      if (isPlayingTime && universeMode === 'simulate') {
          interval = setInterval(() => {
              setFutureDays(prev => {
                  if (prev >= 30) {
                      setIsPlayingTime(false);
                      return 30;
                  }
                  return prev + 1;
              });
          }, 300); 
      }
      return () => clearInterval(interval);
  }, [isPlayingTime, universeMode]);

  const handleAbort = useCallback((e) => {
      if (e && e.stopPropagation) e.stopPropagation(); 
      if (e && e.preventDefault) e.preventDefault();
      setActivePlanetData(null); 
      setLinkBase(null); 
      setPendingLink(null); 
      setHoveredRing(null);
      setHudInput(""); 
      setTransmitStatus(null); 
      setIsBonusPortalActive(false);
      setIsPlayingTime(false);
  }, []);

  const handlePlanetClick = (planet) => {
      setIsBonusPortalActive(false);
      if (universeMode === 'explore' || universeMode === 'prioritize') { 
          setActivePlanetData(planet); setTransmitStatus(null); setHudInput(""); 
      } 
      else if (universeMode === 'link') {
          if (!linkBase) {
              setLinkBase(planet);
          } else {
              if (linkBase.id === planet.id) {
                  setLinkBase(null); 
                  setPendingLink(null);
                  return;
              }
              setPendingLink(planet);
          }
      }
  };

  const handleSunClick = () => {
      setIsBonusPortalActive(false);
      if (universeMode === 'explore') { setActivePlanetData({ isSun: true, name: 'Your Profile' }); setTransmitStatus(null); setHudInput(""); }
  };

  const assignOrbit = (planetId, ring) => {
      if (ring === 1) {
          const innerOrbitCount = Object.values(orbitMappings).filter(v => v === 1).length;
          if (innerOrbitCount >= 2 && orbitMappings[planetId] !== 1) {
              alert("Your High Priority orbit is full (Max 2 goals). Please demote another goal first."); return;
          }
      }
      const nextMappings = { ...orbitMappings, [planetId]: ring };
      setOrbitMappings(nextMappings); localStorage.setItem('hyperlife_orbits', JSON.stringify(nextMappings)); 
      
      setTransmitStatus({ type: 'success', text: `Orbit repositioned successfully.` });
      setTimeout(() => { setActivePlanetData(null); setHoveredRing(null); setTransmitStatus(null); }, 1500);
  };

  const handleMoonComplete = async (planet) => {
      try {
          const isLinked = goalLinks.some(t => t.source === planet.id || t.target === planet.id);
          let xpGained = isLinked ? 22 : 15; 
          if (orbitMappings[planet.id] === 1) xpGained = Math.floor(xpGained * 1.2); 
          
          await apiFetch(`/forge/inject-mass`, { 
            method: 'POST', 
            body: JSON.stringify({ id: planet.id, is_custom: planet.type === 'Custom', xp_gained: xpGained }) 
          });
          
          setTransmitStatus({ type: 'success', text: `⚡ Quick Task Done! +${xpGained} XP` }); 
          if (!activePlanetData) setActivePlanetData(planet); 
          fetchData(); 
          setTimeout(() => setTransmitStatus(null), 4000); 
      } catch (err) { console.error(err); }
  };

  const handleSaveStreak = async (planet) => {
      try {
          let xpGained = 25; 
          if (orbitMappings[planet.id] === 1) xpGained = Math.floor(xpGained * 1.2);
          
          await apiFetch(`/forge/inject-mass`, { 
            method: 'POST', 
            body: JSON.stringify({ id: planet.id, is_custom: planet.type === 'Custom', xp_gained: xpGained }) 
          });
          
          setTransmitStatus({ type: 'success', text: `🛡️ Streak Saved! +${xpGained} XP` }); 
          if (!activePlanetData) setActivePlanetData(planet); 
          fetchData(); 
          setTimeout(() => setTransmitStatus(null), 4000); 
      } catch (err) { console.error(err); }
  };

  const handleTransmitData = async () => {
      if (!hudInput.trim() || !activePlanetData || activePlanetData.isSun) return;
      setIsTransmitting(true); setTransmitStatus(null); 
      
      try {
          const aiData = await apiFetch(`/omni-process`, { 
            method: 'POST', 
            body: JSON.stringify({ telemetry_text: `[${activePlanetData.name} Sector]: ${hudInput}` }) 
          });
          
          let xpGained = aiData.gamification?.xp_gained || aiData.xp_gained || 15;
          const isLinked = goalLinks.some(t => t.source === activePlanetData.id || t.target === activePlanetData.id);
          if (isLinked) xpGained = Math.floor(xpGained * 1.5);
          if (orbitMappings[activePlanetData.id] === 1) xpGained = Math.floor(xpGained * 1.2); 
          
          await apiFetch(`/forge/inject-mass`, { 
            method: 'POST', 
            body: JSON.stringify({ id: activePlanetData.id, is_custom: activePlanetData.type === 'Custom', xp_gained: xpGained }) 
          });
          
          setTransmitStatus({ type: 'success', text: `⚡ +${xpGained} XP` }); 
          setHudInput(""); 
          fetchData(); 
          setTimeout(() => setTransmitStatus(null), 4000); 
      } catch (err) { setTransmitStatus({ type: 'error', text: 'Network Error.' }); } 
      finally { setIsTransmitting(false); }
  };

  const handleWormholeClick = async () => {
      setActivePlanetData(null); setIsBonusPortalActive(true); setBountyText("Checking for your Daily Reward...");
      try {
          const res = await fetch(`http://127.0.0.1:5000/predict`, { method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activities: [] }) });
          if (res.ok) { const data = await res.json(); setBountyText(data.insight); } 
          else setBountyText("Bonus currently unavailable. Please try again later.");
      } catch (err) { setBountyText("Connection failed."); }
  };

  const handleDeleteGoal = async () => {
      if (!activePlanetData || activePlanetData.isSun) return;
      const confirmMsg = `Are you sure you want to permanently delete your "${activePlanetData.name}" goal? The XP earned (${activePlanetData.current_xp || 0} XP) will be distributed to your other active goals.`;
      if (!window.confirm(confirmMsg)) return;

      const deletedXp = activePlanetData.current_xp || 0;
      const remainingPlanets = planets.filter(p => p.id !== activePlanetData.id);
      
      setIsExplosionFlash(true);
      
      try {
          const endpoint = activePlanetData.type === 'Custom' ? `/forge/nodes/${activePlanetData.id}` : `/planets/${activePlanetData.id}`;
          await apiFetch(endpoint, { method: "DELETE" });

          if (deletedXp > 0 && remainingPlanets.length > 0) {
              const sharedXp = Math.floor(deletedXp / remainingPlanets.length);
              for (let p of remainingPlanets) {
                  await apiFetch(`/forge/inject-mass`, { 
                    method: 'POST', 
                    body: JSON.stringify({ id: p.id, is_custom: p.type === 'Custom', xp_gained: sharedXp }) 
                  });
              }
              alert(`Goal deleted successfully. ${sharedXp} XP was distributed to your remaining goals.`);
          }
      } catch (err) { console.error("Deletion failed", err); }
      
      setTimeout(() => { setIsExplosionFlash(false); handleAbort(); fetchData(); }, 1500);
  };

  if (loading) return <div style={{ background: '#030407', height: '100vh', color: '#00ffe7', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading 3D Visualizer...</div>;
  const activePlanetDomainColor = getPlanetColor(activePlanetData);

  const highPriorityCount = Object.values(orbitMappings).filter(v => v === 1).length;

  return (
    <div className="universe-container">
      {isExplosionFlash && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#ffffff', zIndex: 9999, animation: 'supernovaFade 1.5s ease-out forwards', pointerEvents: 'none' }}>
              <style>{`@keyframes supernovaFade { 0% { opacity: 1; } 100% { opacity: 0; } }`}</style>
          </div>
      )}

      <div className="universe-canvas-wrapper" style={{ cursor: universeMode === 'link' ? 'crosshair' : 'default' }}>
        <SpaceScene 
            planets={planets} orbitMappings={orbitMappings} level={level} activePlanet={activePlanetData} 
            onPlanetClick={handlePlanetClick} onSunClick={handleSunClick} onBackgroundClick={handleAbort} 
            mode={universeMode} hoveredRing={hoveredRing} futureDays={futureDays} goalLinks={goalLinks} linkBase={linkBase} pendingLink={pendingLink}
            onMoonComplete={handleMoonComplete} onDefend={handleSaveStreak} 
            onWormholeClick={handleWormholeClick} isBonusPortalActive={isBonusPortalActive}
        />
      </div>

      <div className="god-mode-bar">
          <button className={`gm-btn ${universeMode === 'explore' ? 'active' : ''}`} onClick={() => { setUniverseMode('explore'); setFutureDays(0); setLinkBase(null); setPendingLink(null); setIsPlayingTime(false); setHoveredRing(null); }}>🌌 EXPLORE</button>
          <button className={`gm-btn ${universeMode === 'prioritize' ? 'active' : ''}`} onClick={() => { setUniverseMode('prioritize'); setFutureDays(0); setActivePlanetData(null); setLinkBase(null); setPendingLink(null); setIsPlayingTime(false); }}>🪐 SET PRIORITIES</button>
          <button className={`gm-btn ${universeMode === 'link' ? 'active' : ''}`} onClick={() => { setUniverseMode('link'); setFutureDays(0); setActivePlanetData(null); setIsPlayingTime(false); setHoveredRing(null); }}>🔗 LINK GOALS</button>
          <button className={`gm-btn ${universeMode === 'simulate' ? 'active' : ''}`} onClick={() => { setUniverseMode('simulate'); setLinkBase(null); setActivePlanetData(null); setPendingLink(null); setHoveredRing(null); }}>⏳ SIMULATE FUTURE</button>
      </div>

      {isBonusPortalActive && (
          <div className="oracle-hud" style={{ borderColor: '#7f5cff', boxShadow: '0 0 40px rgba(127,92,255,0.4)', background: 'rgba(10, 5, 20, 0.95)' }}>
              <h3 style={{ color: '#a855f7' }}>DAILY REWARD REVEALED</h3>
              <p style={{ color: '#fff', fontSize: '1rem', fontStyle: 'italic', margin: '20px 0' }}>"{bountyText}"</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={handleAbort} style={{ background: '#7f5cff', border: '1px solid #7f5cff', color: '#000', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold', textTransform: 'uppercase', transition: 'all 0.3s' }}>ACCEPT BONUS</button>
                  <button onClick={handleAbort} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold', textTransform: 'uppercase', transition: 'all 0.3s' }}>CLOSE</button>
              </div>
          </div>
      )}

      {universeMode === 'simulate' && !isBonusPortalActive && (
          <div className="oracle-hud" style={{ 
              borderColor: futureDays > 15 ? '#ef4444' : '#a855f7', 
              boxShadow: `0 0 40px ${futureDays > 15 ? 'rgba(239,68,68,0.3)' : 'rgba(168,85,247,0.2)'}`,
              transition: 'all 0.5s ease'
          }}>
              <h3 style={{ color: futureDays > 15 ? '#ef4444' : '#a855f7', transition: 'color 0.5s ease' }}>FUTURE SIMULATOR</h3>
              
              {futureDays === 0 ? (
                  <p style={{ color: '#fff', fontSize: '0.9rem', margin: '15px 0' }}>See what happens to your planets if you stop logging your habits.</p>
              ) : futureDays < 7 ? (
                  <p style={{ color: '#ffb86c', fontSize: '0.9rem', margin: '15px 0' }}>Warning: Your planets are losing energy. Streaks are at risk.</p>
              ) : futureDays < 20 ? (
                  <p style={{ color: '#ff5555', fontSize: '0.9rem', margin: '15px 0' }}>Critical: Multiple streaks are failing. Your goals need attention.</p>
              ) : (
                  <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: '15px 0', fontWeight: 'bold', textShadow: '0 0 10px red' }}>CRITICAL FAILURE. ALL STREAKS LOST.</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{color: '#8b92a5', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold'}}>Healthy Goals:</span>
                  <strong style={{color: '#fff', fontSize: '1.2rem'}}>
                      {planets.filter(p => !getGoalStatus(p, futureDays).isAtRisk).length} / {planets.length}
                  </strong>
              </div>

              <input 
                  type="range" min="0" max="30" value={futureDays} 
                  onChange={(e) => { setFutureDays(Number(e.target.value)); setIsPlayingTime(false); }} 
                  className="oracle-slider" 
                  style={{ 
                      background: `linear-gradient(90deg, ${futureDays > 15 ? '#ef4444' : '#a855f7'} ${(futureDays/30)*100}%, rgba(255,255,255,0.1) ${(futureDays/30)*100}%)`,
                      transition: 'background 0.5s ease'
                  }} 
              />
              
              <div className="oracle-days" style={{ 
                  color: futureDays > 15 ? '#ef4444' : '#a855f7', 
                  textShadow: `0 0 20px ${futureDays > 15 ? '#ef4444' : '#a855f7'}`,
                  transition: 'all 0.5s ease'
              }}>
                  +{futureDays} Days
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                  <button 
                      onClick={() => {
                          if (futureDays >= 30 && !isPlayingTime) setFutureDays(0);
                          setIsPlayingTime(!isPlayingTime);
                      }} 
                      style={{ 
                          background: isPlayingTime ? 'transparent' : (futureDays > 15 ? 'rgba(239,68,68,0.2)' : 'rgba(168,85,247,0.2)'), 
                          border: `1px solid ${futureDays > 15 ? '#ef4444' : '#a855f7'}`, 
                          color: futureDays > 15 ? '#ef4444' : '#a855f7', 
                          padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flex: 1 
                      }}
                  >
                      {isPlayingTime ? '⏸ PAUSE' : '▶ AUTO-PLAY'}
                  </button>
                  <button 
                      onClick={() => { setFutureDays(0); setIsPlayingTime(false); }} 
                      style={{ background: 'transparent', border: '1px solid #8b92a5', color: '#8b92a5', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}
                  >
                      ↺ RESET
                  </button>
              </div>
          </div>
      )}

      {universeMode === 'link' && !isBonusPortalActive && (
          <div className="weave-hud" style={{ borderColor: '#00ffe7', boxShadow: '0 0 40px rgba(0,255,231,0.2)' }}>
              <h3 style={{ color: '#00ffe7' }}>LINKED GOALS</h3>
              
              {!linkBase ? (
                  <>
                      <p style={{ color: '#fff', fontSize: '1rem', margin: '15px 0' }}>Step 1: Select your main goal.</p>
                      <p style={{ color: '#8b92a5', fontSize: '0.85rem' }}>Linked goals earn a 1.5x point multiplier when completed together.</p>
                  </>
              ) : !pendingLink ? (
                  <>
                      <p style={{ color: '#fff', fontSize: '1rem' }}>Step 2: Select a second goal to link it to.</p>
                      <div style={{ background: 'rgba(0,255,231,0.1)', border: '1px solid #00ffe7', padding: '10px', borderRadius: '8px', margin: '15px 0' }}>
                          <span style={{ color: '#8b92a5' }}>Main Goal:</span> <strong style={{ color: getPlanetColor(linkBase), textTransform: 'uppercase' }}>{linkBase.name}</strong>
                      </div>
                      <button onClick={() => { setLinkBase(null); setPendingLink(null); }} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}>CANCEL</button>
                  </>
              ) : (
                  <>
                      <p style={{ color: '#fff', fontSize: '1rem' }}>Confirm Connection</p>
                      <div style={{ background: 'rgba(0,255,231,0.1)', border: '1px solid #00ffe7', padding: '15px 10px', borderRadius: '8px', margin: '15px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <strong style={{ color: getPlanetColor(linkBase), fontSize: '1.1rem' }}>{linkBase.name}</strong>
                          <span style={{color: '#8b92a5', fontSize: '0.85rem', fontWeight: 'bold'}}>
                              {goalLinks.some(t => (t.source === linkBase.id && t.target === pendingLink.id) || (t.source === pendingLink.id && t.target === linkBase.id)) ? '⬇️ UNLINK FROM ⬇️' : '⬇️ LINK TO ⬇️'}
                          </span>
                          <strong style={{ color: getPlanetColor(pendingLink), fontSize: '1.1rem' }}>{pendingLink.name}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button onClick={() => {
                              const isExisting = goalLinks.findIndex(t => (t.source === linkBase.id && t.target === pendingLink.id) || (t.source === pendingLink.id && t.target === linkBase.id));
                              if (isExisting >= 0) {
                                  setGoalLinks(prev => prev.filter((_, i) => i !== isExisting));
                              } else {
                                  setGoalLinks(prev => [...prev, { source: linkBase.id, target: pendingLink.id }]);
                              }
                              setLinkBase(null);
                              setPendingLink(null);
                          }} style={{ background: '#00ffe7', border: 'none', color: '#000', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold', textTransform: 'uppercase' }}>CONFIRM</button>
                          
                          <button onClick={() => setPendingLink(null)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}>CANCEL</button>
                      </div>
                  </>
              )}

              {goalLinks.length > 0 && !pendingLink && (
                  <div style={{ marginTop: '20px', textAlign: 'left', background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <h4 style={{ color: '#8b92a5', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>Active Connections</h4>
                      {goalLinks.map((t, idx) => {
                          const p1 = planets.find(p => p.id === t.source);
                          const p2 = planets.find(p => p.id === t.target);
                          if (!p1 || !p2) return null;
                          return (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                  <span><span style={{color: getPlanetColor(p1)}}>{p1.name}</span> 🔗 <span style={{color: getPlanetColor(p2)}}>{p2.name}</span></span>
                                  <button onClick={() => setGoalLinks(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer', borderRadius: '4px', padding: '4px 8px' }}>X</button>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>
      )}

      {universeMode === 'prioritize' && !isBonusPortalActive && (
          <div className="weave-hud" style={{ 
              borderColor: activePlanetData ? getPlanetColor(activePlanetData) : '#ff003c', 
              boxShadow: `0 0 40px ${activePlanetData ? getPlanetColor(activePlanetData) : '#ff003c'}40`,
              transition: 'all 0.3s ease'
          }}>
              <h3 style={{ color: activePlanetData ? getPlanetColor(activePlanetData) : '#ff003c', transition: 'color 0.3s ease' }}>SET PRIORITIES</h3>
              
              {!activePlanetData ? (
                  <>
                      <p style={{ color: '#fff', fontSize: '1rem', margin: '15px 0' }}>Select a goal to change its priority level.</p>
                      <p style={{ color: '#8b92a5', fontSize: '0.85rem' }}>High priority goals stay closer to the center and earn more XP.</p>
                  </>
              ) : (
                  <div>
                      <p style={{ color: '#fff', marginBottom: '15px' }}>
                          Moving Goal: <b style={{color: activePlanetDomainColor, fontSize: '1.2rem', textTransform: 'uppercase'}}>{activePlanetData.name}</b>
                      </p>
                      
                      {transmitStatus && transmitStatus.type === 'success' && (
                          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                              {transmitStatus.text}
                          </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          
                          <button 
                              onMouseEnter={() => setHoveredRing(1)} 
                              onMouseLeave={() => setHoveredRing(null)}
                              onClick={() => assignOrbit(activePlanetData.id, 1)} 
                              disabled={highPriorityCount >= 2 && (orbitMappings[activePlanetData.id] || 2) !== 1}
                              style={{ 
                                  position: 'relative', width: '100%', padding: '15px 12px', textAlign: 'left', overflow: 'hidden',
                                  background: (orbitMappings[activePlanetData.id] || 2) === 1 ? 'rgba(255,0,60,0.3)' : 'rgba(255,0,60,0.05)', 
                                  border: `1px solid ${(orbitMappings[activePlanetData.id] || 2) === 1 ? '#fff' : '#ff003c'}`, 
                                  color: '#fff', borderRadius: '8px', transition: 'all 0.2s',
                                  cursor: (highPriorityCount >= 2 && (orbitMappings[activePlanetData.id] || 2) !== 1) ? 'not-allowed' : 'pointer', 
                                  opacity: (highPriorityCount >= 2 && (orbitMappings[activePlanetData.id] || 2) !== 1) ? 0.5 : 1
                              }}
                          >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#ff003c' }}>🔥 High Priority</span>
                                  <span style={{ fontSize: '0.85rem', color: '#ff8a8a', fontWeight: 'bold' }}>{highPriorityCount}/2 Slots</span>
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#d1d5db', marginTop: '6px' }}>Earns 1.2x bonus XP</div>
                              {(orbitMappings[activePlanetData.id] || 2) === 1 && <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: '#ff003c', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>CURRENT</div>}
                          </button>

                          <button 
                              onMouseEnter={() => setHoveredRing(2)} 
                              onMouseLeave={() => setHoveredRing(null)}
                              onClick={() => assignOrbit(activePlanetData.id, 2)} 
                              style={{ 
                                  position: 'relative', width: '100%', padding: '15px 12px', textAlign: 'left',
                                  background: (orbitMappings[activePlanetData.id] || 2) === 2 ? 'rgba(0,255,231,0.3)' : 'rgba(0,255,231,0.05)', 
                                  border: `1px solid ${(orbitMappings[activePlanetData.id] || 2) === 2 ? '#fff' : '#00ffe7'}`, 
                                  color: '#fff', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' 
                              }}
                          >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#00ffe7' }}>⚖️ Normal Priority</span>
                                  <span style={{ fontSize: '0.85rem', color: '#8b92a5' }}>Unlimited Slots</span>
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#d1d5db', marginTop: '6px' }}>Standard XP</div>
                              {(orbitMappings[activePlanetData.id] || 2) === 2 && <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: '#00ffe7', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>CURRENT</div>}
                          </button>

                          <button 
                              onMouseEnter={() => setHoveredRing(3)} 
                              onMouseLeave={() => setHoveredRing(null)}
                              onClick={() => assignOrbit(activePlanetData.id, 3)} 
                              style={{ 
                                  position: 'relative', width: '100%', padding: '15px 12px', textAlign: 'left',
                                  background: (orbitMappings[activePlanetData.id] || 2) === 3 ? 'rgba(168,85,247,0.3)' : 'rgba(168,85,247,0.05)', 
                                  border: `1px solid ${(orbitMappings[activePlanetData.id] || 2) === 3 ? '#fff' : '#a855f7'}`, 
                                  color: '#fff', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' 
                              }}
                          >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#a855f7' }}>🌌 Low Priority</span>
                                  <span style={{ fontSize: '0.85rem', color: '#8b92a5' }}>Unlimited Slots</span>
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#d1d5db', marginTop: '6px' }}>Casual goals on standby</div>
                              {(orbitMappings[activePlanetData.id] || 2) === 3 && <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: '#a855f7', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>CURRENT</div>}
                          </button>

                      </div>
                      
                      <button onClick={() => { setActivePlanetData(null); setHoveredRing(null); }} style={{ marginTop: '20px', background: 'transparent', border: '1px solid #8b92a5', color: '#8b92a5', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold', width: '100%' }}>CANCEL</button>
                  </div>
              )}
          </div>
      )}

      {/* SUN HUD */}
      {activePlanetData && activePlanetData.isSun && universeMode === 'explore' && !isBonusPortalActive && (
        <div className="hud-overlay" style={{ borderColor: level >= 25 ? '#a855f7' : (level >= 10 ? '#00ffe7' : '#ffaa00'), boxShadow: `0 10px 40px rgba(0,0,0,0.5), inset 0 0 20px ${level >= 25 ? '#a855f7' : (level >= 10 ? '#00ffe7' : '#ffaa00')}20` }} onPointerDown={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '1.8rem', color: level >= 25 ? '#a855f7' : (level >= 10 ? '#00ffe7' : '#ffaa00') }}>{activePlanetData.name}</h2>
            <span className="hud-badge" style={{ color: '#000', background: level >= 25 ? '#a855f7' : (level >= 10 ? '#00ffe7' : '#ffaa00') }}>Account Center</span>
            <div className="hud-progress-box" style={{ background: `rgba(${level >= 25 ? '168,85,247' : (level >= 10 ? '0,255,231' : '255,170,0')},0.1)`, border: `1px solid rgba(${level >= 25 ? '168,85,247' : (level >= 10 ? '0,255,231' : '255,170,0')},0.3)` }}>
                <h3 style={{color: '#fff', margin: '0 0 15px 0'}}>Your Overall Stats</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ color: '#8b92a5' }}>User Level</span><span style={{ fontWeight: 'bold', color: '#00ffe7' }}>Level {level}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ color: '#8b92a5' }}>Healthy Goals</span><span style={{ fontWeight: 'bold', color: '#10b981' }}>{planets.filter(p => !getGoalStatus(p).isAtRisk).length} / {planets.length}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ color: '#8b92a5' }}>Total Points Earned</span><span style={{ fontWeight: 'bold', color: '#a855f7' }}>{planets.reduce((acc, p) => acc + parseFloat(p.size), 0).toFixed(1)} Points</span></div>
            </div>
            <button onClick={handleAbort} style={{ background: 'transparent', border: 'none', color: '#8b92a5', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'monospace', textAlign: 'left', marginTop: '15px', padding: '5px 0' }}>[X] CLOSE WINDOW</button>
        </div>
      )}

      {/* PLANET HUD */}
      {activePlanetData && !activePlanetData.isSun && universeMode === 'explore' && !isBonusPortalActive && (
        <div className="hud-overlay" style={{ borderColor: getPlanetColor(activePlanetData), boxShadow: `0 10px 40px rgba(0,0,0,0.5), inset 0 0 20px ${getPlanetColor(activePlanetData)}20` }} onPointerDown={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '1.8rem' }}>{activePlanetData.name}</h2>
            <span className="hud-badge" style={{ color: getGoalStatus(activePlanetData).isAtRisk ? '#ef4444' : getPlanetColor(activePlanetData), border: `1px solid ${getGoalStatus(activePlanetData).isAtRisk ? '#ef4444' : 'transparent'}`, background: getGoalStatus(activePlanetData).isAtRisk ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.1)' }}>
                {getGoalStatus(activePlanetData).isAtRisk ? 'NEEDS ATTENTION' : `${getPlanetDomain(activePlanetData)} Goal`}
            </span>
            <div className="hud-progress-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ color: '#8b92a5', fontSize: '0.9rem' }}>Progress Points</span><span style={{ fontWeight: 'bold' }}>{Number(activePlanetData.size).toFixed(1)} Pts</span></div>
            </div>

            {transmitStatus && <div style={{ background: transmitStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${transmitStatus.type === 'success' ? '#10b981' : '#ef4444'}`, color: transmitStatus.type === 'success' ? '#10b981' : '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 'bold', animation: 'fadeIn 0.3s ease-out' }}>{transmitStatus.text}</div>}

            <div style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid rgba(255,255,255,0.1)`, padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                <p style={{ color: '#d1d5db', fontSize: '0.85rem', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Log Progress</p>
                <input type="text" value={hudInput} onChange={(e) => setHudInput(e.target.value)} placeholder={`What did you do for ${activePlanetData.name}?`} disabled={isTransmitting} style={{ width: '100%', background: 'rgba(0,0,0,0.8)', border: `1px solid ${getPlanetColor(activePlanetData)}50`, color: '#fff', padding: '10px', borderRadius: '4px', outline: 'none', fontFamily: 'monospace' }} />
                <button onClick={handleTransmitData} disabled={isTransmitting || !hudInput.trim()} style={{ width: '100%', marginTop: '10px', background: isTransmitting ? '#374151' : `${getPlanetColor(activePlanetData)}20`, border: `1px solid ${isTransmitting ? '#4b5563' : getPlanetColor(activePlanetData)}`, color: isTransmitting ? '#9ca3af' : getPlanetColor(activePlanetData), padding: '10px', borderRadius: '4px', cursor: isTransmitting ? 'not-allowed' : 'pointer', fontWeight: 'bold', textTransform: 'uppercase', transition: 'all 0.3s' }}>{isTransmitting ? "SAVING..." : "SAVE ACTIVITY"}</button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                <button onClick={handleAbort} style={{ background: 'transparent', border: 'none', color: '#8b92a5', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'monospace', padding: '5px 0' }}>[X] CLOSE WINDOW</button>
                <button onClick={handleDeleteGoal} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}>DELETE GOAL</button>
            </div>
        </div>
      )}
    </div>
  );
}