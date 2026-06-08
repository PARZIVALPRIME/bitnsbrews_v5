import * as THREE from "three";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Html, Line } from "@react-three/drei";
import type { Block } from "./data";
import { BlockDetail } from "./PlaygroundDetails";
import { useQuality } from "./quality";

const AMBER = "#e8a23a";
const AMBER_C = new THREE.Color(AMBER);
const GAP = 0.08;

// Pre-built cheap edge geometry for mobile: 12 lines around a unit box.
const MOBILE_EDGE_GEO = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));

export function SocBlock({
  block,
  t,
  showLabels,
  selected,
  onSelect,
  dimmed,
  modeUtilization,
}: {
  block: Block;
  t: number;
  showLabels: boolean;
  selected: boolean;
  onSelect: (id: string | null) => void;
  dimmed: boolean;
  modeUtilization: number;
}) {
  const quality = useQuality();
  const isMobile = quality === "mobile";

  const [hovered, setHovered] = useState(false);

  const liftGroup = useRef<THREE.Group>(null!);
  const rod = useRef<THREE.Mesh>(null!);
  const bodyMat = useRef<THREE.MeshStandardMaterial>(null!);
  const capMat = useRef<THREE.MeshStandardMaterial>(null!);
  const outlineMat = useRef<THREE.LineBasicMaterial>(null!);
  const plinthMat = useRef<THREE.LineBasicMaterial>(null!);

  const cur = useRef(0);
  const utilCur = useRef(0);
  const hoverCur = useRef(0);
  const selectCur = useRef(0);
  const settled = useRef(false);
  const frameSkip = useRef(0);

  const edgeStrip = block.detail === "lpddr" || block.detail === "ioring";
  const w = Math.max(0.1, block.w - (edgeStrip ? 0 : GAP));
  const d = Math.max(0.1, block.d - (edgeStrip ? 0 : GAP));
  const h = block.h;
  const cx = block.cx;
  const cz = block.cz;
  const liftMax = block.lift;

  useFrame(() => {
    // On mobile, update materials every other frame to halve shader/material cost.
    if (isMobile) {
      frameSkip.current = (frameSkip.current + 1) % 2;
    }
    const doMatUpdate = !isMobile || frameSkip.current === 0;

    // Smooth all transitions
    const prevCur = cur.current;
    cur.current += (t - cur.current) * (isMobile ? 0.16 : 0.12);
    utilCur.current += (modeUtilization - utilCur.current) * (isMobile ? 0.08 : 0.06);
    hoverCur.current += ((hovered && !dimmed ? 1 : 0) - hoverCur.current) * 0.15;
    selectCur.current += ((selected ? 1 : 0) - selectCur.current) * 0.14;

    const y = cur.current * liftMax;
    const microLift = utilCur.current * 0.25;
    const hoverLift = hoverCur.current * 0.5;
    const selectLift = selectCur.current * 0.3;

    // Detect when everything has settled so we can idle (big mobile win)
    const motion =
      Math.abs(t - cur.current) +
      Math.abs(modeUtilization - utilCur.current) +
      Math.abs((selected ? 1 : 0) - selectCur.current) +
      Math.abs((hovered ? 1 : 0) - hoverCur.current);
    const wasSettled = settled.current;
    settled.current = motion < 0.0015;

    // If settled and nothing changed, skip all writes.
    if (settled.current && wasSettled && prevCur === cur.current) {
      return;
    }

    if (liftGroup.current) liftGroup.current.position.y = y + microLift + hoverLift + selectLift;

    if (rod.current) {
      const total = y + microLift + hoverLift + selectLift;
      const len = Math.max(0.001, total - 0.08);
      rod.current.scale.y = len;
      rod.current.position.y = 0.08 + len / 2;
      rod.current.visible = cur.current > 0.025;
    }

    if (doMatUpdate) {
      const util = utilCur.current;
      const hover = hoverCur.current;
      const sel = selectCur.current;
      const glow = util * 0.6 + hover * 0.3 + sel * 0.4;
      // On mobile, dimmed blocks are kept more visible so the architecture still reads.
      const dimFactor = dimmed ? (isMobile ? 0.35 : 0.06) : 1;

      // On mobile, add a small base emissive so nothing goes completely black.
      const baseGlow = isMobile ? 0.08 : 0;
      if (bodyMat.current) {
        bodyMat.current.emissive.copy(AMBER_C);
        bodyMat.current.emissiveIntensity = (glow + baseGlow) * dimFactor;
        bodyMat.current.opacity = dimmed ? (isMobile ? 0.35 : 0.15) + selectCur.current * 0.65 : 1;
      }
      if (capMat.current) {
        capMat.current.emissive.copy(AMBER_C);
        capMat.current.emissiveIntensity = (glow * 0.6 + baseGlow) * dimFactor;
        capMat.current.opacity = dimmed ? (isMobile ? 0.35 : 0.15) + selectCur.current * 0.65 : 1;
      }
      if (outlineMat.current) {
        outlineMat.current.opacity = dimmed ? 0.04 : 0.15 + util * 0.15 + hover * 0.3 + sel * 0.5;
      }
      if (plinthMat.current) {
        plinthMat.current.opacity = dimmed ? 0.03 : 0.08 + sel * 0.25;
      }
    }
  });

  const dir = block.labelDir ?? [0, 1.4, 0];
  const labelScale = 2.2;
  const anchor: [number, number, number] = [0, h + 0.08, 0];
  const labelPt: [number, number, number] = [
    dir[0] * labelScale,
    h + 0.08 + dir[1] * labelScale,
    dir[2] * labelScale,
  ];

  // On mobile, only show the label for the SELECTED block — DOM overlays are the
  // single biggest mobile cost. Desktop shows all labels when toggled on.
  const labelVisible = isMobile
    ? selected
    : (showLabels && block.showLabel && !dimmed) || selected;

  return (
    <group position={[cx, 0, cz]}>
      {/* footprint ghost on die — desktop only */}
      {!isMobile && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial color="#040608" transparent opacity={cur.current > 0.03 ? 0.5 : 0} />
          <Edges threshold={15}>
            <lineBasicMaterial color={AMBER} transparent opacity={cur.current > 0.03 ? 0.25 : 0} />
          </Edges>
        </mesh>
      )}

      {/* support rod */}
      <mesh ref={rod} visible={false}>
        <cylinderGeometry args={[0.03, 0.03, 1, isMobile ? 6 : 8]} />
        <meshStandardMaterial color="#8a6a2a" metalness={1} roughness={0.2} emissive={AMBER} emissiveIntensity={0.4} />
      </mesh>

      {/* lifting body group */}
      <group ref={liftGroup}>
        {/* dark plinth base — desktop only (mobile uses the body alone) */}
        {!isMobile && (
          <mesh position={[0, 0.03, 0]} castShadow>
            <boxGeometry args={[w + 0.02, 0.06, d + 0.02]} />
            <meshStandardMaterial color="#030508" metalness={0.95} roughness={0.6} transparent opacity={dimmed ? 0.12 : 1} />
            <Edges threshold={15} scale={1.001}>
              <lineBasicMaterial ref={plinthMat} color={AMBER} transparent opacity={0.08} />
            </Edges>
          </mesh>
        )}

        {/* main body */}
        <mesh
          position={[0, h / 2, 0]}
          castShadow={!isMobile}
          receiveShadow={!isMobile}
          onClick={(e) => { e.stopPropagation(); onSelect(selected ? null : block.id); }}
          onPointerOver={isMobile ? undefined : (e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
          onPointerOut={isMobile ? undefined : () => { setHovered(false); document.body.style.cursor = "auto"; }}
        >
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            ref={bodyMat}
            color={block.color}
            metalness={block.metalness}
            roughness={block.roughness}
            transparent
            opacity={1}
          />
          {!isMobile && (
            <Edges threshold={15} scale={1.002}>
              <lineBasicMaterial ref={outlineMat} color={AMBER} transparent opacity={0.15} />
            </Edges>
          )}
        </mesh>

        {/* mobile-only cheap edge outline: 12 lines, 1 draw call */}
        {isMobile && (
          <lineSegments position={[0, h / 2, 0]} scale={[w, h, d]}>
            <primitive object={MOBILE_EDGE_GEO} attach="geometry" />
            <lineBasicMaterial color={AMBER} transparent opacity={selected ? 0.65 : 0.3} />
          </lineSegments>
        )}

        {/* top cap — beveled feel */}
        <mesh position={[0, h + 0.025, 0]} castShadow={!isMobile}>
          <boxGeometry args={[Math.max(0.12, w - 0.08), 0.05, Math.max(0.12, d - 0.08)]} />
          <meshStandardMaterial
            ref={capMat}
            color={block.base}
            metalness={block.metalness + 0.05}
            roughness={Math.max(0.15, block.roughness - 0.08)}
            transparent
            opacity={1}
          />
          {!isMobile && (
            <Edges threshold={15} scale={1.001}>
              <lineBasicMaterial color={AMBER} transparent opacity={dimmed ? 0.04 : 0.22} />
            </Edges>
          )}
        </mesh>

        {/* surface detail */}
        {!dimmed && <BlockDetail block={block} />}

        {/* architecture label */}
        {labelVisible && (
          <>
            <Line
              points={[anchor, labelPt]}
              color={AMBER}
              lineWidth={1}
              transparent
              opacity={selected ? 0.9 : 0.45}
            />
            <mesh position={anchor}>
              <sphereGeometry args={[0.06, isMobile ? 6 : 10, isMobile ? 6 : 10]} />
              <meshBasicMaterial color={AMBER} transparent opacity={0.95} />
            </mesh>
            <Html
              position={labelPt}
              center
              distanceFactor={28}
              zIndexRange={[100, 0]}
              occlude={false}
            >
              <div
                style={{ transform: "translateY(-50%)" }}
                className="pointer-events-none select-none whitespace-nowrap"
              >
                <div
                  className="rounded-md px-1.5 py-0.5"
                  style={{
                    background: "rgba(6,8,12,0.9)",
                    backdropFilter: isMobile ? "none" : "blur(6px)",
                    border: `0.5px solid rgba(232,162,58,${selected ? 0.55 : 0.15})`,
                    boxShadow: selected
                      ? "0 0 10px rgba(232,162,58,0.18), 0 1px 3px rgba(0,0,0,0.55)"
                      : "0 1px 3px rgba(0,0,0,0.3)",
                  }}
                >
                  <div
                    className="font-bold uppercase tracking-[0.13em] leading-none"
                    style={{
                      color: selected ? "#f0d090" : "#c8bba5",
                      fontSize: selected ? "8px" : "7px",
                    }}
                  >
                    {block.name}
                  </div>
                  {selected && (
                    <div
                      className="mt-0.5 font-light tracking-wide leading-none"
                      style={{ color: "#8a8072", fontSize: "6px" }}
                    >
                      {block.fn}
                    </div>
                  )}
                  <div
                    className="mt-px font-mono tracking-widest leading-none"
                    style={{ color: selected ? "#e8a23a" : "#5a5448", fontSize: "5.5px" }}
                  >
                    {block.w.toFixed(1)}×{block.d.toFixed(1)}×{h.toFixed(1)}u
                  </div>
                </div>
              </div>
            </Html>
          </>
        )}
      </group>
    </group>
  );
}
