import { useFBX } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

export default function CinematicModel({ url }) {
  const fbx = useFBX(url); 

  const processedScene = useMemo(() => {
    const clone = fbx.clone();

    clone.traverse((child) => {
      if (child.isMesh) {
        // Rips out the broken material and injects the dark aesthetic PBR material
        child.material = new THREE.MeshStandardMaterial({
          color: 0x1a1a1a,       
          roughness: 0.2,        
          metalness: 0.8,        
          envMapIntensity: 1.5,  
        });

        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return clone;
  }, [fbx]);

  return <primitive object={processedScene} />;
}