import * as THREE from "three";
import { useMemo, useRef, useEffect, useState, memo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer, Edges, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
import { BLOCKS, DIE_W, DIE_D, SocMode, UTILIZATION } from "./data";
import { SocBlock } from "./SocBlock";

// Memoized: blocks only re-render when their own quantized props change, not on
// every levelFloat tick — the single biggest CPU saving during transitions.
const MemoSocBlock = memo(SocBlock);
import { TrafficNetwork } from "./Traffic";
import { getCameraParamsInterpolated, globalLevelState } from "./levelManager";
import { useQuality } from "./quality";
import { PowerRailShader } from "./shaders";
import { Particles } from "./Particles";
import {
  ComputerCasing,
  PackageSubstrate,
} from "./ProceduralModels";

// Physical copper-gold tone for metal interconnect (vias, buses, scribe rails).
const AMBER = "#c79a4e";

function getUtil(id: string, mode: SocMode): number {
  const table = UTILIZATION[id];
  return table ? table[mode] : 0.1;
}

const _viaGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.01, 6);
const _viaMat = new THREE.MeshStandardMaterial({
  color: "#d4af37",
  metalness: 0.9,
  roughness: 0.1,
  transparent: true,
});

function MicroViaGrid({ positions, opacity }: { positions: THREE.Vector3[]; opacity: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    positions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [positions, dummy]);

  useEffect(() => {
    _viaMat.opacity = 0.4 * opacity;
    _viaMat.needsUpdate = true;
  }, [opacity]);

  return <instancedMesh ref={ref} args={[_viaGeo, _viaMat, positions.length]} />;
}

interface BusSpec {
  start: number[];
  end: number[];
  color: string;
  width: number;
}

function InstancedBuses({ buses, opacity }: { buses: BusSpec[]; opacity: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    buses.forEach((bus, i) => {
      const dx = bus.end[0] - bus.start[0];
      const dz = bus.end[2] - bus.start[2];
      const len = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);
      dummy.position.set((bus.start[0] + bus.end[0]) / 2, bus.start[1], (bus.start[2] + bus.end[2]) / 2);
      dummy.rotation.set(0, -angle, 0);
      dummy.scale.set(len, 0.005, bus.width);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
      // Amber locals get a brighter tint to compensate for the lost emissive
      ref.current.setColorAt(i, col.set(bus.color === AMBER ? "#ffc868" : bus.color));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [buses]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, buses.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial metalness={0.9} roughness={0.2} transparent opacity={0.35 * opacity} />
    </instancedMesh>
  );
}

function DieInterconnects({ opacity }: { opacity: number }) {
  const isMobile = useQuality() === "mobile";
  const buses = useMemo(() => {
    const list = [];
    // Horizontal data buses
    for (let z = -7; z <= 7; z += 3.5) {
      list.push({ start: [-9.5, 0.015, z], end: [9.5, 0.015, z], color: "#d4af37", width: 0.035 });
    }
    // Vertical data buses
    for (let x = -9; x <= 9; x += 4.5) {
      list.push({ start: [x, 0.015, -7.5], end: [x, 0.015, 7.5], color: "#b87333", width: 0.025 });
    }

    // Fine local buses + corner tracks only on desktop — invisible at potato
    // quality anyway, and each one is a draw call.
    if (!isMobile) {
      // CPU to SLC local buses
      for (let i = -1.2; i <= 1.2; i += 0.4) {
        list.push({ start: [-2.5 + i, 0.016, -2.0], end: [-2.5 + i, 0.016, 2.0], color: AMBER, width: 0.018 });
      }
      // GPU to SLC local buses
      for (let i = -1.2; i <= 1.2; i += 0.4) {
        list.push({ start: [3.5 + i, 0.016, -2.0], end: [3.5 + i, 0.016, 2.0], color: AMBER, width: 0.018 });
      }

      // Diagonal corner tracks
      list.push({ start: [-8.0, 0.015, -6.0], end: [-6.0, 0.015, -4.0], color: "#d4af37", width: 0.025 });
      list.push({ start: [8.0, 0.015, -6.0], end: [6.0, 0.015, -4.0], color: "#d4af37", width: 0.025 });
      list.push({ start: [-8.0, 0.015, 6.0], end: [-6.0, 0.015, 4.0], color: "#d4af37", width: 0.025 });
      list.push({ start: [8.0, 0.015, 6.0], end: [6.0, 0.015, 4.0], color: "#d4af37", width: 0.025 });
    }

    return list;
  }, [isMobile]);

  return (
    <group>
      {/* All buses in one instanced draw call with per-instance color */}
      <InstancedBuses buses={buses} opacity={opacity} />

      {/* Grid of micro-vias on the die — single instanced draw call */}
      <MicroViaGrid
        positions={useMemo(() => {
          const list = [];
          for (let i = 0; i < 12; i++) {
            for (let j = 0; j < 10; j++) {
              const x = -10.0 + i * 1.8;
              const z = -8.0 + j * 1.7;
              if (Math.abs(x) < 1.0 && Math.abs(z) < 1.0) continue;
              list.push(new THREE.Vector3(x, 0.015, z));
            }
          }
          return list;
        }, [])}
        opacity={opacity}
      />
    </group>
  );
}

const _pinMat = new THREE.MeshStandardMaterial({
  color: "#c79a4e", // copper-gold
  emissive: "#c79a4e",
  emissiveIntensity: 0.8,
  metalness: 0.9,
  roughness: 0.15,
  transparent: true,
});

function DieIOPins({ dieW, dieD, opacity }: { dieW: number; dieD: number; opacity: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const pinGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    // Gull-wing profile shape: emerges horizontally, bends down, bends out for foot
    shape.moveTo(0, 0);
    shape.lineTo(0.3, 0);
    shape.lineTo(0.3, -0.35);
    shape.lineTo(0.5, -0.35);
    shape.lineTo(0.5, -0.43);
    shape.lineTo(0.2, -0.43);
    shape.lineTo(0.2, -0.08);
    shape.lineTo(0, -0.08);
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 0.14, // width of the pin along the die edge
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.01,
      bevelSegments: 2,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center(); // Center at [0, 0, 0]
    return geo;
  }, []);

  const pinsData = useMemo(() => {
    const list: { pos: THREE.Vector3; rot: THREE.Euler }[] = [];
    const step = 0.35; // dense step
    const yPos = -0.215; // aligns top face of pin with die top face (Y=0)
    const xOffset = 0.25; // centers the pin horizontally relative to the edge

    // Top edge (pointing towards -Z)
    for (let x = -dieW / 2 + 0.35; x <= dieW / 2 - 0.35; x += step) {
      list.push({
        pos: new THREE.Vector3(x, yPos, -dieD / 2 - xOffset),
        rot: new THREE.Euler(0, Math.PI / 2, 0),
      });
    }
    // Bottom edge (pointing towards +Z)
    for (let x = -dieW / 2 + 0.35; x <= dieW / 2 - 0.35; x += step) {
      list.push({
        pos: new THREE.Vector3(x, yPos, dieD / 2 + xOffset),
        rot: new THREE.Euler(0, -Math.PI / 2, 0),
      });
    }
    // Left edge (pointing towards -X)
    for (let z = -dieD / 2 + 0.35; z <= dieD / 2 - 0.35; z += step) {
      list.push({
        pos: new THREE.Vector3(-dieW / 2 - xOffset, yPos, z),
        rot: new THREE.Euler(0, Math.PI, 0),
      });
    }
    // Right edge (pointing towards +X)
    for (let z = -dieD / 2 + 0.35; z <= dieD / 2 - 0.35; z += step) {
      list.push({
        pos: new THREE.Vector3(dieW / 2 + xOffset, yPos, z),
        rot: new THREE.Euler(0, 0, 0),
      });
    }
    return list;
  }, [dieW, dieD]);

  useEffect(() => {
    pinsData.forEach((item, i) => {
      dummy.position.copy(item.pos);
      dummy.rotation.copy(item.rot);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [pinsData, dummy]);

  useEffect(() => {
    _pinMat.opacity = opacity;
    _pinMat.needsUpdate = true;
  }, [opacity]);

  return <instancedMesh ref={ref} args={[pinGeometry, _pinMat, pinsData.length]} />;
}

function RainbowDatastreams() {
  const quality = useQuality();
  const streamCount = quality === "mobile" ? 16 : 36;

  const packetRefs = useRef<THREE.Mesh[]>([]);
  const lineMatRefs = useRef<THREE.LineBasicMaterial[]>([]);
  const packetMatRefs = useRef<THREE.MeshStandardMaterial[]>([]);

  const colors = ["#ff007f", "#3b82f6", "#10b981", "#fbbf24", "#a855f7", "#ec4899", "#06b6d4", "#f97316"];

  const paths = useMemo(() => {
    const list = [];
    const dieW = DIE_W + 1.4;
    const dieD = DIE_D + 1.4;
    for (let i = 0; i < streamCount; i++) {
      const angle = (i / streamCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const startR = 25 + Math.random() * 8;
      const start = new THREE.Vector3(
        Math.cos(angle) * startR,
        6 + Math.random() * 6,
        Math.sin(angle) * startR
      );
      // target: die perimeter
      const endR_W = dieW / 2;
      const endR_D = dieD / 2;
      const end = new THREE.Vector3(
        Math.cos(angle) * endR_W,
        0.05,
        Math.sin(angle) * endR_D
      );
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.y += 4 + Math.random() * 5; // arched curve

      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      list.push({
        curve,
        color: colors[i % colors.length],
        speed: 0.85 + Math.random() * 0.7, // much faster
        offset: Math.random(),
        points: curve.getPoints(30),
      });
    }
    return list;
  }, [streamCount]);

  useFrame((state) => {
    const levelFloat = globalLevelState.current;
    const streamVisible = levelFloat <= 1.8;
    const opacityMultiplier = Math.max(0, 1.0 - (levelFloat - 1.0) * 1.55);

    // Update lines and packets visibility and opacity
    lineMatRefs.current.forEach((mat) => {
      if (mat) {
        mat.opacity = 0.08 * opacityMultiplier;
        mat.visible = streamVisible;
      }
    });

    packetMatRefs.current.forEach((mat) => {
      if (mat) {
        mat.opacity = opacityMultiplier;
        mat.emissiveIntensity = 100.0 * opacityMultiplier;
        mat.visible = streamVisible;
      }
    });

    if (!streamVisible) return;
    const time = state.clock.getElapsedTime();

    paths.forEach((path, i) => {
      const tVal = (time * path.speed + path.offset) % 1.0;
      const mesh = packetRefs.current[i];
      if (mesh) {
        path.curve.getPointAt(tVal, mesh.position);
      }
    });
  });

  return (
    <group>
      {paths.map((path, i) => (
        <group key={i}>
          {/* Thin semi-transparent path line */}
          <line>
            <bufferGeometry attach="geometry">
              <float32BufferAttribute
                attach="attributes-position"
                args={[new Float32Array(path.points.flatMap(p => [p.x, p.y, p.z])), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              ref={(el) => { if (el) lineMatRefs.current[i] = el; }}
              attach="material"
              color={path.color}
              transparent
              linewidth={1}
            />
          </line>

          {/* Glowing packet sphere */}
          <mesh
            ref={(el) => {
              if (el) packetRefs.current[i] = el;
            }}
          >
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshStandardMaterial
              ref={(el) => { if (el) packetMatRefs.current[i] = el; }}
              color={path.color}
              emissive={path.color}
              transparent
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* =========================================================================
   DIE SUBSTRATE & BASE
   ========================================================================= */
function Die({ visMode }: { visMode: string }) {
  const dieW = DIE_W + 1.4;
  const dieD = DIE_D + 1.4;
  const rail = 0.14;

  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const waferMatRef = useRef<THREE.MeshStandardMaterial>(null!);
  const waferEdgeMatRef = useRef<THREE.LineBasicMaterial>(null!);
  const inlayMatRef = useRef<THREE.MeshStandardMaterial>(null!);
  const borderMatRefs = useRef<THREE.MeshStandardMaterial[]>([]);

  useFrame((state) => {
    const levelFloat = globalLevelState.current;
    const chipProgress = Math.max(0, Math.min(1, levelFloat - 1.0));
    const opacity = 0.85 + 0.15 * chipProgress;

    // Update wafer body opacity
    if (waferMatRef.current) waferMatRef.current.opacity = opacity;
    if (waferEdgeMatRef.current) waferEdgeMatRef.current.opacity = (visMode === "logical" ? 0.8 : 0.35) * opacity;
    if (inlayMatRef.current) inlayMatRef.current.opacity = opacity;
    borderMatRefs.current.forEach((mat) => {
      if (mat) mat.opacity = opacity;
    });

    // Update global interconnect/pin materials' opacity
    _viaMat.opacity = 0.4 * opacity;
    _pinMat.opacity = opacity;

    if (visMode === "power" && matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const powerUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(AMBER) },
    }),
    []
  );

  return (
    <group>
      {/* Die slab — silicon wafer */}
      <mesh position={[0, -0.3, 0]} receiveShadow castShadow>
        <boxGeometry args={[dieW, 0.6, dieD]} />
        <meshStandardMaterial
          ref={waferMatRef}
          color={visMode === "logical" ? "#030408" : "#080c10"}
          metalness={visMode === "logical" ? 0.95 : 0.35}
          roughness={visMode === "logical" ? 0.25 : 0.75}
          transparent
        />
        <Edges threshold={15} scale={1.001}>
          <lineBasicMaterial ref={waferEdgeMatRef} color={AMBER} transparent />
        </Edges>
      </mesh>

      {/* Recessed inlay */}
      {visMode === "power" ? (
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[dieW - 0.3, dieD - 0.3]} />
          <shaderMaterial
            ref={matRef}
            vertexShader={PowerRailShader.vertexShader}
            fragmentShader={PowerRailShader.fragmentShader}
            uniforms={powerUniforms}
            transparent
          />
        </mesh>
      ) : (
        <>
          <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[dieW - 0.3, dieD - 0.3]} />
            <meshStandardMaterial
              ref={inlayMatRef}
              color="#060910"
              metalness={0.3}
              roughness={0.8}
              transparent
            />
          </mesh>
          <DieInterconnects opacity={1.0} />
        </>
      )}

      {/* Scribe-line amber border */}
      {[
        [0, 0.01, -dieD / 2 + rail / 2, dieW, 0.015, rail] as const,
        [0, 0.01, dieD / 2 - rail / 2, dieW, 0.015, rail] as const,
        [-dieW / 2 + rail / 2, 0.01, 0, rail, 0.015, dieD] as const,
        [dieW / 2 - rail / 2, 0.01, 0, rail, 0.015, dieD] as const,
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            ref={(el) => { if (el) borderMatRefs.current[i] = el; }}
            color={AMBER}
            emissive={AMBER}
            emissiveIntensity={visMode === "logical" ? 1.2 : 0.55}
            metalness={1}
            roughness={0.15}
            transparent
          />
        </mesh>
      ))}
      {/* Input Output pins at the edges of the die */}
      <DieIOPins dieW={dieW} dieD={dieD} opacity={1.0} />
    </group>
  );
}

/* =========================================================================
   CINEMATIC CAMERA SYSTEM
   ========================================================================= */
function CameraController({
  selectedBlockCoords,
  showPlayground,
}: {
  selectedBlockCoords: { cx: number; cz: number; h: number } | null;
  showPlayground?: boolean;
}) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(0, 1.5, 0));

  const mouse = useRef(new THREE.Vector2(0, 0));
  const parallax = useRef({ x: 0, y: 0 });

  const initialized = useRef(false);
  const posSpring = useRef({
    current: new THREE.Vector3(),
    target: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    stiffness: 85,
    damping: 18,
  });

  const targetSpring = useRef({
    current: new THREE.Vector3(),
    target: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    stiffness: 85,
    damping: 18,
  });

  // Pre-allocated scratch vectors to avoid per-frame allocations
  const _scratchPosDiff = useRef(new THREE.Vector3());
  const _scratchPosAccel = useRef(new THREE.Vector3());
  const _scratchPosVelScaled = useRef(new THREE.Vector3());
  
  const _scratchTargetDiff = useRef(new THREE.Vector3());
  const _scratchTargetAccel = useRef(new THREE.Vector3());
  const _scratchTargetVelScaled = useRef(new THREE.Vector3());
  
  const _scratchDriftVec = useRef(new THREE.Vector3());
  const _scratchFinalPos = useRef(new THREE.Vector3());
  const _scratchForward = useRef(new THREE.Vector3());
  const _scratchUp = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    if (showPlayground) return; // Yield complete camera control to OrbitControls!

    const levelFloat = globalLevelState.current;
    const time = state.clock.getElapsedTime();
    const dt = Math.min(0.03, delta);

    // Get camera params dynamically (returns static shared references, so we must copy/read immediately)
    const targetParams = getCameraParamsInterpolated(levelFloat, selectedBlockCoords);

    if (!initialized.current) {
      posSpring.current.current.copy(camera.position);
      posSpring.current.target.copy(targetParams.position);
      targetSpring.current.current.copy(targetParams.target);
      targetSpring.current.target.copy(targetParams.target);
      targetRef.current.copy(targetParams.target);
      initialized.current = true;
    }

    // Update spring targets
    posSpring.current.target.copy(targetParams.position);
    targetSpring.current.target.copy(targetParams.target);

    const pSpring = posSpring.current;
    const tSpring = targetSpring.current;

    const hasFocus = selectedBlockCoords !== null;
    const distToTargetPos = pSpring.current.distanceTo(pSpring.target);
    const distToTargetLook = tSpring.current.distanceTo(tSpring.target);
    
    // Direct-drive the camera position and target when not focusing a block to eliminate secondary spring lag.
    // Eases camera smoothly only when block focus is activated or settling back.
    const runSolver = hasFocus || 
                      distToTargetPos > 0.05 || 
                      distToTargetLook > 0.05 || 
                      pSpring.velocity.length() > 0.02 || 
                      tSpring.velocity.length() > 0.02;

    if (!runSolver) {
      pSpring.current.copy(targetParams.position);
      tSpring.current.copy(targetParams.target);
      pSpring.velocity.set(0, 0, 0);
      tSpring.velocity.set(0, 0, 0);
    } else {
      // Solve position spring in-place
      _scratchPosDiff.current.subVectors(pSpring.current, pSpring.target);
      _scratchPosAccel.current.copy(_scratchPosDiff.current).multiplyScalar(-pSpring.stiffness);
      _scratchPosVelScaled.current.copy(pSpring.velocity).multiplyScalar(pSpring.damping);
      _scratchPosAccel.current.sub(_scratchPosVelScaled.current);
      pSpring.velocity.addScaledVector(_scratchPosAccel.current, dt);
      pSpring.current.addScaledVector(pSpring.velocity, dt);

      // Solve target spring in-place
      _scratchTargetDiff.current.subVectors(tSpring.current, tSpring.target);
      _scratchTargetAccel.current.copy(_scratchTargetDiff.current).multiplyScalar(-tSpring.stiffness);
      _scratchTargetVelScaled.current.copy(tSpring.velocity).multiplyScalar(tSpring.damping);
      _scratchTargetAccel.current.sub(_scratchTargetVelScaled.current);
      tSpring.velocity.addScaledVector(_scratchTargetAccel.current, dt);
      tSpring.current.addScaledVector(tSpring.velocity, dt);

      // Snap position and target when very close to settle cleanly
      if (distToTargetPos < 0.005 && pSpring.velocity.length() < 0.01) {
        pSpring.current.copy(pSpring.target);
        pSpring.velocity.set(0, 0, 0);
      }
      if (distToTargetLook < 0.005 && tSpring.velocity.length() < 0.01) {
        tSpring.current.copy(tSpring.target);
        tSpring.velocity.set(0, 0, 0);
      }
    }

    // Subtle micro-breathing drift
    const driftX = Math.sin(time * 0.35) * 0.08;
    const driftY = Math.cos(time * 0.25) * 0.05;
    const driftZ = Math.sin(time * 0.45) * 0.08;

    // Mouse parallax offset (more intense when zoomed in at level >= 3)
    const intensity = levelFloat <= 1.8 ? 1.5 : 2.8;
    const targetPX = mouse.current.x * intensity;
    const targetPY = mouse.current.y * intensity;
    
    // Smoothly ease the parallax values to prevent sudden jumps
    parallax.current.x += (targetPX - parallax.current.x) * 0.04;
    parallax.current.y += (targetPY - parallax.current.y) * 0.04;

    // finalPos = pSpring.current + drift + parallax
    _scratchFinalPos.current.copy(pSpring.current);
    _scratchDriftVec.current.set(
      driftX + parallax.current.x,
      driftY + parallax.current.y,
      driftZ
    );
    _scratchFinalPos.current.add(_scratchDriftVec.current);

    // Apply flight-sim style roll banking around forward direction
    _scratchForward.current.subVectors(tSpring.current, pSpring.current).normalize();
    _scratchUp.current.set(0, 1, 0).applyAxisAngle(_scratchForward.current, targetParams.roll || 0);
    camera.up.copy(_scratchUp.current);

    camera.position.copy(_scratchFinalPos.current);
    targetRef.current.copy(tSpring.current);
    camera.lookAt(targetRef.current);

    const persCam = camera as THREE.PerspectiveCamera;
    if (persCam.isPerspectiveCamera) {
      persCam.fov += (targetParams.fov - persCam.fov) * 0.045;
      persCam.updateProjectionMatrix();
    }
  });

  return null;
}

/* =========================================================================
   LIGHTS SETUP
   ========================================================================= */
function Lights({ visMode }: { visMode: string }) {
  const quality = useQuality();
  const isMobile = quality === "mobile";
  const isThermal = visMode === "thermal";

  const ambientRef = useRef<THREE.AmbientLight>(null!);
  const spotRef = useRef<THREE.SpotLight>(null!);
  const dir1Ref = useRef<THREE.DirectionalLight>(null!);
  const dir2Ref = useRef<THREE.DirectionalLight>(null!);

  useFrame(() => {
    const levelFloat = globalLevelState.current;

    // Spotlight intensity: Fades out as we scroll away from chapter 1 (levelFloat > 1.0)
    const spotlightIntensity = Math.max(0, 1.0 - (levelFloat - 1.0) * 1.5) * 45.0;

    // Dynamic ambient light that is brighter in chapter 1
    const ambientIntensity = isThermal
      ? 0.05
      : 0.22 + Math.max(0, 1.0 - (levelFloat - 1.0) * 1.55) * 0.5;

    if (ambientRef.current) ambientRef.current.intensity = ambientIntensity;
    if (spotRef.current) {
      spotRef.current.intensity = spotlightIntensity;
      spotRef.current.visible = spotlightIntensity > 0.01;
    }
    if (dir1Ref.current) {
      dir1Ref.current.intensity = isThermal ? 0.3 : 2.4;
    }
    if (dir2Ref.current) {
      dir2Ref.current.intensity = isThermal ? 0.15 : 0.55;
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.22} color="#0c0c0a" />

      {/* Cool sky / warm ground gradient */}
      {!isThermal && <hemisphereLight args={["#2e3850", "#191007", 0.55]} />}

      {/* Chapter 1 Hero Spotlight */}
      <spotLight
        ref={spotRef}
        position={[0, 18, 0]}
        intensity={45}
        color="#fff3df"
        angle={Math.PI / 4.5}
        penumbra={0.7}
        decay={0}
      />

      {/* Warm key microscope light */}
      <directionalLight
        ref={dir1Ref}
        position={[-8, 20, 10]}
        intensity={2.4}
        color="#fff0d8"
        castShadow={!isMobile}
        shadow-mapSize-width={isMobile ? 512 : 1024}
        shadow-mapSize-height={isMobile ? 512 : 1024}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0003}
      />

      {/* Cool fill light */}
      <directionalLight ref={dir2Ref} position={[12, 4, -8]} intensity={0.55} color="#0a1530" />

      {/* Amber rim catch */}
      <directionalLight position={[-5, 3, -18]} intensity={0.8} color={AMBER} />

      {/* Subtle overhead downwash */}
      <directionalLight position={[0, 18, 0]} intensity={isThermal ? 0 : 0.25} color="#d8d0c8" />
    </>
  );
}

/* =========================================================================
   MAIN SCENE ASSEMBLY
   ========================================================================= */
interface SceneProps {
  t: number;
  selected: string | null;
  setSelected: (id: string | null) => void;
  mode: SocMode;
  targetLevelRef: React.RefObject<number>;
  visMode?: string;
  uiTransitionRef?: React.RefObject<{
    onUpdate: (levelFloat: number) => void;
  } | null>;
  showPlayground?: boolean;
  playgroundShowLabels?: boolean;
  interactionRef?: React.MutableRefObject<{ zoom: (factor: number) => void; resetView: () => void } | null>;
}

export function Scene({
  t,
  selected,
  setSelected,
  mode,
  targetLevelRef,
  visMode = "physical",
  uiTransitionRef,
  showPlayground = false,
  playgroundShowLabels = true,
  interactionRef,
}: SceneProps) {
  const [level, setLevel] = useState(Math.round(targetLevelRef.current ?? 1.0));
  const { camera } = useThree();

  useEffect(() => {
    if (interactionRef) {
      interactionRef.current = {
        zoom: (factor: number) => {
          const len = camera.position.length();
          const next = Math.min(68, Math.max(16, len * factor));
          camera.position.multiplyScalar(next / len);
          camera.updateMatrixWorld(true);
        },
        resetView: () => {
          camera.position.set(20, 16, 22);
          camera.lookAt(0, 1.5, 0);
        }
      };
    }
    return () => {
      if (interactionRef) interactionRef.current = null;
    };
  }, [camera, interactionRef]);

  const spring = useRef({
    current: targetLevelRef.current ?? 1.0,
    target: targetLevelRef.current ?? 1.0,
    velocity: 0,
    stiffness: 45, // Low stiffness for slow cinematic transition
    damping: 12,   // Gentle damping for smooth deceleration
  });

  const chipGroupRef = useRef<THREE.Group>(null!);
  const fogRef = useRef<THREE.Fog>(null!);

  useFrame((_, delta) => {
    const s = spring.current;
    const targetLevel = targetLevelRef.current ?? 1.0;

    // If target changed, we are no longer settled
    const targetChanged = s.target !== targetLevel;
    s.target = targetLevel;

    if (!targetChanged && s.current === s.target && s.velocity === 0) {
      return; // Skip settled frames completely!
    }

    // Clamp delta to avoid huge jumps on frame drops
    const dt = Math.min(0.03, delta);

    // Spring physics step
    const x = s.current - s.target;
    const accel = -s.stiffness * x - s.damping * s.velocity;
    s.velocity += accel * dt;
    s.current += s.velocity * dt;

    // Snap to target when close
    if (Math.abs(s.current - s.target) < 0.0015 && Math.abs(s.velocity) < 0.005) {
      s.current = s.target;
      s.velocity = 0;
    }

    // Update global level state
    globalLevelState.current = s.current;
    globalLevelState.target = s.target;

    // 1. Sync HTML panels
    if (uiTransitionRef && uiTransitionRef.current) {
      uiTransitionRef.current.onUpdate(s.current);
    }

    // 2. Update rounded level state (rarely triggers React re-render)
    const nextLevel = Math.round(s.current);
    if (nextLevel !== level) {
      setLevel(nextLevel);
    }

    // 3. Update dynamic fog arguments
    const cameraDist = s.current <= 1.5 ? 135 : s.current <= 2.5 ? 60 : 50;
    if (fogRef.current) {
      fogRef.current.near = cameraDist * 0.9;
      fogRef.current.far = cameraDist * 1.8;
    }

    // 4. Update chip Y position
    const chipProgress = Math.max(0, Math.min(1, s.current - 1.0));
    const chipY = -0.5 * (1 - chipProgress);
    if (chipGroupRef.current) {
      chipGroupRef.current.position.y = chipY;
    }
  });

  const quality = useQuality();
  const isMobile = quality === "mobile";

  const selectedBlock = useMemo(
    () => BLOCKS.find((b) => b.id === selected) || null,
    [selected]
  );

  const selectedBlockCoords = useMemo(() => {
    if (!selectedBlock) return null;
    return { cx: selectedBlock.cx, cz: selectedBlock.cz, h: selectedBlock.h };
  }, [selectedBlock]);

  return (
    <>
      {/* Transparent canvas background allows HTML circuit traces to show behind the 3D casing */}
      <fog ref={fogRef} attach="fog" args={["#08090e", 45, 90]} />

      {/* GPU-accelerated atmospheric dust particles */}
      <Particles count={isMobile ? 120 : 450} color="#c79a4e" />

      <Lights visMode={visMode} />

      {!isMobile ? (
        <Environment resolution={128}>
          <Lightformer intensity={1.4} color="#ffdca8" position={[-10, 8, 6]} scale={[10, 10, 1]} />
          <Lightformer intensity={0.6} color="#8aa0e0" position={[12, 6, -6]} scale={[8, 8, 1]} />
          <Lightformer intensity={0.8} color="#ffb878" position={[0, 5, -14]} scale={[12, 4, 1]} />
          <Lightformer intensity={0.35} color="#e0ddd8" position={[0, 14, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[22, 22, 1]} />
        </Environment>
      ) : null}

      <CameraController
        selectedBlockCoords={selectedBlockCoords}
        showPlayground={showPlayground}
      />

      {showPlayground && (
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2.15}
          minDistance={16}
          maxDistance={70}
          target={[0, 1.5, 0]}
        />
      )}

      {showPlayground && (
        <TrafficNetwork mode={mode} t={t} />
      )}

      <group onPointerMissed={() => setSelected(null)}>
        {/* Layer 1: Computer Shell (slides down & fades out) */}
        <ComputerCasing />

        {/* Rainbow Datastreams flowing into the die on Chapter 1 */}
        <RainbowDatastreams />

        {/* Layer 2: Semiconductor SoC (slides up & fades in) */}
        <group ref={chipGroupRef} position={[0, -0.5, 0]}>
          <PackageSubstrate />
          <Die visMode={visMode} />
          
          {BLOCKS.map((b) => (
            <MemoSocBlock
              key={b.id}
              block={b}
              selected={selected === b.id}
              onSelect={setSelected}
              dimmed={selected !== null && selected !== b.id}
              modeUtilization={getUtil(b.id, mode)}
              visMode={visMode}
              t={t}
              showPlayground={showPlayground}
              playgroundShowLabels={playgroundShowLabels}
            />
          ))}
        </group>

      </group>

      {!isMobile ? (
        // frames={1}: bake once at mount instead of re-rendering the whole scene
        // top-down every frame — one of the biggest hidden costs in high quality.
        <ContactShadows
          position={[0, -1.58, 0]}
          scale={52}
          resolution={512}
          blur={2.2}
          opacity={0.55}
          far={18}
          color="#000000"
          frames={1}
        />
      ) : null}

      <OrbitControls
        makeDefault
        enabled={false}
        enableDamping={false}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={1.0}
        maxDistance={80}
      />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={isMobile ? 0.35 : 0.55}
          luminanceThreshold={0.5}
          luminanceSmoothing={0.15}
          mipmapBlur={!isMobile}
        />
        <Vignette eskil={false} offset={0.18} darkness={0.65} />
        {isMobile ? <></> : <SMAA />}
      </EffectComposer>
    </>
  );
}
