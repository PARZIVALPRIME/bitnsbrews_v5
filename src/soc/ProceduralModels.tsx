import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { TransistorFlowShader } from "./shaders";

const AMBER = "#e8a23a";
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
   2. SYSTEM MOTHERBOARD PCB (Level 2)
   ========================================================================= */
export function MotherboardPCB({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <group position={[0, -1.8, 0]}>
      {/* Main Board Base */}
      <mesh receiveShadow>
        <boxGeometry args={[32, 0.4, 28]} />
        <meshStandardMaterial color="#0b1016" metalness={0.5} roughness={0.7} />
        <Edges threshold={15}>
          <lineBasicMaterial color="#1e2c3c" />
        </Edges>
      </mesh>

      {/* PCB Trace Pattern Lines */}
      {[-8, -4, 0, 4, 8].map((x, i) => (
        <mesh key={i} position={[x, 0.21, 0]}>
          <boxGeometry args={[0.08, 0.01, 22]} />
          <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={0.25} />
        </mesh>
      ))}
      {[-6, -2, 2, 6].map((z, i) => (
        <mesh key={i} position={[0, 0.21, z]}>
          <boxGeometry args={[26, 0.01, 0.08]} />
          <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={0.25} />
        </mesh>
      ))}

      {/* Capacitors and Power Inductors */}
      {[-12, 12].map((x) =>
        [-10, 0, 10].map((z, idx) => (
          <group key={`${x}-${z}-${idx}`} position={[x, 0.6, z]}>
            {/* Cylinder body */}
            <mesh castShadow>
              <cylinderGeometry args={[0.8, 0.8, 1.2, 12]} />
              <meshStandardMaterial {...metalMat("#3a3e47", 0.2, 0.95)} />
            </mesh>
            {/* Top stripe */}
            <mesh position={[0, 0.61, 0]}>
              <cylinderGeometry args={[0.79, 0.79, 0.08, 12]} />
              <meshStandardMaterial color={AMBER} />
            </mesh>
          </group>
        ))
      )}

      {/* VRM Inductor Blocks (glowing cubes) */}
      {[-8, -6, -4, 4, 6, 8].map((x, i) => (
        <mesh key={i} position={[x, 0.45, -11]} castShadow>
          <boxGeometry args={[1.2, 0.6, 1.2]} />
          <meshStandardMaterial color="#161a22" roughness={0.8} metalness={0.2} />
          <Edges threshold={15}>
            <lineBasicMaterial color={AMBER} transparent opacity={0.5} />
          </Edges>
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================================
   3. BGA PACKAGE SUBSTRATE (Level 3)
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

      {/* Realistic 3D SMD Capacitors */}
      {capacitors.map((cap, i) => (
        <group key={`cap-${i}`} position={[cap.x, -0.6, cap.z]} rotation={[0, cap.rot, 0]}>
          {/* Ceramic Body - brownish-grey matte dielectric block */}
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.22, 0.36]} />
            <meshStandardMaterial 
              color="#7c6f62" 
              roughness={0.65} 
              metalness={0.1} 
              transparent 
              opacity={opacity} 
            />
          </mesh>
          {/* Left Solder Cap - high-gloss metallic silver */}
          <mesh position={[-0.23, 0.002, 0]} castShadow>
            <boxGeometry args={[0.12, 0.23, 0.38]} />
            <meshStandardMaterial 
              color="#c0c0c0" 
              metalness={0.95} 
              roughness={0.1} 
              transparent 
              opacity={opacity} 
            />
          </mesh>
          {/* Right Solder Cap - high-gloss metallic silver */}
          <mesh position={[0.23, 0.002, 0]} castShadow>
            <boxGeometry args={[0.12, 0.23, 0.38]} />
            <meshStandardMaterial 
              color="#c0c0c0" 
              metalness={0.95} 
              roughness={0.1} 
              transparent 
              opacity={opacity} 
            />
          </mesh>
        </group>
      ))}

      {/* Golden Solder Micro-Balls grid */}
      {ballData.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.22, 10, 10]} />
          <meshStandardMaterial 
            color="#d4af37" 
            metalness={0.98} 
            roughness={0.12} 
            transparent 
            opacity={opacity} 
          />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================================
   4. INSTRUCTION PIPELINE STAGES (Level 7)
   ========================================================================= */
export function PipelineSimulation({
  active,
  blockCoords,
}: {
  active: boolean;
  blockCoords: { cx: number; cz: number; h: number } | null;
}) {
  const meshRef = useRef<THREE.Group>(null!);

  const stages = [
    { name: "Fetch", offset: -3.5, color: "#1c3a58" },
    { name: "Decode", offset: -2.5, color: "#182c44" },
    { name: "Rename", offset: -1.5, color: "#122030" },
    { name: "Dispatch", offset: -0.5, color: "#0c1420" },
    { name: "Issue", offset: 0.5, color: "#1a1020" },
    { name: "Execute", offset: 1.5, color: "#3a0d18" },
    { name: "Writeback", offset: 2.5, color: "#2d0a14" },
    { name: "Commit", offset: 3.5, color: "#1c060d" },
  ];

  // Animate instruction steps sliding through stages
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Cycle child instruction spheres/boxes
    const children = meshRef.current.children;
    for (let i = 1; i < children.length; i++) {
      const child = children[i] as THREE.Mesh;
      if (child.userData && child.userData.speed) {
        const offsetVal = ((time * child.userData.speed + child.userData.seed) % 8.0) - 4.0;
        child.position.x = offsetVal;
        
        // Add subtle bounce
        child.position.y = 0.28 + Math.abs(Math.sin(offsetVal * Math.PI)) * 0.12;
      }
    }
  });

  if (!active || !blockCoords) return null;
  const { cx, cz, h } = blockCoords;

  return (
    <group ref={meshRef} position={[cx, h + 1.2, cz]}>
      {/* Pipeline base grid deck */}
      <mesh receiveShadow>
        <boxGeometry args={[9.0, 0.15, 3.2]} />
        <meshStandardMaterial color="#020306" metalness={0.9} roughness={0.1} />
        <Edges threshold={15}>
          <lineBasicMaterial color={AMBER} transparent opacity={0.4} />
        </Edges>
      </mesh>

      {/* Render Stage dividers */}
      {stages.map((st, i) => (
        <group key={i} position={[st.offset, 0.08, 0]}>
          {/* Deck panel */}
          <mesh>
            <boxGeometry args={[0.96, 0.02, 3.0]} />
            <meshStandardMaterial color={st.color} roughness={0.6} />
            <Edges threshold={15}>
              <lineBasicMaterial color={AMBER} transparent opacity={0.15} />
            </Edges>
          </mesh>
        </group>
      ))}

      {/* Sliding Instruction Packets (animated via useFrame) */}
      {[0.4, 0.55, 0.7].map((speed, i) => (
        <mesh
          key={i}
          userData={{ speed, seed: i * 2.2 }}
          position={[0, 0.2, (i - 1) * 0.8]}
        >
          <boxGeometry args={[0.3, 0.2, 0.3]} />
          <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================================
   5. GAA NANOSHEET TRANSISTOR (Level 8)
   ========================================================================= */
export function GaaTransistorModel({
  active,
  blockCoords,
}: {
  active: boolean;
  blockCoords: { cx: number; cz: number; h: number } | null;
}) {
  const flowMatRef = useRef<THREE.ShaderMaterial>(null!);

  useFrame((state) => {
    if (flowMatRef.current) {
      flowMatRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const flowUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: 0.95 },
      uColor: { value: new THREE.Color(AMBER) },
    }),
    []
  );

  if (!active || !blockCoords) return null;
  const { cx, cz, h } = blockCoords;

  return (
    <group position={[cx, h + 1.4, cz]} scale={[0.85, 0.85, 0.85]}>
      {/* 3D Grid floor blueprint */}
      <gridHelper args={[8, 16, "#5a4422", "#221e16"]} position={[0, -0.7, 0]} />

      {/* Source (left block) */}
      <mesh position={[-2.2, 0, 0]} castShadow>
        <boxGeometry args={[1.0, 1.4, 1.6]} />
        <meshStandardMaterial {...metalMat("#2d3340", 0.3, 0.9)} />
        <Edges threshold={15}>
          <lineBasicMaterial color={AMBER} transparent opacity={0.4} />
        </Edges>
      </mesh>

      {/* Drain (right block) */}
      <mesh position={[2.2, 0, 0]} castShadow>
        <boxGeometry args={[1.0, 1.4, 1.6]} />
        <meshStandardMaterial {...metalMat("#2d3340", 0.3, 0.9)} />
        <Edges threshold={15}>
          <lineBasicMaterial color={AMBER} transparent opacity={0.4} />
        </Edges>
      </mesh>

      {/* 3x GAA Nanosheet Channels stack (horizontal bars between Source and Drain) */}
      {[0.4, 0.0, -0.4].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0]}>
          <boxGeometry args={[3.4, 0.16, 1.0]} />
          {/* Custom flow shader showing electrons moving through sheets */}
          <shaderMaterial
            ref={idx === 0 ? flowMatRef : undefined}
            vertexShader={TransistorFlowShader.vertexShader}
            fragmentShader={TransistorFlowShader.fragmentShader}
            uniforms={flowUniforms}
            transparent
          />
        </mesh>
      ))}

      {/* Gate Collar (vertical shell wrapping completely around nanosheets) */}
      <group position={[0, 0, 0]}>
        {/* Metal Gate Body */}
        <mesh castShadow>
          <boxGeometry args={[1.1, 1.6, 1.3]} />
          <meshStandardMaterial {...metalMat("#1e222d", 0.18, 0.96)} transparent opacity={0.35} />
          <Edges threshold={15}>
            <lineBasicMaterial color={AMBER} transparent opacity={0.85} />
          </Edges>
        </mesh>

        {/* High-k Oxide Inner Collar */}
        <mesh>
          <boxGeometry args={[1.2, 1.7, 1.4]} />
          <meshStandardMaterial color="#51c4d3" transparent opacity={0.15} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}
