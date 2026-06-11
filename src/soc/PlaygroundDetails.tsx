import * as THREE from "three";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { ReactElement } from "react";
import { Edges } from "@react-three/drei";
import type { Block } from "./data";
import { useQuality } from "./quality";

const AMBER = "#c79a4e";

function metal(color: string, roughness = 0.34, metalness = 0.96) {
  return { color, roughness, metalness } as const;
}

function SectionPad({
  x,
  z,
  w,
  d,
  y,
  h,
  color,
  edge,
  inner: _inner = "#07090d",
  edgeOpacity = 0.65,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  y: number;
  h: number;
  color: string;
  edge: string;
  inner?: string;
  edgeOpacity?: number;
}) {
  const isMobile = useQuality() === "mobile";
  return (
    // Micro-geometry never casts shadows — the parent block's silhouette already
    // covers it. The recessed inner well was dropped too: it was a separate mesh
    // per pad (~50 extra draw calls) for a barely-visible dark inset.
    <mesh position={[x, y + h / 2, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial {...metal(color, 0.28)} />
      {!isMobile && (
        <Edges threshold={15} scale={1.001}>
          <lineBasicMaterial color={edge} transparent opacity={edgeOpacity} />
        </Edges>
      )}
    </mesh>
  );
}

function PanelGrid({
  w,
  d,
  top,
  cols,
  rows,
  gap = 0.18,
  margin = 0.45,
  raise = 0.14,
  color,
  edge,
  edgeOpacity = 0.55,
}: {
  w: number;
  d: number;
  top: number;
  cols: number;
  rows: number;
  gap?: number;
  margin?: number;
  raise?: number;
  color: string;
  edge: string;
  edgeOpacity?: number;
}) {
  const innerW = w - margin * 2;
  const innerD = d - margin * 2;
  const padW = (innerW - gap * (cols - 1)) / cols;
  const padD = (innerD - gap * (rows - 1)) / rows;
  const items: ReactElement[] = [];

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = -innerW / 2 + padW / 2 + c * (padW + gap);
      const z = -innerD / 2 + padD / 2 + r * (padD + gap);
      items.push(
        <SectionPad
          key={`${c}-${r}`}
          x={x}
          z={z}
          w={padW}
          d={padD}
          y={top}
          h={raise}
          color={color}
          edge={edge}
          edgeOpacity={edgeOpacity}
        />,
      );
    }
  }

  return <group>{items}</group>;
}

function RibField({
  w,
  d,
  top,
  axis,
  pitch,
  ribFraction = 0.5,
  raise = 0.08,
  color,
  margin = 0.3,
}: {
  w: number;
  d: number;
  top: number;
  axis: "x" | "z";
  pitch: number;
  ribFraction?: number;
  raise?: number;
  color: string;
  margin?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const data = useMemo(() => {
    const along = axis === "x" ? d - margin * 2 : w - margin * 2;
    const ribLen = axis === "x" ? w - margin * 2 : d - margin * 2;
    const count = Math.max(2, Math.floor(along / pitch));
    const ribW = pitch * ribFraction;
    const start = -along / 2 + (along - (count - 1) * pitch) / 2;
    const mats: THREE.Matrix4[] = [];
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      const off = start + i * pitch;
      if (axis === "x") {
        p.set(0, top + raise / 2, off);
        s.set(ribLen, raise, ribW);
      } else {
        p.set(off, top + raise / 2, 0);
        s.set(ribW, raise, ribLen);
      }
      mats.push(new THREE.Matrix4().compose(p, q, s));
    }

    return mats;
  }, [w, d, top, axis, pitch, ribFraction, raise, margin]);

  useLayoutEffect(() => {
    data.forEach((m, i) => ref.current.setMatrixAt(i, m));
    ref.current.instanceMatrix.needsUpdate = true;
  }, [data]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, data.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial {...metal(color, 0.26)} />
    </instancedMesh>
  );
}

function BumpField({
  w,
  d,
  top,
  spacing = 0.34,
  radius = 0.1,
  raise = 0.1,
  color,
  margin = 0.28,
}: {
  w: number;
  d: number;
  top: number;
  spacing?: number;
  radius?: number;
  raise?: number;
  color: string;
  margin?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const data = useMemo(() => {
    const innerW = w - margin * 2;
    const innerD = d - margin * 2;
    const cols = Math.max(1, Math.floor(innerW / spacing));
    const rows = Math.max(1, Math.floor(innerD / spacing));
    const sx = (innerW - (cols - 1) * spacing) / 2 - innerW / 2;
    const sz = (innerD - (rows - 1) * spacing) / 2 - innerD / 2;
    const mats: THREE.Matrix4[] = [];
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(radius, raise, radius);
    const p = new THREE.Vector3();

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        p.set(sx + c * spacing, top + raise / 2, sz + r * spacing);
        mats.push(new THREE.Matrix4().compose(p, q, s));
      }
    }

    return mats;
  }, [w, d, top, spacing, radius, raise, margin]);

  useLayoutEffect(() => {
    data.forEach((m, i) => ref.current.setMatrixAt(i, m));
    ref.current.instanceMatrix.needsUpdate = true;
  }, [data]);

  const isMobile = useQuality() === "mobile";
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, data.length]}>
      <cylinderGeometry args={[1, 1, 1, isMobile ? 6 : 10]} />
      <meshStandardMaterial {...metal(color, 0.32)} />
    </instancedMesh>
  );
}

export function BlockDetail({ block }: { block: Block }) {
  const { w, d, h, detail } = block;

  switch (detail) {
    case "cpuBig": {
      // Brief: 3 horizontal cells; right 25% of each row has slightly raised L2 sub-block.
      const colW = w * 0.7;
      const cacheW = w * 0.2;
      const segD = (d - 0.7) / 3;
      return (
        <group>
          {/* 3 compute cells */}
          {[-1, 0, 1].map((i) => (
            <SectionPad
              key={i}
              x={-w * 0.15}
              z={i * (segD + 0.04)}
              w={colW}
              d={segD}
              y={h}
              h={0.32 + (i === 0 ? 0.04 : 0)}
              color="#1e2c48"
              edge={AMBER}
              inner="#080d18"
              edgeOpacity={0.7}
            />
          ))}
          {/* Raised L2 sub-blocks on right ~20% of each row */}
          {[-1, 0, 1].map((i) => (
            <SectionPad
              key={`cache-${i}`}
              x={w * 0.28}
              z={i * (segD + 0.04)}
              w={cacheW}
              d={segD * 0.55}
              y={h + 0.25}
              h={0.18}
              color="#253a5c"
              edge={AMBER}
              inner="#0b1424"
              edgeOpacity={0.75}
            />
          ))}
          {/* thin horizontal groove */}
          <mesh position={[-w * 0.15, h + 0.02, 0]}>
            <boxGeometry args={[w * 0.65, 0.025, d - 0.4]} />
            <meshStandardMaterial {...metal("#0a1220", 0.6)} />
          </mesh>
        </group>
      );
    }

    case "cpuEff": {
      // Brief: 4 cells in a 2×2 grid with the same groove language, smaller scale.
      return (
        <group>
          <PanelGrid
            w={w}
            d={d}
            top={h}
            cols={2}
            rows={2}
            gap={0.22}
            raise={0.2}
            color="#1a2844"
            edge={AMBER}
            margin={0.4}
            edgeOpacity={0.55}
          />
          <mesh position={[0, h + 0.015, 0]}>
            <boxGeometry args={[w - 0.5, 0.02, d - 0.5]} />
            <meshStandardMaterial {...metal("#0a1220", 0.6)} />
          </mesh>
        </group>
      );
    }

    case "gpu": {
      // Brief: 4×2 (or 4-column × 4-row) grid of slightly recessed rectangular shader panels
      // plus a lower GPU L2 cache band at the bottom.
      const shaderH = d - 1.9;
      return (
        <group>
          {/* Shader clusters — 4 columns × 2 rows of recessed panels (brief spec: 4x2) */}
          <PanelGrid
            w={w}
            d={shaderH}
            top={h}
            cols={4}
            rows={2}
            gap={0.2}
            raise={0.08}
            color="#1d1331"
            edge={AMBER}
            margin={0.35}
            edgeOpacity={0.45}
          />
          {/* subtle darker bevel plate around the shader area */}
          <mesh position={[0, h + 0.01, 0]}>
            <boxGeometry args={[w - 0.1, 0.04, shaderH - 0.1]} />
            <meshStandardMaterial {...metal("#100820", 0.4)} />
          </mesh>
          {/* Lower GPU L2 cache band across the full width */}
          <SectionPad
            x={0}
            z={d / 2 - 1.9 / 2}
            w={w - 0.3}
            d={1.5}
            y={h}
            h={0.12}
            color="#1b1129"
            edge={AMBER}
            inner="#070412"
            edgeOpacity={0.45}
          />
          {/* tiny groove below cache band to separate from block edge */}
          <mesh position={[0, h + 0.005, d / 2 - 0.1]}>
            <boxGeometry args={[w - 0.1, 0.015, 0.04]} />
            <meshStandardMaterial {...metal("#050408", 0.6)} />
          </mesh>
        </group>
      );
    }

    case "npu": {
      // Brief: dense horizontal line texture (SRAM/MAC array),
      // one horizontal groove at 60% dividing compute (top) from weight SRAM (bottom).
      return (
        <group>
          {/* base surface tone */}
          <mesh position={[0, h + 0.02, 0]}>
            <boxGeometry args={[w - 0.2, 0.04, d - 0.2]} />
            <meshStandardMaterial {...metal("#23090f", 0.48)} />
          </mesh>
          {/* horizontal line (z-axis ribs, read as horizontal lines from isometric view) */}
          <RibField
            w={w - 0.4}
            d={d - 0.4}
            top={h + 0.04}
            axis="z"
            pitch={0.22}
            ribFraction={0.52}
            raise={0.07}
            color="#3a0d18"
            margin={0.1}
          />
          {/* dividing groove at ~60% (top ~60% = compute, bottom ~40% = weight SRAM) */}
          <mesh position={[0, h + 0.08, -d * 0.12]}>
            <boxGeometry args={[w - 0.25, 0.06, 0.06]} />
            <meshStandardMaterial {...metal("#050304", 0.7)} />
          </mesh>
          {/* amber boundary hairline to show the two halves visually */}
          <mesh position={[0, h + 0.12, -d * 0.12]}>
            <boxGeometry args={[w - 0.35, 0.006, 0.015]} />
            <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={0.6} />
          </mesh>
        </group>
      );
    }

    case "modem": {
      // Brief: slightly recessed, with a thin amber trace running along the top perimeter (RF shield).
      return (
        <group>
          <SectionPad
            x={0}
            z={0}
            w={w - 0.3}
            d={d - 0.3}
            y={h}
            h={0.12}
            color="#3a1d08"
            edge={AMBER}
            inner="#0a0604"
            edgeOpacity={0.45}
          />
          {/* subtle 2x2 tile inside for RF visual */}
          <PanelGrid
            w={w - 0.6}
            d={d - 0.6}
            top={h + 0.1}
            cols={2}
            rows={2}
            gap={0.24}
            raise={0.05}
            color="#5a2c0d"
            edge={AMBER}
            margin={0.15}
            edgeOpacity={0.3}
          />
          {/* amber perimeter trace */}
          <mesh position={[0, h + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[Math.min(w, d) * 0.42, Math.min(w, d) * 0.44, 48]} />
            <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={0.55} side={THREE.DoubleSide} transparent opacity={0.75} />
          </mesh>
        </group>
      );
    }

    case "isp": {
      // Brief: three horizontal pipeline-stage bands representing the ISP pipeline.
      return (
        <group>
          <SectionPad
            x={0}
            z={-d * 0.28}
            w={w - 0.3}
            d={d * 0.24}
            y={h}
            h={0.1}
            color="#0f3024"
            edge={AMBER}
            inner="#050e0a"
            edgeOpacity={0.4}
          />
          <SectionPad
            x={0}
            z={0}
            w={w - 0.3}
            d={d * 0.32}
            y={h}
            h={0.14}
            color="#143a28"
            edge={AMBER}
            inner="#061110"
            edgeOpacity={0.45}
          />
          <SectionPad
            x={0}
            z={d * 0.3}
            w={w - 0.3}
            d={d * 0.22}
            y={h}
            h={0.09}
            color="#0d2a1e"
            edge={AMBER}
            inner="#040a08"
            edgeOpacity={0.38}
          />
          {/* subtle horizontal rib lines across the whole block for pipeline feel */}
          <RibField
            w={w - 0.4}
            d={d - 0.4}
            top={h + 0.14}
            axis="x"
            pitch={0.45}
            ribFraction={0.45}
            raise={0.035}
            color="#1c4a36"
            margin={0.15}
          />
        </group>
      );
    }

    case "dsp": {
      // Brief: cleaner than ISP — a simple tile pattern, no bands.
      return (
        <group>
          <PanelGrid
            w={w - 0.1}
            d={d - 0.1}
            top={h}
            cols={3}
            rows={1}
            gap={0.18}
            raise={0.12}
            color="#113828"
            edge={AMBER}
            margin={0.25}
            edgeOpacity={0.42}
          />
        </group>
      );
    }

    case "video": {
      // Brief: shorter than DSP; channels-style patterning for en/decoder.
      return (
        <group>
          <SectionPad
            x={0}
            z={0}
            w={w - 0.25}
            d={d - 0.25}
            y={h}
            h={0.08}
            color="#0f3021"
            edge={AMBER}
            inner="#040908"
            edgeOpacity={0.35}
          />
          <RibField
            w={w - 0.5}
            d={d - 0.5}
            top={h + 0.08}
            axis="z"
            pitch={0.28}
            ribFraction={0.42}
            raise={0.06}
            color="#184a32"
            margin={0.16}
          />
        </group>
      );
    }

    case "slc": {
      // Brief: wide and flat; subtle horizontal banding suggesting SRAM rows;
      // when active it should feel like a highway glowing across the die.
      return (
        <group>
          <SectionPad
            x={0}
            z={0}
            w={w - 0.3}
            d={d - 0.2}
            y={h}
            h={0.08}
            color="#102236"
            edge={AMBER}
            inner="#040a14"
            edgeOpacity={0.35}
          />
          {/* dominant horizontal ribs across the whole SLC — "highway" */}
          <RibField
            w={w - 0.5}
            d={d - 0.4}
            top={h + 0.08}
            axis="x"
            pitch={0.28}
            ribFraction={0.55}
            raise={0.07}
            color="#1a3a58"
            margin={0.15}
          />
          {/* amber centerline */}
          <mesh position={[0, h + 0.13, 0]}>
            <boxGeometry args={[w - 1.0, 0.01, 0.02]} />
            <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={0.8} transparent opacity={0.9} />
          </mesh>
        </group>
      );
    }

    case "memctrl": {
      // Brief: almost no visual feature — it is infrastructure.
      // 4 subtle stripes representing the 4 LPDDR5x channels.
      return (
        <group>
          <mesh position={[0, h + 0.015, 0]}>
            <boxGeometry args={[w - 0.15, 0.03, d - 0.15]} />
            <meshStandardMaterial {...metal("#091420", 0.6)} />
          </mesh>
          {[-0.35, -0.1, 0.15, 0.4].map((u, i) => (
            <SectionPad
              key={i}
              x={u * w}
              z={0}
              w={w * 0.18}
              d={d - 0.4}
              y={h + 0.03}
              h={0.045}
              color="#14293e"
              edge={AMBER}
              inner="#061018"
              edgeOpacity={0.18}
            />
          ))}
        </group>
      );
    }

    case "pmu": {
      // Brief: concentric ring texture (power rails) + vertical center rail always glowing.
      return (
        <group>
          <mesh position={[0, h + 0.02, 0]}>
            <boxGeometry args={[w - 0.3, 0.04, d - 0.3]} />
            <meshStandardMaterial {...metal("#12110b", 0.5)} />
          </mesh>
          {/* central amber vertical spine running the full column */}
          <mesh position={[0, h + 0.06, 0]}>
            <boxGeometry args={[0.08, 0.1, d - 0.6]} />
            <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={1.0} transparent opacity={0.9} />
          </mesh>
          {/* concentric rings at several stations down the column */}
          {[-5.2, -2.6, 0, 2.6, 5.2].map((z, i) => (
            <group key={i} position={[0, h + 0.07, z]}>
              {[0.48, 0.3, 0.16].map((rad, j) => (
                <mesh key={j} rotation={[-Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[rad, 0.035, 8, 32]} />
                  <meshStandardMaterial
                    color={j === 0 ? "#6f5522" : "#3c2e12"}
                    emissive={AMBER}
                    emissiveIntensity={j === 0 ? 0.3 : 0.12}
                    metalness={0.7}
                    roughness={0.35}
                  />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      );
    }

    case "lpddr": {
      // Brief: near-flat slabs. Top surface: small oval/round bump pattern at regular
      // intervals (C4 bump abstraction). 4 rows of bumps per channel. Darkest color.
      return (
        <group>
          {/* subtle base */}
          <mesh position={[0, h + 0.01, 0]}>
            <boxGeometry args={[w - 0.15, 0.025, d - 0.15]} />
            <meshStandardMaterial {...metal("#05080c", 0.6)} />
          </mesh>
          {/* 4 rows of small bumps */}
          <BumpField
            w={w - 0.2}
            d={d - 0.2}
            top={h + 0.02}
            spacing={0.28}
            radius={0.07}
            raise={0.07}
            color="#a5823a"
            margin={0.22}
          />
        </group>
      );
    }

    case "ioring": {
      // Brief: lowest profile; reads as the "scribe line" — a thin amber hairline.
      return (
        <group>
          <mesh position={[0, h + 0.01, 0]}>
            <boxGeometry args={[w - 0.1, 0.02, d - 0.1]} />
            <meshStandardMaterial {...metal("#0a0a08", 0.7)} />
          </mesh>
          <mesh position={[0, h + 0.025, 0]}>
            <boxGeometry args={[w - 0.25, 0.012, 0.02]} />
            <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={1.0} transparent opacity={0.95} />
          </mesh>
        </group>
      );
    }

    default:
      return null;
  }
}
