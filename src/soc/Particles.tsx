import * as THREE from "three";
import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";

const ParticleShader = {
  vertexShader: `
    uniform float uTime;
    uniform vec3 uCameraPos;
    varying vec2 vUv;
    varying float vAlpha;

    // Pseudo-random generator
    float hash(float n) { 
      return fract(sin(n) * 43758.5453123); 
    }

    void main() {
      vUv = uv;
      
      // Get the base instance position from the translation column of the matrix
      vec3 instPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
      
      // Generate a unique seed per particle based on its position
      float seed = hash(instPos.x * 12.9898 + instPos.y * 78.233 + instPos.z * 4.1414);
      
      // Float drift offsets: sin/cos curves running at slightly different frequencies
      vec3 drift;
      drift.x = sin(uTime * (0.12 + seed * 0.08) + seed * 6.28) * 8.0;
      drift.y = cos(uTime * (0.10 + seed * 0.06) + seed * 6.28) * 6.0;
      drift.z = sin(uTime * (0.15 + seed * 0.10) + seed * 6.28) * 8.0;
      
      // Final world space position before billboarding
      vec3 worldPos = instPos + drift;
      
      // Standard cylinder/spherical billboarding:
      // Project the particle position into view space, then offset by plane vertices
      vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
      
      // Extract instance scaling
      float scale = length(vec3(instanceMatrix[0][0], instanceMatrix[0][1], instanceMatrix[0][2]));
      
      // Add the local quad coordinates directly in camera-facing space
      mvPosition.xy += position.xy * scale * 0.45;
      
      // Soft breathing pulse rate
      vAlpha = 0.15 + 0.85 * (0.5 + 0.5 * sin(uTime * (0.6 + seed * 0.4) + seed * 6.28));
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying float vAlpha;
    uniform vec3 uColor;

    void main() {
      // Draw a smooth radial gradient circle
      float dist = length(vUv - vec2(0.5));
      if (dist > 0.5) discard;
      
      // Soft edge interpolation
      float intensity = smoothstep(0.5, 0.05, dist);
      gl_FragColor = vec4(uColor, intensity * vAlpha * 0.35);
    }
  `
};

interface ParticlesProps {
  count?: number;
  color?: string;
  levelFloat: number;
}

export function Particles({ count = 400, color = "#c79a4e", levelFloat }: ParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const { camera } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCameraPos: { value: new THREE.Vector3() },
      uColor: { value: new THREE.Color(color) },
    }),
    [color]
  );

  // Initialize random particle positions in a box around the die
  useEffect(() => {
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      // Distribute particles in a volume: X[-25, 25], Y[0, 35], Z[-22, 22]
      const x = (Math.random() - 0.5) * 50;
      const y = Math.random() * 32 + 1;
      const z = (Math.random() - 0.5) * 44;
      dummy.position.set(x, y, z);
      
      // Random scale to vary particle sizes
      const size = 0.18 + Math.random() * 0.32;
      dummy.scale.set(size, size, size);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = time;
      matRef.current.uniforms.uCameraPos.value.copy(camera.position);
    }
  });

  // Fade out particles when zooming deep inside Level 5 (The Hub) to keep overlays readable
  const opacityMultiplier = Math.max(0, 1.0 - Math.max(0, levelFloat - 4.2) * 1.25);

  if (opacityMultiplier <= 0.001) return null;

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={ParticleShader.vertexShader}
        fragmentShader={ParticleShader.fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}
