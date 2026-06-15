import * as THREE from "three";
import { useRef, useMemo, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";

const AMBER = "#c79a4e";
const STEEL = "#5e6977";

function metalMat(color: string, roughness = 0.3, metalness = 0.9) {
  return { color, roughness, metalness } as const;
}

/* =========================================================================
   1. COMPUTER CASING (Level 1)
   ========================================================================= */
export function ComputerCasing({ levelFloat }: { levelFloat: number }) {
  if (levelFloat > 2.0) return null;

  const progress = Math.max(0, Math.min(1, levelFloat - 1.0));
  const yOffset = -2 - progress * 13;
  const opacityMultiplier = Math.max(0, 1 - progress * 1.6); // Fades out earlier for a clean look

  return (
    <group position={[0, yOffset, 0]}>
      {/* Laptop Bottom Shell */}
      <mesh receiveShadow>
        <boxGeometry args={[44, 1.2, 38]} />
        <meshStandardMaterial 
          {...metalMat("#1a1c24", 0.35, 0.85)} 
          transparent 
          opacity={0.65 * opacityMultiplier} 
        />
        <Edges threshold={15}>
          <lineBasicMaterial color={STEEL} transparent opacity={0.4 * opacityMultiplier} />
        </Edges>
      </mesh>
      {/* Keyboard Well Outline */}
      <mesh position={[0, 0.61, -3]}>
        <boxGeometry args={[34, 0.02, 16]} />
        <meshStandardMaterial 
          color="#0c0d12" 
          roughness={0.65} 
          metalness={0.15} 
          transparent
          opacity={opacityMultiplier}
        />
        <Edges threshold={15}>
          <lineBasicMaterial color={AMBER} transparent opacity={0.25 * opacityMultiplier} />
        </Edges>
      </mesh>
      {/* Trackpad Outline */}
      <mesh position={[0, 0.61, 10]}>
        <boxGeometry args={[10, 0.02, 6]} />
        <meshStandardMaterial 
          color="#1f222c" 
          roughness={0.5} 
          metalness={0.6} 
          transparent
          opacity={opacityMultiplier}
        />
        <Edges threshold={15}>
          <lineBasicMaterial color={AMBER} transparent opacity={0.15 * opacityMultiplier} />
        </Edges>
      </mesh>
    </group>
  );
}

/* =========================================================================
   2. BGA PACKAGE SUBSTRATE (Level 3)
   ========================================================================= */
export function PackageSubstrate({ opacity = 1 }: { opacity?: number }) {
  const step = 1.4;
  const w = 26;
  const d = 22;

  // Render a nice grid of solder balls beneath the package
  const ballData = useMemo(() => {
    const balls = [];
    for (let x = -w / 2 + step; x < w / 2; x += step) {
      for (let z = -d / 2 + step; z < d / 2; z += step) {
        // Leave a hole in the center for the SoC die footprint (roughly 12x10)
        if (Math.abs(x) > 6.2 || Math.abs(z) > 5.2) {
          balls.push(new THREE.Vector3(x, -1.0, z));
        }
      }
    }
    return balls;
  }, []);

  // Gold substrate border rings (geometric concentric squares on the organic carrier)
  const borderRings = useMemo(() => {
    return [
      { w: 25.2, d: 21.2, y: -0.61 },
      { w: 18.0, d: 15.0, y: -0.61 },
    ];
  }, []);

  // Gold connector trace lines running from package edges towards the center
  const traces = useMemo(() => {
    return [
      { start: [-12.6, -0.605, -10.6], end: [-8.5, -0.605, -6.5] },
      { start: [12.6, -0.605, -10.6], end: [8.5, -0.605, -6.5] },
      { start: [-12.6, -0.605, 10.6], end: [-8.5, -0.605, 6.5] },
      { start: [12.6, -0.605, 10.6], end: [8.5, -0.605, 6.5] },
      { start: [0, -0.605, -10.6], end: [0, -0.605, -6.5] },
      { start: [0, -0.605, 10.6], end: [0, -0.605, 6.5] },
      { start: [-12.6, -0.605, 0], end: [-8.5, -0.605, 0] },
      { start: [12.6, -0.605, 0], end: [8.5, -0.605, 0] },
    ];
  }, []);

  // Coordinate positions for SMD micro-capacitors around the die
  const capacitors = useMemo(() => {
    return [
      { x: -6.6, z: -5.6, rot: 0 },
      { x: 6.6, z: -5.6, rot: 0 },
      { x: -6.6, z: 5.6, rot: 0 },
      { x: 6.6, z: 5.6, rot: 0 },
      { x: -7.2, z: -2.0, rot: Math.PI / 2 },
      { x: -7.2, z: 2.0, rot: Math.PI / 2 },
      { x: 7.2, z: -2.0, rot: Math.PI / 2 },
      { x: 7.2, z: 2.0, rot: Math.PI / 2 },
      { x: -2.8, z: -6.2, rot: 0 },
      { x: 2.8, z: -6.2, rot: 0 },
      { x: -2.8, z: 6.2, rot: 0 },
      { x: 2.8, z: 6.2, rot: 0 },
    ];
  }, []);

  return (
    <group>
      {/* Organic Substrate Core — Matte Charcoal Navy semiconductor carrier */}
      <mesh position={[0, -0.8, 0]} receiveShadow castShadow>
        <boxGeometry args={[w, 0.35, d]} />
        <meshStandardMaterial 
          color="#0b0e14" 
          metalness={0.85} 
          roughness={0.45} 
          transparent 
          opacity={opacity} 
        />
        <Edges threshold={15}>
          <lineBasicMaterial color="#d4af37" transparent opacity={0.65 * opacity} /> {/* Gold rim */}
        </Edges>
      </mesh>

      {/* Gold substrate border rings */}
      {borderRings.map((ring, idx) => (
        <mesh key={`ring-${idx}`} position={[0, ring.y, 0]}>
          <boxGeometry args={[ring.w, 0.005, ring.d]} />
          <meshStandardMaterial 
            color="#d4af37" 
            metalness={1.0} 
            roughness={0.1} 
            transparent 
            opacity={0.8 * opacity} 
          />
          <Edges threshold={15}>
            <lineBasicMaterial color="#ffffff" transparent opacity={0.25 * opacity} />
          </Edges>
        </mesh>
      ))}

      {/* Gold circuit traces */}
      {traces.map((trace, idx) => {
        const cx = (trace.start[0] + trace.end[0]) / 2;
        const cz = (trace.start[2] + trace.end[2]) / 2;
        const dx = trace.end[0] - trace.start[0];
        const dz = trace.end[2] - trace.start[2];
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);
        return (
          <mesh 
            key={`trace-${idx}`} 
            position={[cx, trace.start[1], cz]} 
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[len, 0.004, 0.08]} />
            <meshStandardMaterial 
              color="#d4af37" 
              metalness={0.95} 
              roughness={0.15} 
              transparent 
              opacity={0.7 * opacity} 
            />
          </mesh>
        );
      })}

      {/* Realistic 3D SMD Capacitors — instanced: 2 draw calls instead of 36 */}
      <InstancedCapacitors capacitors={capacitors} opacity={opacity} />

      {/* Golden Solder Micro-Balls grid — instanced: 1 draw call instead of ~200 */}
      <InstancedSolderBalls positions={ballData} opacity={opacity} />
    </group>
  );
}

function InstancedSolderBalls({ positions, opacity }: { positions: THREE.Vector3[]; opacity: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    positions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, positions.length]}>
      <sphereGeometry args={[0.22, 10, 10]} />
      <meshStandardMaterial color="#d4af37" metalness={0.98} roughness={0.12} transparent opacity={opacity} />
    </instancedMesh>
  );
}

function InstancedCapacitors({
  capacitors,
  opacity,
}: {
  capacitors: { x: number; z: number; rot: number }[];
  opacity: number;
}) {
  const bodyRef = useRef<THREE.InstancedMesh>(null!);
  const endRef = useRef<THREE.InstancedMesh>(null!);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    capacitors.forEach((cap, i) => {
      dummy.position.set(cap.x, -0.6, cap.z);
      dummy.rotation.set(0, cap.rot, 0);
      dummy.updateMatrix();
      bodyRef.current.setMatrixAt(i, dummy.matrix);

      // Two solder terminals at local x = ±0.23, rotated into place
      [-0.23, 0.23].forEach((off, j) => {
        const c = Math.cos(cap.rot);
        const s = Math.sin(cap.rot);
        dummy.position.set(cap.x + off * c, -0.598, cap.z - off * s);
        dummy.rotation.set(0, cap.rot, 0);
        dummy.updateMatrix();
        endRef.current.setMatrixAt(i * 2 + j, dummy.matrix);
      });
    });
    bodyRef.current.instanceMatrix.needsUpdate = true;
    endRef.current.instanceMatrix.needsUpdate = true;
  }, [capacitors]);

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, capacitors.length]}>
        <boxGeometry args={[0.55, 0.22, 0.36]} />
        <meshStandardMaterial color="#7c6f62" roughness={0.65} metalness={0.1} transparent opacity={opacity} />
      </instancedMesh>
      <instancedMesh ref={endRef} args={[undefined, undefined, capacitors.length * 2]}>
        <boxGeometry args={[0.12, 0.23, 0.38]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.95} roughness={0.1} transparent opacity={opacity} />
      </instancedMesh>
    </group>
  );
}
