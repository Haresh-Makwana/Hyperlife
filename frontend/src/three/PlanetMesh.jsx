import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function PlanetMesh({ planet }) {
  const ref = useRef();

  const radius = Number(planet.position_x) || 5;
  const speed = 0.2 + (planet.id % 5) * 0.05;

  useFrame(({ clock }) => {
    if (!ref.current) return; // 🔑 CRITICAL FIX

    const t = clock.getElapsedTime() * speed;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[Math.max(planet.size / 10, 0.6), 32, 32]} />
      <meshStandardMaterial color="#ffaa00" />
    </mesh>
  );
}
