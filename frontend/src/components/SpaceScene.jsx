import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import Planet from "./Planet";

function SpaceScene() {
  return (
    <Canvas camera={{ position: [0, 0, 10] }}>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} />

      <Stars radius={100} depth={50} count={6000} factor={4} />

      {/* MAIN PLANET */}
      <Planet size={2.3} color="#7f5cff" />

      {/* ORBITING PLANETS */}
      <Planet size={0.9} distance={4} speed={0.6} color="#ff7ae6" />
      <Planet size={1.1} distance={6} speed={0.3} color="#00ffe7" />
      <Planet size={0.7} distance={8} speed={0.2} color="#ffd166" />

      <OrbitControls enableZoom={false} />
    </Canvas>
  );
}
