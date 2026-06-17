import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useMemo, useRef, useEffect, useState, memo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer, Edges, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, SMAA, N8AO } from "@react-three/postprocessing";
import { BLOCKS, DIE_W, DIE_D, SocMode, UTILIZATION } from "./data";
import { ARTICLE_BLOCK_IDS } from "../articles";
import { SocBlock } from "./SocBlock";

// Memoized: blocks only re-render when their own quantized props change, not on
// every levelFloat tick — the single biggest CPU saving during transitions.
const MemoSocBlock = memo(SocBlock);
import { getCameraParamsInterpolated } from "./levelManager";
import { useQuality } from "./quality";
import { PowerRailShader } from "./shaders";
import { Particles } from "./Particles";
import {
  ComputerCasing,
  PackageSubstrate,
} from "./ProceduralModels";
import { ThreeMotherboard } from "./ThreeMotherboard";

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

/* =========================================================================
   DIE SUBSTRATE & BASE
   ========================================================================= */
/* =========================================================================
   DIE-EDGE REALISM: wire-bond pad ring, double seal ring, alignment crosses,
   and an etched die ID — the "tells" that read as a real fabricated die.
   Self-contained; mounted by <Die>. Desktop look, but cheap enough to stay on
   everywhere (instanced pads = one draw call).
   ========================================================================= */
const _bondPadGeo = new THREE.BoxGeometry(0.16, 0.05, 0.16);
const _bondPadMat = new THREE.MeshStandardMaterial({
  color: "#e7c270",
  emissive: "#d4af37",
  emissiveIntensity: 0.5,
  metalness: 1,
  roughness: 0.18,
  transparent: true,
});

function DieSurfaceMarks({ dieW, dieD, opacity }: { dieW: number; dieD: number; opacity: number }) {
  const padRef = useRef<THREE.InstancedMesh>(null!);
  const cx = dieW / 2 - 0.5;
  const cz = dieD / 2 - 0.5;

  const padPositions = useMemo(() => {
    const list: THREE.Vector3[] = [];
    const step = 0.5;
    const y = 0.05;
    for (let x = -cx + 0.4; x <= cx - 0.4; x += step) {
      list.push(new THREE.Vector3(x, y, -cz));
      list.push(new THREE.Vector3(x, y, cz));
    }
    for (let z = -cz + 0.4; z <= cz - 0.4; z += step) {
      list.push(new THREE.Vector3(-cx, y, z));
      list.push(new THREE.Vector3(cx, y, z));
    }
    return list;
  }, [cx, cz]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    padPositions.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.updateMatrix();
      padRef.current.setMatrixAt(i, dummy.matrix);
    });
    padRef.current.instanceMatrix.needsUpdate = true;
  }, [padPositions]);

  useEffect(() => {
    _bondPadMat.opacity = opacity;
    _bondPadMat.needsUpdate = true;
  }, [opacity]);

  // Etched die ID in a corner (canvas texture — no external font dependency).
  const dieId = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 96;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 256, 96);
    ctx.fillStyle = "#9c8038";
    ctx.font = "bold 34px ui-monospace, Menlo, monospace";
    ctx.textBaseline = "middle";
    ctx.fillText("BNB-N3", 8, 30);
    ctx.font = "20px ui-monospace, Menlo, monospace";
    ctx.fillStyle = "#6a5a30";
    ctx.fillText("© 2026", 8, 66);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }, []);

  const crosses = [
    [cx, cz],
    [-cx, cz],
    [cx, -cz],
    [-cx, -cz],
  ] as const;

  return (
    <group>
      {/* Wire-bond pad ring just inside the seal ring (instanced — 1 draw call) */}
      <instancedMesh ref={padRef} args={[_bondPadGeo, _bondPadMat, padPositions.length]} />

      {/* Inner seal ring — makes the perimeter a believable double seal ring */}
      {[
        [0, 0.04, -cz - 0.08, dieW - 0.6, 0.03, 0.04] as const,
        [0, 0.04, cz + 0.08, dieW - 0.6, 0.03, 0.04] as const,
        [-cx - 0.08, 0.04, 0, 0.04, 0.03, dieD - 0.6] as const,
        [cx + 0.08, 0.04, 0, 0.04, 0.03, dieD - 0.6] as const,
      ].map(([x, y, z, w, hh, dd], i) => (
        <mesh key={`seal-${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, hh, dd]} />
          <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={0.5 * opacity} metalness={1} roughness={0.2} transparent opacity={0.7 * opacity} />
        </mesh>
      ))}

      {/* Corner alignment crosses */}
      {crosses.map(([px, pz], i) => (
        <group key={`x-${i}`} position={[px, 0.06, pz]}>
          <mesh>
            <boxGeometry args={[0.34, 0.03, 0.06]} />
            <meshStandardMaterial color="#e7c270" emissive={AMBER} emissiveIntensity={0.7 * opacity} metalness={1} roughness={0.15} transparent opacity={opacity} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.06, 0.03, 0.34]} />
            <meshStandardMaterial color="#e7c270" emissive={AMBER} emissiveIntensity={0.7 * opacity} metalness={1} roughness={0.15} transparent opacity={opacity} />
          </mesh>
        </group>
      ))}

      {/* Etched die ID near the −X/−Z corner */}
      <mesh position={[-cx + 1.4, 0.06, -cz + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 0.9]} />
        <meshStandardMaterial map={dieId} emissiveMap={dieId} emissive="#ffffff" emissiveIntensity={0.45 * opacity} transparent opacity={0.85 * opacity} />
      </mesh>
    </group>
  );
}

/* =========================================================================
   BOND WIRES + FINGERS: a comb of gold bond fingers around the die with dense
   arcing gold wires fanning out to them — the decapped-package look from real
   silicon photos. Desktop-only (wired in Scene): TubeGeometry is comparatively
   heavy and the detail is lost on a small phone screen.
   ========================================================================= */
const _fingerGeo = new THREE.BoxGeometry(0.62, 0.04, 0.12);
const _fingerMat = new THREE.MeshStandardMaterial({
  color: "#e7c270",
  emissive: "#d4af37",
  emissiveIntensity: 0.4,
  metalness: 1,
  roughness: 0.2,
  transparent: true,
});

function DieBondFingers({ dieHX, dieHZ, opacity }: { dieHX: number; dieHZ: number; opacity: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const data = useMemo(() => {
    const list: { x: number; z: number; rot: number }[] = [];
    const step = 0.4;
    const ox = dieHX + 0.6, oz = dieHZ + 0.6;
    for (let x = -dieHX + 0.3; x <= dieHX - 0.3; x += step) {
      list.push({ x, z: -oz, rot: Math.PI / 2 });
      list.push({ x, z: oz, rot: Math.PI / 2 });
    }
    for (let z = -dieHZ + 0.3; z <= dieHZ - 0.3; z += step) {
      list.push({ x: -ox, z, rot: 0 });
      list.push({ x: ox, z, rot: 0 });
    }
    return list;
  }, [dieHX, dieHZ]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    data.forEach((f, i) => {
      dummy.position.set(f.x, -0.1, f.z);
      dummy.rotation.set(0, f.rot, 0);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [data]);

  useEffect(() => {
    _fingerMat.opacity = opacity;
    _fingerMat.needsUpdate = true;
  }, [opacity]);

  return <instancedMesh ref={ref} args={[_fingerGeo, _fingerMat, data.length]} />;
}

function DieBondWires({ dieHX, dieHZ, opacity }: { dieHX: number; dieHZ: number; opacity: number }) {
  const geo = useMemo(() => {
    const tubes: THREE.TubeGeometry[] = [];
    const add = (x1: number, z1: number, x2: number, z2: number) => {
      const start = new THREE.Vector3(x1, 0.06, z1);
      const end = new THREE.Vector3(x2, -0.12, z2);
      const mid = new THREE.Vector3((x1 + x2) / 2, 0.55, (z1 + z2) / 2);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      tubes.push(new THREE.TubeGeometry(curve, 12, 0.024, 5, false));
    };
    const step = 0.34;
    const iX = dieHX - 0.15, oX = dieHX + 0.6;
    const iZ = dieHZ - 0.15, oZ = dieHZ + 0.6;
    for (let x = -dieHX + 0.3; x <= dieHX - 0.3; x += step) {
      add(x, -iZ, x, -oZ);
      add(x, iZ, x, oZ);
    }
    for (let z = -dieHZ + 0.3; z <= dieHZ - 0.3; z += step) {
      add(-iX, z, -oX, z);
      add(iX, z, oX, z);
    }
    return mergeGeometries(tubes) ?? new THREE.BufferGeometry();
  }, [dieHX, dieHZ]);

  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color="#e7c270" emissive="#d4af37" emissiveIntensity={0.5 * opacity} metalness={1} roughness={0.22} transparent opacity={opacity} />
    </mesh>
  );
}

/* =========================================================================
   POWER-ON: an ignition ripple sweeps across the die surface, synced with the
   light climbing the package pins. Fades out (uBoot) as you scroll past level 1.
   ========================================================================= */
function DieIgnitionRing({ dieW, dieD, boot }: { dieW: number; dieD: number; boot: number }) {
  const bootR = useRef(boot);
  bootR.current = boot;
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uBoot: { value: boot }, uColor: { value: new THREE.Color("#ffd98a") } }),
    [],
  );
  useFrame((st) => {
    uniforms.uTime.value = st.clock.getElapsedTime();
    uniforms.uBoot.value = bootR.current;
  });

  if (boot <= 0.001) return null;
  return (
    <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[dieW, dieD]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={"varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"}
        fragmentShader={
          "uniform float uTime; uniform float uBoot; uniform vec3 uColor; varying vec2 vUv;" +
          "void main(){" +
          "  vec2 p = vUv - 0.5; float d = length(p) * 2.0;" +
          "  float r = fract(uTime * 0.32);" +
          "  float ring = smoothstep(0.07, 0.0, abs(d - r)) * (1.0 - r);" +
          "  float r2 = fract(uTime * 0.32 + 0.5);" +
          "  ring += smoothstep(0.07, 0.0, abs(d - r2)) * (1.0 - r2) * 0.6;" +
          "  float mask = smoothstep(1.0, 0.55, d);" +
          "  float a = ring * mask * uBoot * 0.85;" +
          "  gl_FragColor = vec4(uColor, a);" +
          "}"
        }
      />
    </mesh>
  );
}

function Die({ visMode, opacity = 1 }: { visMode: string; opacity?: number }) {
  const isMobile = useQuality() === "mobile";
  const dieW = DIE_W + 1.4;
  const dieD = DIE_D + 1.4;
  const rail = 0.14;

  const matRef = useRef<THREE.ShaderMaterial>(null!);

  useFrame((state) => {
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
      {/* Die slab — matte silicon wafer (matches the playground "full die" look) */}
      <mesh position={[0, -0.3, 0]} receiveShadow castShadow>
        <boxGeometry args={[dieW, 0.6, dieD]} />
        <meshStandardMaterial
          color={visMode === "logical" ? "#030408" : "#080c10"}
          metalness={visMode === "logical" ? 0.95 : 0.35}
          roughness={visMode === "logical" ? 0.25 : 0.75}
          transparent
          opacity={opacity}
        />
        <Edges threshold={15} scale={1.001}>
          <lineBasicMaterial color={AMBER} transparent opacity={visMode === "logical" ? 0.8 * opacity : 0.35 * opacity} />
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
            {isMobile ? (
              <meshStandardMaterial color="#060910" metalness={0.3} roughness={0.8} transparent opacity={opacity} />
            ) : (
              // Bare-silicon thin-film sheen: the rainbow diffraction of a real die.
              // Desktop-only (meshPhysicalMaterial is GPU-heavier); phones keep the
              // cheaper matte standard material above.
              <meshPhysicalMaterial
                color="#070b14"
                metalness={0.6}
                roughness={0.42}
                iridescence={1}
                iridescenceIOR={1.9}
                iridescenceThicknessRange={[140, 720]}
                clearcoat={0.5}
                clearcoatRoughness={0.45}
                transparent
                opacity={opacity}
              />
            )}
          </mesh>
          <DieInterconnects opacity={opacity} />
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
            color={AMBER}
            emissive={AMBER}
            emissiveIntensity={(visMode === "logical" ? 1.2 : 0.55) * opacity}
            metalness={1}
            roughness={0.15}
            transparent
          />
        </mesh>
      ))}
      {/* Input/Output pins at the die edges — mobile only. On desktop the
          arcing bond wires + fingers (mounted in Scene) play this role, so we
          skip these to avoid clutter/z-fighting at the perimeter. */}
      {isMobile && <DieIOPins dieW={dieW} dieD={dieD} opacity={opacity} />}

      {/* Die-edge realism: bond pads, double seal ring, alignment crosses, die ID */}
      <DieSurfaceMarks dieW={dieW} dieD={dieD} opacity={opacity} />
    </group>
  );
}

/* =========================================================================
   CINEMATIC CAMERA SYSTEM
   ========================================================================= */
function CameraController({
  levelFloat,
  selectedBlockCoords,
  uiTransitionRef,
}: {
  levelFloat: number;
  selectedBlockCoords: { cx: number; cz: number; h: number } | null;
  uiTransitionRef?: React.MutableRefObject<{
    onUpdate: (levelFloat: number) => void;
  } | null>;
}) {
  const { camera, size } = useThree();
  const targetRef = useRef(new THREE.Vector3(0, 1.5, 0));
  const driftRef = useRef(new THREE.Vector3());
  const finalPosRef = useRef(new THREE.Vector3());

  const mouse = useRef(new THREE.Vector2(0, 0));
  const parallax = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const targetParams = useMemo(
    () => getCameraParamsInterpolated(levelFloat, selectedBlockCoords),
    [levelFloat, selectedBlockCoords]
  );

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

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

    driftRef.current.set(driftX + parallax.current.x, driftY + parallax.current.y, driftZ);
    const finalPos = finalPosRef.current.copy(targetParams.position).add(driftRef.current);

    // Heavy cinematic easing: lerp position and lookAt target at slightly different rates
    camera.position.lerp(finalPos, 0.045);
    targetRef.current.lerp(targetParams.target, 0.05);
    camera.lookAt(targetRef.current);

    const persCam = camera as THREE.PerspectiveCamera;
    if (persCam.isPerspectiveCamera) {
      // Aspect-aware framing: on portrait/narrow viewports (phones) widen the
      // vertical FOV so the wide die still fits horizontally instead of being
      // cropped. Preserves the horizontal coverage the desktop layout was tuned
      // for (REF_ASPECT); clamped to avoid extreme wide-angle distortion.
      const REF_ASPECT = 1.6;
      const aspect = size.width / Math.max(1, size.height);
      let fovTarget = targetParams.fov;
      if (aspect < REF_ASPECT) {
        const vRef = THREE.MathUtils.degToRad(targetParams.fov);
        const hRef = 2 * Math.atan(Math.tan(vRef / 2) * REF_ASPECT);
        const vNew = 2 * Math.atan(Math.tan(hRef / 2) / aspect);
        fovTarget = Math.min(82, THREE.MathUtils.radToDeg(vNew));
      }
      persCam.fov += (fovTarget - persCam.fov) * 0.05;
      persCam.updateProjectionMatrix();
    }

    if (uiTransitionRef && uiTransitionRef.current && uiTransitionRef.current.onUpdate) {
      uiTransitionRef.current.onUpdate(levelFloat);
    }
  });

  return null;
}

/* =========================================================================
   LIGHTS SETUP
   ========================================================================= */
function Lights({ visMode, levelFloat }: { visMode: string; levelFloat: number }) {
  const quality = useQuality();
  const isMobile = quality === "mobile";
  const isThermal = visMode === "thermal";
  
  // Spotlight intensity for chapter 1: Fades out as we scroll away from chapter 1 (levelFloat > 1.0)
  const spotlightIntensity = Math.max(0, 1.0 - (levelFloat - 1.0) * 1.5) * 45.0;

  // Dynamic ambient light that is brighter in chapter 1
  const ambientIntensity = isThermal
    ? 0.05
    : 0.22 + Math.max(0, 1.0 - (levelFloat - 1.0) * 1.55) * 0.5;

  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#0c0c0a" />

      {/* Cool sky / warm ground gradient — makes block faces read as 3D volumes */}
      {!isThermal && <hemisphereLight args={["#2e3850", "#191007", 0.55]} />}

      {/* Chapter 1 Hero Spotlight — no shadow casting: the key light already
          casts, and a second shadow pass doubles the geometry cost. */}
      {spotlightIntensity > 0.01 && (
        <spotLight
          position={[0, 18, 0]}
          intensity={spotlightIntensity}
          color="#fff3df"
          angle={Math.PI / 4.5}
          penumbra={0.7}
          decay={0}
        />
      )}

      {/* Warm key microscope light — the single shadow-casting light */}
      <directionalLight
        position={[-8, 20, 10]}
        intensity={isThermal ? 0.3 : 2.4}
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
      <directionalLight position={[12, 4, -8]} intensity={isThermal ? 0.15 : 0.55} color="#0a1530" />

      {/* Amber rim catch */}
      <directionalLight position={[-5, 3, -18]} intensity={0.8} color={AMBER} />

      {/* Subtle overhead downwash for top-face readability */}
      <directionalLight position={[0, 18, 0]} intensity={isThermal ? 0 : 0.25} color="#d8d0c8" />
    </>
  );
}

/* =========================================================================
   MAIN SCENE ASSEMBLY
   ========================================================================= */
interface SceneProps {
  t: number;
  showLabels: boolean;
  selected: string | null;
  setSelected: (id: string | null) => void;
  mode: SocMode;
  targetLevel: number;
  visMode?: string;
  uiTransitionRef?: React.MutableRefObject<{
    onUpdate: (levelFloat: number) => void;
  } | null>;
  /** Continuous scroll position (1..TOTAL). When provided, the scene follows it
      directly instead of easing toward the integer `targetLevel`. */
  scrollTargetRef?: React.MutableRefObject<number>;
}

function getStaggeredT(blockId: string, manualT: number): number {
  const block = BLOCKS.find((b) => b.id === blockId);
  if (!block) return manualT;
  const cx = block.cx;
  const cz = block.cz;
  const dist = Math.sqrt(cx * cx + cz * cz);
  const maxDist = 11.5;
  const normDist = Math.min(1.0, dist / maxDist);
  
  const delay = normDist * 0.45;
  const localT = Math.max(0, Math.min(1, (manualT - delay) / (1.0 - delay)));
  
  return localT * localT * (3 - 2 * localT);
}

export function Scene({
  t,
  showLabels,
  selected,
  setSelected,
  mode,
  targetLevel,
  visMode = "physical",
  uiTransitionRef,
  scrollTargetRef,
}: SceneProps) {
  const [levelFloat, setLevelFloat] = useState(targetLevel);
  const levelFloatRef = useRef(targetLevel);

  // Continuously ease the rendered levelFloat toward the scroll-driven target
  // (or the integer targetLevel as a fallback). The loop runs permanently and
  // only triggers a React update when the quantized value actually changes, so
  // the scene re-renders smoothly while scrolling and goes idle when settled.
  useEffect(() => {
    let raf: number | undefined;
    let cancelled = false;

    const ease = () => {
      if (cancelled) return;
      const target = scrollTargetRef?.current ?? targetLevel;
      const prev = levelFloatRef.current;
      const diff = target - prev;

      if (Math.abs(diff) >= 0.0005) {
        const nextPrecise = prev + diff * 0.12;
        levelFloatRef.current = nextPrecise;
        const q = Math.round(nextPrecise * 50) / 50;
        setLevelFloat((cur) => (cur !== q ? q : cur));
      }

      raf = requestAnimationFrame(ease);
    };

    raf = requestAnimationFrame(ease);
    return () => {
      cancelled = true;
      if (raf !== undefined) cancelAnimationFrame(raf);
    };
  }, [targetLevel, scrollTargetRef]);
  const quality = useQuality();
  const isMobile = quality === "mobile";
  
  // Rounded level for visual model activation boundaries
  const level = Math.round(levelFloat);

  const selectedBlock = useMemo(
    () => BLOCKS.find((b) => b.id === selected) || null,
    [selected]
  );

  const selectedBlockCoords = useMemo(() => {
    if (!selectedBlock) return null;
    return { cx: selectedBlock.cx, cz: selectedBlock.cz, h: selectedBlock.h };
  }, [selectedBlock]);

  // Transition values for the chip components
  // In Chapter 1, the chip sits at -0.5 units height, visible with 0.85 opacity.
  // As you scroll to Chapter 2, it slides up to 0 and becomes fully opaque.
  const chipProgress = Math.max(0, Math.min(1, levelFloat - 1.0));
  const chipY = -0.5 * (1 - chipProgress);
  const chipOpacity = 0.85 + 0.15 * chipProgress;

  // Power-On boot effect (die ignition ripple) fades out as you scroll past level 1.
  const bootIntensity = Math.max(0, Math.min(1, 1 - (levelFloat - 1) * 1.6));

  // Level 2 -> 3: the package base (substrate, pins, cavity, bond wires) sinks
  // and dissolves, leaving just the silicon die + floorplan from level 3 on.
  const pkgT = Math.max(0, Math.min(1, (levelFloat - 2) / 0.9));

  // Dynamic fog arguments to prevent the chip from being hidden by the fog in Chapter 1 (camera at [0, 80, 100])
  const cameraDist = levelFloat <= 1.5 ? 135 : levelFloat <= 2.5 ? 60 : 50;
  const fogStart = cameraDist * 0.9;
  const fogEnd = cameraDist * 1.8;

  return (
    <>
      {/* Transparent canvas background allows HTML circuit traces to show behind the 3D casing */}
      <fog attach="fog" args={["#08090e", fogStart, fogEnd]} />

      {/* GPU-accelerated atmospheric dust particles — off during the opening
          (level ≤ 1.5) where the motherboard / circuit backdrop fills the space. */}
      <Particles count={levelFloat <= 1.5 ? 0 : (isMobile ? 120 : 450)} color="#c79a4e" levelFloat={levelFloat} />

      <Lights visMode={visMode} levelFloat={levelFloat} />

      {!isMobile ? (
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={1.4} color="#ffdca8" position={[-10, 8, 6]} scale={[10, 10, 1]} />
          <Lightformer intensity={0.6} color="#8aa0e0" position={[12, 6, -6]} scale={[8, 8, 1]} />
          <Lightformer intensity={0.8} color="#ffb878" position={[0, 5, -14]} scale={[12, 4, 1]} />
          <Lightformer intensity={0.35} color="#e0ddd8" position={[0, 14, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[22, 22, 1]} />
          {/* Extra soft strips + ring give the iridescent silicon moving reflections */}
          <Lightformer intensity={0.5} color="#bcd0ff" position={[-6, 4, 10]} scale={[6, 6, 1]} />
          <Lightformer intensity={0.45} color="#ffd0a0" position={[8, 3, 9]} scale={[6, 6, 1]} />
          <Lightformer form="ring" intensity={0.6} color="#ffffff" position={[0, 11, 6]} scale={[10, 10, 1]} />
        </Environment>
      ) : null}

      <CameraController
        levelFloat={levelFloat}
        selectedBlockCoords={selectedBlockCoords}
        uiTransitionRef={uiTransitionRef}
      />

      {/* 3D motherboard the chip sits on (level-1 opening, fades out by ~1.6).
          Desktop-only — it's a 500x500 textured plane + instanced traces +
          animated packets; on mobile the cheap CircuitBackground SVG (in AppUI)
          plays this role instead. */}
      {!isMobile && <ThreeMotherboard levelFloat={levelFloat} />}

      <group onPointerMissed={() => setSelected(null)}>
        {/* Layer 1: Computer Shell (slides down & fades out) */}
        <ComputerCasing levelFloat={levelFloat} />

        {/* The opening flourish is the Power-On sequence (pin climb + die
            ignition ripple, below) — the old rainbow datastreams were dropped. */}

        {/* Layer 2: Semiconductor SoC (slides up & fades in) */}
        <group position={[0, chipY, 0]}>
          {/* Package assembly — sinks & dissolves on the way to level 3 */}
          <group position={[0, -pkgT * 5, 0]}>
            <PackageSubstrate opacity={chipOpacity * (1 - pkgT)} />
            {!isMobile && (
              <>
                <DieBondFingers dieHX={(DIE_W + 1.4) / 2} dieHZ={(DIE_D + 1.4) / 2} opacity={chipOpacity * (1 - pkgT)} />
                <DieBondWires dieHX={(DIE_W + 1.4) / 2} dieHZ={(DIE_D + 1.4) / 2} opacity={chipOpacity * (1 - pkgT)} />
              </>
            )}
          </group>
          <Die visMode={visMode} opacity={chipOpacity} />

          {/* Power-On ignition ripple across the die (opening) */}
          <DieIgnitionRing dieW={DIE_W + 1.4} dieD={DIE_D + 1.4} boot={bootIntensity} />

          {(() => {
            // The Library (level 4) auto-raises every block in a center-out ripple
            // tied to the camera swoop. Ramps up entering 4, back down toward the Hub.
            // All derived values are quantized so memoized blocks skip re-renders.
            const rampUp = Math.max(0, Math.min(1, (levelFloat - 3.05) / 0.85));
            const rampDown = Math.max(0, Math.min(1, (levelFloat - 4.1) / 0.8));
            const galleryT = Math.round(rampUp * (1 - rampDown) * 100) / 100;
            // Gentler, smoothly-interpolated lift so the explode never flies off-frame.
            const liftScale =
              Math.round((0.6 - Math.max(0, Math.min(1, levelFloat - 3.0)) * 0.15) * 100) / 100;
            const qOpacity = Math.round(chipOpacity * 50) / 50;
            return BLOCKS.map((b) => {
              const isArticleBlock = ARTICLE_BLOCK_IDS.has(b.id);
              const effT = Math.max(t, galleryT);
              return (
                <MemoSocBlock
                  key={b.id}
                  block={b}
                  t={getStaggeredT(b.id, effT)}
                  showLabels={showLabels && level <= 3}
                  selected={selected === b.id}
                  onSelect={setSelected}
                  dimmed={selected !== null && selected !== b.id}
                  modeUtilization={getUtil(b.id, mode)}
                  visMode={visMode}
                  opacity={qOpacity}
                  focused={false}
                  level={level}
                  liftScale={liftScale}
                  galleryPulse={level === 4 && isArticleBlock && !isMobile}
                />
              );
            });
          })()}
        </group>

      </group>

      {!isMobile ? (
        // frames={1}: bake once at mount instead of re-rendering the whole scene
        // top-down every frame — one of the biggest hidden costs in high quality.
        <ContactShadows
          position={[0, -1.96, 0]}
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
        {/* Ambient occlusion: shades the gaps between blocks and where the die
            meets the package, so the floorplan reads as real recessed geometry
            instead of flat boxes. Desktop only — half-res to stay cheap. */}
        {isMobile ? <></> : (
          <N8AO aoRadius={1.8} distanceFalloff={1.2} intensity={2.4} quality="medium" halfRes />
        )}
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
