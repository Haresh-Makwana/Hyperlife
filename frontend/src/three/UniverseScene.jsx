import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture, useFBX } from "@react-three/drei";
import { useRef, useState, useEffect, Suspense, useMemo } from "react";
import * as THREE from "three";

// ==========================================
// 1️⃣ THE CENTRAL EARTH (Centerpiece)
// ==========================================
function CentralEarth() {
  const ref = useRef();
  
  useFrame(() => {
    if (ref.current) {
      // The Earth slowly spins on its axis
      ref.current.rotation.y += 0.002; 
    }
  });

  const fbx = useFBX("/planets/Earth.fbx");
  const texture = useTexture("/planets/1_earth_8k.jpg");

  const clonedFbx = useMemo(() => fbx.clone(), [fbx]);

  useMemo(() => {
    if (texture) texture.colorSpace = THREE.SRGBColorSpace;
    clonedFbx.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.8, 
          emissive: new THREE.Color("#ffffff"),
          emissiveIntensity: 0.2, // Soft glow so the 8k texture pops
          emissiveMap: texture,
          transparent: true
        });
      }
    });
  }, [clonedFbx, texture]);

  return (
    <group ref={ref}>
      {/* 🚀 FIXED: Increased scale from 0.01 to 0.025 to make it the massive center planet! */}
      <primitive object={clonedFbx} scale={0.025} />
      
      {/* Illuminates the orbiting planets */}
      <pointLight position={[0, 0, 0]} intensity={3} color="#ffffff" />
    </group>
  );
}

// ==========================================
// 2️⃣ THE FINANCE PLANET (Asset Node)
// ==========================================
function FinancePlanet({ planet, index, isSelected, onClick }) {
  const ref = useRef();
  const orbitDistance = 4 + index * 2;
  const speed = 0.2 + index * 0.05;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.x = Math.cos(t * speed) * orbitDistance;
      ref.current.position.z = Math.sin(t * speed) * orbitDistance;
      ref.current.rotation.y += 0.005; 
    }
  });

  const fbx = useFBX("/planets/finance.fbx");
  const texture = useTexture("/planets/finance.jpg");

  const clonedFbx = useMemo(() => fbx.clone(), [fbx]);

  useMemo(() => {
    if (texture) texture.colorSpace = THREE.SRGBColorSpace;
    clonedFbx.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.7,
          emissive: isSelected ? new THREE.Color("#00ffe7") : new THREE.Color("#000000"),
          emissiveIntensity: isSelected ? 0.3 : 0,
          transparent: true
        });
      }
    });
  }, [clonedFbx, texture, isSelected]);

  return (
    <group ref={ref} onClick={() => onClick(planet)}>
      <primitive object={clonedFbx} scale={(planet.size || 1) * 0.01} />
      {isSelected && (
        <mesh>
          <sphereGeometry args={[(planet.size || 1) + 0.15, 32, 32]} />
          <meshBasicMaterial color="#00ffe7" wireframe={true} transparent={true} opacity={0.25} />
        </mesh>
      )}
    </group>
  );
}

// ==========================================
// 3️⃣ THE HEALTH PLANET (Vitality Sphere)
// ==========================================
function HealthPlanet({ planet, index, isSelected, onClick }) {
  const ref = useRef();
  const orbitDistance = 4 + index * 2;
  const speed = 0.2 + index * 0.05;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.x = Math.cos(t * speed) * orbitDistance;
      ref.current.position.z = Math.sin(t * speed) * orbitDistance;
      ref.current.rotation.y += 0.005; 
    }
  });

  const textures = useTexture({
    map: "/planets/health_diff.png",
    normalMap: "/planets/health_normal.png",
    roughnessMap: "/planets/health_rough.png",
    emissiveMap: "/planets/health_emit.png"
  });

  if (textures.map) textures.map.colorSpace = THREE.SRGBColorSpace;

  return (
    <group ref={ref} onClick={() => onClick(planet)}>
      <mesh>
        <sphereGeometry args={[planet.size || 1, 64, 64]} />
        <meshStandardMaterial 
          map={textures.map}
          normalMap={textures.normalMap}
          roughnessMap={textures.roughnessMap}
          emissiveMap={textures.emissiveMap}
          roughness={1} 
          emissive={isSelected ? new THREE.Color("#00ffe7") : new THREE.Color("#ffffff")}
          emissiveIntensity={isSelected ? 0.3 : 1.5}
        />
      </mesh>
      {isSelected && (
        <mesh>
          <sphereGeometry args={[(planet.size || 1) + 0.15, 32, 32]} />
          <meshBasicMaterial color="#00ffe7" wireframe={true} transparent={true} opacity={0.25} />
        </mesh>
      )}
    </group>
  );
}

// ==========================================
// 4️⃣ THE KNOWLEDGE PLANET (Saturn LP)
// ==========================================
function KnowledgePlanet({ planet, index, isSelected, onClick }) {
  const ref = useRef();
  const orbitDistance = 4 + index * 2;
  const speed = 0.2 + index * 0.05;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.x = Math.cos(t * speed) * orbitDistance;
      ref.current.position.z = Math.sin(t * speed) * orbitDistance;
      ref.current.rotation.y += 0.002; 
    }
  });

  const fbx = useFBX("/planets/Saturn_LP.fbx");
  const texture = useTexture("/planets/8k_saturn.jpg");

  const clonedFbx = useMemo(() => fbx.clone(), [fbx]);

  useMemo(() => {
    if (texture) texture.colorSpace = THREE.SRGBColorSpace;
    clonedFbx.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.6,
          emissive: isSelected ? new THREE.Color("#00ffe7") : new THREE.Color("#000000"),
          emissiveIntensity: isSelected ? 0.3 : 0,
          transparent: true
        });
      }
    });
  }, [clonedFbx, texture, isSelected]);

  return (
    <group ref={ref} onClick={() => onClick(planet)}>
      <primitive object={clonedFbx} scale={(planet.size || 1) * 0.001} />
      
      {isSelected && (
        <mesh>
          <sphereGeometry args={[(planet.size || 1) + 0.3, 32, 32]} />
          <meshBasicMaterial color="#00ffe7" wireframe={true} transparent={true} opacity={0.25} />
        </mesh>
      )}
    </group>
  );
}

// ==========================================
// 5️⃣ MAIN SCENE
// ==========================================
export default function UniverseScene({ planets, onPlanetSelect, selectedPlanet }) {
  const [isZoomAllowed, setIsZoomAllowed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Control" || e.key === "Meta") setIsZoomAllowed(true); };
    const handleKeyUp = (e) => { if (e.key === "Control" || e.key === "Meta") setIsZoomAllowed(false); };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <Canvas camera={{ position: [0, 6, 14], fov: 50 }}>
      <ambientLight intensity={0.4} /> 
      <ambientLight intensity={0.2} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00ffe7" />

      <Stars radius={100} depth={50} count={6000} factor={4} />

      <Suspense fallback={null}>
        {/* Massive Earth in the Center */}
        <CentralEarth />

        {planets.map((p, i) => {
          const type = p.type?.toLowerCase();
          
          if (type === "finance") {
            return <FinancePlanet key={p.id} planet={p} index={i} isSelected={selectedPlanet?.id === p.id} onClick={onPlanetSelect} />;
          } 
          else if (type === "health") {
            return <HealthPlanet key={p.id} planet={p} index={i} isSelected={selectedPlanet?.id === p.id} onClick={onPlanetSelect} />;
          } 
          else {
            return <KnowledgePlanet key={p.id} planet={p} index={i} isSelected={selectedPlanet?.id === p.id} onClick={onPlanetSelect} />;
          }
        })}
      </Suspense>

      <OrbitControls enablePan={true} enableRotate={true} enableZoom={isZoomAllowed} />
    </Canvas>
  );
}