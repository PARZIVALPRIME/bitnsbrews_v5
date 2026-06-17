import * as THREE from "three";
import { useRef, useMemo, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { useQuality } from "./quality";
import { DIE_W, DIE_D } from "./data";

const AMBER = "#c79a4e";
const STEEL = "#5e6977";
const GOLD = "#d4af37";
const GOLD_BRIGHT = "#e7c270";

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
   2. REALISTIC PGA PACKAGE (Level 3)
   A decapped-package look: black FR4 body with an inset soldermask cap, gold
   edge plating, fan-out escape routing, SMD decoupling caps, a laser-etched
   part marking, a stepped die cavity, and an upward PGA pin field.

   PERFORMANCE: the full detail is desktop-only. On mobile we render a reduced
   variant — no fan-out routing, no SMD caps, ~half the pin density, and plain
   (non-shader) pins — to protect the mobile frame-rate baseline.
   ========================================================================= */
export function PackageSubstrate({ opacity = 1 }: { opacity?: number }) {
  const isMobile = useQuality() === "mobile";

  // Die footprint: the silicon slab in Scene.tsx is (DIE_W/DIE_D + 1.4).
  const dieHX = (DIE_W + 1.4) / 2; // ~11.7
  const dieHZ = (DIE_D + 1.4) / 2; // ~9.7

  // Package is deliberately larger than the die so there's a real carrier margin
  // — that annulus is where the routing / balls / marking live and read as a chip.
  const pkgW = DIE_W + 18; // 40 — real packages are far larger than the die,
  const pkgD = DIE_D + 16; // 34   leaving room for a proper PGA pin field
  const pkgHW = pkgW / 2;
  const pkgHD = pkgD / 2;

  const coreTopY = -0.7; // top of the black FR4 body (exposed ledge sits here)
  const maskTopY = -0.58; // top of inset soldermask cap — the die rests on this

  // Gold fan-out (escape) routing: dense traces radiating from just outside the
  // die/pin ring out to the package edge — THE detail that reads as "a real chip".
  const fanout = useMemo(() => {
    const list: { cx: number; cz: number; len: number; angle: number; w: number }[] = [];
    // Short escape band hugging the die; the PGA pin field fills the rest.
    const innerX = dieHX + 0.7, outerX = dieHX + 2.4;
    const innerZ = dieHZ + 0.7, outerZ = dieHZ + 2.4;
    // Uniform length per axis: every trace spans the full inner→outer gap.
    const lenX = outerX - innerX;
    const cxX = innerX + lenX / 2;
    const lenZ = outerZ - innerZ;
    const czZ = innerZ + lenZ / 2;
    const w = 0.045;
    // Left / right edges (traces run along X)
    for (let z = -(dieHZ - 0.4); z <= dieHZ - 0.4; z += 0.82) {
      list.push({ cx: cxX, cz: z, len: lenX, angle: 0, w });
      list.push({ cx: -cxX, cz: z, len: lenX, angle: 0, w });
    }
    // Top / bottom edges (traces run along Z)
    for (let x = -(dieHX - 0.4); x <= dieHX - 0.4; x += 0.82) {
      list.push({ cx: x, cz: czZ, len: lenZ, angle: Math.PI / 2, w });
      list.push({ cx: x, cz: -czZ, len: lenZ, angle: Math.PI / 2, w });
    }
    return list;
  }, [dieHX, dieHZ]);

  // SMD decoupling capacitors scattered in the annulus around the die.
  const capacitors = useMemo(() => {
    const cx = dieHX + 1.0, cz = dieHZ + 1.0;
    return [
      { x: -cx, z: -cz, rot: 0 }, { x: cx, z: -cz, rot: 0 },
      { x: -cx, z: cz, rot: 0 }, { x: cx, z: cz, rot: 0 },
      { x: -cx, z: -2.4, rot: Math.PI / 2 }, { x: -cx, z: 2.4, rot: Math.PI / 2 },
      { x: cx, z: -2.4, rot: Math.PI / 2 }, { x: cx, z: 2.4, rot: Math.PI / 2 },
      { x: -3.6, z: -cz, rot: 0 }, { x: 3.6, z: -cz, rot: 0 },
    ];
  }, [dieHX, dieHZ]);

  // Laser-etched part marking (canvas texture — no external font dependency).
  const marking = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = "#c7a558";
    ctx.font = "bold 46px ui-monospace, Menlo, monospace";
    ctx.textBaseline = "middle";
    ctx.fillText("BNB-SoC", 16, 44);
    ctx.font = "26px ui-monospace, Menlo, monospace";
    ctx.fillStyle = "#7c6a3e";
    ctx.fillText("N3 · 2026 · BITSNBREWS", 16, 94);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }, []);

  // Gold edge-plating bars on the exposed ledge between body and soldermask cap.
  const goldEdge = [
    [0, coreTopY, -(pkgHD - 0.18), pkgW, 0.035, 0.36] as const,
    [0, coreTopY, pkgHD - 0.18, pkgW, 0.035, 0.36] as const,
    [-(pkgHW - 0.18), coreTopY, 0, 0.36, 0.035, pkgD] as const,
    [pkgHW - 0.18, coreTopY, 0, 0.36, 0.035, pkgD] as const,
  ];

  return (
    <group>
      {/* Black FR4 body — real thickness so the package side reads as a part */}
      <mesh position={[0, -0.95, 0]} receiveShadow castShadow>
        <boxGeometry args={[pkgW, 0.5, pkgD]} />
        <meshStandardMaterial color="#0a0b0f" metalness={0.25} roughness={0.72} transparent opacity={opacity} />
        <Edges threshold={15}>
          <lineBasicMaterial color={GOLD} transparent opacity={0.5 * opacity} />
        </Edges>
      </mesh>

      {/* Inset soldermask cap — creates a ledge (chamfer read) under the die */}
      <mesh position={[0, -0.64, 0]} receiveShadow>
        <boxGeometry args={[pkgW - 0.8, 0.12, pkgD - 0.8]} />
        <meshStandardMaterial color="#0c0d12" metalness={0.4} roughness={0.5} transparent opacity={opacity} />
      </mesh>

      {/* Gold edge plating on the exposed ledge */}
      {goldEdge.map(([x, y, z, ew, eh, ed], i) => (
        <mesh key={`edge-${i}`} position={[x, y, z]}>
          <boxGeometry args={[ew, eh, ed]} />
          <meshStandardMaterial color={GOLD_BRIGHT} emissive={GOLD} emissiveIntensity={0.35 * opacity} metalness={1} roughness={0.18} transparent opacity={0.9 * opacity} />
        </mesh>
      ))}

      {/* Gold fan-out escape routing (instanced — 1 draw call). Desktop-only:
          dense thin traces are a high-instance-count detail with little payoff
          on a small phone screen. */}
      {!isMobile && <InstancedFanout traces={fanout} y={maskTopY + 0.012} opacity={opacity} />}

      {/* Laser-etched part marking on the package rim (clear of the cavity) */}
      <mesh position={[0, maskTopY + 0.02, pkgHD - 1.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.2, 1.5]} />
        <meshStandardMaterial map={marking} emissiveMap={marking} emissive="#ffffff" emissiveIntensity={0.5 * opacity} transparent opacity={0.92 * opacity} />
      </mesh>

      {/* Pin-1 indicator (bright) + 3 corner fiducials (dim) */}
      {[
        { x: -(pkgHW - 0.9), z: -(pkgHD - 0.9), bright: true },
        { x: pkgHW - 0.9, z: -(pkgHD - 0.9), bright: false },
        { x: -(pkgHW - 0.9), z: pkgHD - 0.9, bright: false },
        { x: pkgHW - 0.9, z: pkgHD - 0.9, bright: false },
      ].map((f, i) => (
        <mesh key={`fid-${i}`} position={[f.x, maskTopY + 0.02, f.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[f.bright ? 0.22 : 0.16, 16]} />
          <meshStandardMaterial color={GOLD_BRIGHT} emissive={GOLD} emissiveIntensity={(f.bright ? 1.1 : 0.4) * opacity} metalness={1} roughness={0.15} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* Realistic 3D SMD Capacitors — instanced. Desktop-only. */}
      {!isMobile && <InstancedCapacitors capacitors={capacitors} opacity={opacity} />}

      {/* Stepped die cavity + glass seal frame — the recessed well a decapped die sits in */}
      <DieCavity dieHX={dieHX} dieHZ={dieHZ} opacity={opacity} />

      {/* PGA pin grid — dense upward gold pins across the package body (decap look) */}
      <InstancedPgaPins pkgHW={pkgHW} pkgHD={pkgHD} dieHX={dieHX} dieHZ={dieHZ} baseY={maskTopY} opacity={opacity} reduced={isMobile} />
    </group>
  );
}

function DieCavity({ dieHX, dieHZ, opacity }: { dieHX: number; dieHZ: number; opacity: number }) {
  // Concentric ledges descending from just under the die out to the package —
  // reads as the recessed cavity / bond shelf a decapped die sits in.
  // Each terrace steps down and out; tone darkens outward for depth separation.
  const steps = [
    { i: -0.2, o: 0.8, y: -0.14, c: "#1a1d26" },
    { i: 0.7, o: 1.5, y: -0.30, c: "#12141b" },
    { i: 1.4, o: 2.2, y: -0.46, c: "#0b0c11" },
  ];
  const h = 0.13;

  // A rectangular ring frame built from 4 bars (no center overlap with the die).
  const frame = (
    ix: number,
    iz: number,
    ox: number,
    oz: number,
    y: number,
    hh: number,
    key: string,
    color: string,
    rough: number,
    metal: number,
    op: number,
    emissive?: string,
    emi?: number,
  ) => {
    const bars: { p: [number, number, number]; s: [number, number, number] }[] = [
      { p: [0, y - hh / 2, -(iz + oz) / 2], s: [2 * ox, hh, oz - iz] },
      { p: [0, y - hh / 2, (iz + oz) / 2], s: [2 * ox, hh, oz - iz] },
      { p: [-(ix + ox) / 2, y - hh / 2, 0], s: [ox - ix, hh, 2 * iz] },
      { p: [(ix + ox) / 2, y - hh / 2, 0], s: [ox - ix, hh, 2 * iz] },
    ];
    return bars.map((b, i) => (
      <mesh key={`${key}-${i}`} position={b.p}>
        <boxGeometry args={b.s} />
        <meshStandardMaterial
          color={color}
          metalness={metal}
          roughness={rough}
          emissive={emissive ?? "#000000"}
          emissiveIntensity={(emi ?? 0) * opacity}
          transparent
          opacity={op * opacity}
        />
      </mesh>
    ));
  };

  return (
    <group>
      {steps.map((s, i) => (
        <group key={`step-${i}`}>
          {/* ceramic terrace */}
          {frame(dieHX + s.i, dieHZ + s.i, dieHX + s.o, dieHZ + s.o, s.y, h, `c-${i}`, s.c, 0.5, 0.45, 1)}
          {/* bright gold lip along the outer edge of each terrace — the detail
              that separates the steps into clear concentric rings */}
          {frame(dieHX + s.o - 0.16, dieHZ + s.o - 0.16, dieHX + s.o, dieHZ + s.o, s.y + 0.01, 0.035, `lip-${i}`, GOLD_BRIGHT, 0.16, 1, 0.95, GOLD, 0.55)}
        </group>
      ))}

      {/* bright gold shelf rim at the die base (where bond wires land) */}
      {frame(dieHX - 0.05, dieHZ - 0.05, dieHX + 0.2, dieHZ + 0.2, -0.04, 0.045, "rim", GOLD_BRIGHT, 0.14, 1, 1, GOLD, 0.7)}

      {/* translucent teal glass seal wall around the cavity */}
      {frame(dieHX + 2.4, dieHZ + 2.4, dieHX + 3.0, dieHZ + 3.0, 0.06, 0.6, "seal", "#1d3a44", 0.05, 0.1, 0.4, "#2aa0b0", 0.18)}
      {/* bright edge on top of the glass so the seal frame clearly reads as glass */}
      {frame(dieHX + 2.45, dieHZ + 2.45, dieHX + 2.95, dieHZ + 2.95, 0.1, 0.04, "seal-top", "#bfeaf2", 0.1, 0.2, 0.9, "#6fd8e6", 0.6)}
    </group>
  );
}

function InstancedPgaPins({
  pkgHW,
  pkgHD,
  dieHX,
  dieHZ,
  baseY,
  opacity,
  reduced = false,
}: {
  pkgHW: number;
  pkgHD: number;
  dieHX: number;
  dieHZ: number;
  baseY: number;
  opacity: number;
  /** Mobile: wider pin pitch (~half the count) and a plain non-shader shaft. */
  reduced?: boolean;
}) {
  const baseRef = useRef<THREE.InstancedMesh>(null!);
  const shaftRef = useRef<THREE.InstancedMesh>(null!);
  const headRef = useRef<THREE.InstancedMesh>(null!);
  const shaftH = 0.7;

  // Power-On: a band of light climbs each pin, with a radial phase so the waves
  // ripple outward across the whole pin field. Pure emissive add via onBeforeCompile.
  // Skipped on mobile (reduced) — plain emissive shaft to avoid the shader cost.
  const shaftGeo = useMemo(() => new THREE.CylinderGeometry(0.075, 0.075, shaftH, 10), [shaftH]);
  const glow = useMemo(() => ({ uTime: { value: 0 }, uGlow: { value: new THREE.Color("#ffe1a0") } }), []);
  const shaftMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: GOLD_BRIGHT, emissive: GOLD, emissiveIntensity: 0.18, metalness: 1, roughness: 0.18, transparent: true });
    if (reduced) return m;
    m.onBeforeCompile = (s) => {
      s.uniforms.uTime = glow.uTime;
      s.uniforms.uGlow = glow.uGlow;
      s.vertexShader = s.vertexShader
        .replace("#include <common>", "#include <common>\nvarying float vH;\nvarying float vDist;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>\n vH = (position.y + ${(shaftH / 2).toFixed(4)}) / ${shaftH.toFixed(4)};\n vDist = length(instanceMatrix[3].xz);`,
        );
      s.fragmentShader = s.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;\nuniform vec3 uGlow;\nvarying float vH;\nvarying float vDist;")
        .replace(
          "#include <emissivemap_fragment>",
          "#include <emissivemap_fragment>\n float p = fract(uTime * 0.5 - vDist * 0.045);\n float band = smoothstep(0.16, 0.0, abs(vH - p));\n totalEmissiveRadiance += uGlow * band * 2.5;",
        );
    };
    return m;
  }, [glow, shaftH, reduced]);
  useFrame((st) => {
    glow.uTime.value = st.clock.getElapsedTime();
    shaftMat.opacity = opacity;
  });

  const positions = useMemo(() => {
    const list: { x: number; z: number }[] = [];
    const step = reduced ? 2.1 : 1.4;
    // Centered lattice (i from -n..n) so the pin field is symmetric about the die
    // — fixes the off-center grid that gave 3 columns on one side and 2 on the other.
    const nx = Math.floor((pkgHW - 1.2) / step);
    const nz = Math.floor((pkgHD - 1.2) / step);
    for (let ix = -nx; ix <= nx; ix++) {
      for (let iz = -nz; iz <= nz; iz++) {
        const x = ix * step;
        const z = iz * step;
        // Skip the central die cavity (die + steps + seal frame + bond wires);
        // the +3.4 clearance keeps the innermost pins clear of the glass frame.
        if (Math.abs(x) < dieHX + 3.4 && Math.abs(z) < dieHZ + 3.4) continue;
        list.push({ x, z });
      }
    }
    return list;
  }, [pkgHW, pkgHD, dieHX, dieHZ, reduced]);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.rotation.set(0, 0, 0);
      dummy.position.set(p.x, baseY + 0.04, p.z);
      dummy.updateMatrix();
      baseRef.current.setMatrixAt(i, dummy.matrix);
      dummy.position.set(p.x, baseY + 0.08 + shaftH / 2, p.z);
      dummy.updateMatrix();
      shaftRef.current.setMatrixAt(i, dummy.matrix);
      dummy.position.set(p.x, baseY + 0.08 + shaftH, p.z);
      dummy.updateMatrix();
      headRef.current.setMatrixAt(i, dummy.matrix);
    });
    baseRef.current.instanceMatrix.needsUpdate = true;
    shaftRef.current.instanceMatrix.needsUpdate = true;
    headRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, baseY]);

  return (
    <group>
      {/* solder base pad */}
      <instancedMesh ref={baseRef} args={[undefined, undefined, positions.length]}>
        <cylinderGeometry args={[0.24, 0.28, 0.1, 12]} />
        <meshStandardMaterial color="#b8923e" metalness={1} roughness={0.32} transparent opacity={opacity} />
      </instancedMesh>
      {/* upward pin shaft — climbing-light shader (Power-On) on desktop */}
      <instancedMesh ref={shaftRef} args={[shaftGeo, shaftMat, positions.length]} />
      {/* rounded pin tip */}
      <instancedMesh ref={headRef} args={[undefined, undefined, positions.length]}>
        <sphereGeometry args={[0.11, 10, 8]} />
        <meshStandardMaterial color={GOLD_BRIGHT} emissive={GOLD} emissiveIntensity={0.25} metalness={1} roughness={0.16} transparent opacity={opacity} />
      </instancedMesh>
    </group>
  );
}

function InstancedFanout({
  traces,
  y,
  opacity,
}: {
  traces: { cx: number; cz: number; len: number; angle: number; w: number }[];
  y: number;
  opacity: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null!);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    traces.forEach((t, i) => {
      dummy.position.set(t.cx, y, t.cz);
      dummy.rotation.set(0, -t.angle, 0);
      dummy.scale.set(t.len, 0.012, t.w);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [traces, y]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, traces.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.4 * opacity} metalness={0.95} roughness={0.2} transparent opacity={0.85 * opacity} />
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
      dummy.position.set(cap.x, -0.47, cap.z);
      dummy.rotation.set(0, cap.rot, 0);
      dummy.updateMatrix();
      bodyRef.current.setMatrixAt(i, dummy.matrix);

      // Two solder terminals at local x = ±0.23, rotated into place
      [-0.23, 0.23].forEach((off, j) => {
        const c = Math.cos(cap.rot);
        const s = Math.sin(cap.rot);
        dummy.position.set(cap.x + off * c, -0.468, cap.z - off * s);
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
