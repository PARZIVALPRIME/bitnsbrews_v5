import * as THREE from "three";
import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Html, Line } from "@react-three/drei";
import type { Block } from "./data";
import { useQuality } from "./quality";
import { ThermalShader } from "./shaders";
import { BlockDetail } from "./PlaygroundDetails";
import { getTrackForBlock } from "../articles";

const AMBER = "#e8a23a";
const AMBER_C = new THREE.Color(AMBER);
const GAP = 0.08;

// Pre-built cheap edge geometry for potato mode: 12 lines, one draw call.
const MOBILE_EDGE_GEO = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));

export function SocBlock({
  block,
  t,
  showLabels: _showLabels,
  selected,
  onSelect,
  dimmed,
  modeUtilization,
  visMode = "physical",
  opacity = 1,
  focused: _focused = false,
  level = 3,
  galleryPulse = false,
  liftScale = 1.0,
}: {
  block: Block;
  t: number;
  showLabels?: boolean;
  selected: boolean;
  onSelect: (id: string | null) => void;
  dimmed: boolean;
  modeUtilization: number;
  visMode?: string;
  opacity?: number;
  focused?: boolean;
  level?: number;
  galleryPulse?: boolean;
  liftScale?: number;
}) {
  const quality = useQuality();
  const isMobile = quality === "mobile";

  const [hovered, setHovered] = useState(false);

  const liftGroup = useRef<THREE.Group>(null!);
  const rod = useRef<THREE.Mesh>(null!);
  const bodyMat = useRef<THREE.MeshStandardMaterial>(null!);
  const capMat = useRef<THREE.MeshStandardMaterial>(null!);
  const outlineMat = useRef<THREE.LineBasicMaterial>(null!);
  const thermalMat = useRef<THREE.ShaderMaterial>(null!);

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

  const thermalUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uUtilization: { value: 0 },
      uBaseColor: { value: new THREE.Color(block.color) },
    }),
    [block.color]
  );

  useFrame((state) => {
    if (isMobile) {
      frameSkip.current = (frameSkip.current + 1) % 2;
    }
    const doMatUpdate = !isMobile || frameSkip.current === 0;

    cur.current += (t - cur.current) * (isMobile ? 0.16 : 0.12);
    utilCur.current += (modeUtilization - utilCur.current) * (isMobile ? 0.08 : 0.06);
    hoverCur.current += ((hovered && !dimmed ? 1 : 0) - hoverCur.current) * 0.15;
    selectCur.current += ((selected ? 1 : 0) - selectCur.current) * 0.14;

    // Snap to targets once close enough. Without this the asymptotic lerp never
    // reaches t exactly, the settled early-return below never fires, and every
    // block keeps dirtying its matrix + materials every frame forever.
    if (Math.abs(t - cur.current) < 0.001) cur.current = t;
    if (Math.abs(modeUtilization - utilCur.current) < 0.001) utilCur.current = modeUtilization;
    if (Math.abs((selected ? 1 : 0) - selectCur.current) < 0.001) selectCur.current = selected ? 1 : 0;
    if (Math.abs((hovered ? 1 : 0) - hoverCur.current) < 0.001) hoverCur.current = hovered ? 1 : 0;

    const y = cur.current * liftMax * liftScale;
    const microLift = utilCur.current * 0.25;
    const hoverLift = hoverCur.current * 0.5;
    const selectLift = selectCur.current * 0.3;

    const motion =
      Math.abs(t - cur.current) +
      Math.abs(modeUtilization - utilCur.current) +
      Math.abs((selected ? 1 : 0) - selectCur.current) +
      Math.abs((hovered ? 1 : 0) - hoverCur.current);
    const wasSettled = settled.current;
    settled.current = motion < 0.005;

    if (settled.current && wasSettled && cur.current === t) {
      // Still allow thermal uniform animation even when position is settled
      if (visMode === "thermal" && thermalMat.current) {
        thermalMat.current.uniforms.uTime.value = state.clock.getElapsedTime();
        thermalMat.current.uniforms.uUtilization.value = utilCur.current;
      }
      // Gallery knowledge-map mode: keep a slow emissive breathing pulse alive
      // (material-only write, geometry stays settled).
      if (galleryPulse && doMatUpdate && bodyMat.current) {
        const time = state.clock.getElapsedTime();
        const pulse = (Math.sin(time * 1.6 + cx * 0.7 + cz * 0.5) * 0.5 + 0.5) * 0.22;
        const dimF = dimmed ? 0.06 : 1;
        bodyMat.current.emissiveIntensity = (utilCur.current * 0.6 + pulse) * dimF * opacity;
        if (capMat.current) {
          capMat.current.emissiveIntensity = (utilCur.current * 0.36 + pulse * 0.8) * dimF * opacity;
        }
        if (outlineMat.current) {
          outlineMat.current.opacity = (dimmed ? 0.04 : 0.22 + pulse * 0.8) * opacity;
        }
      }
      return;
    }

    if (liftGroup.current) {
      // Clean vertical engineering lift — no mid-air wobble. The staggered
      // center-out timing supplies all the choreography this needs.
      liftGroup.current.position.y = y + microLift + hoverLift + selectLift;
    }

    if (rod.current) {
      const total = y + microLift + hoverLift + selectLift;
      const len = Math.max(0.001, total - 0.08);
      rod.current.scale.y = len;
      rod.current.position.y = 0.08 + len / 2;
      rod.current.visible = cur.current > 0.025;
    }

    if (visMode === "thermal" && thermalMat.current) {
      thermalMat.current.uniforms.uTime.value = state.clock.getElapsedTime();
      thermalMat.current.uniforms.uUtilization.value = utilCur.current;
    }

    if (doMatUpdate) {
      const util = utilCur.current;
      const hover = hoverCur.current;
      const sel = selectCur.current;
      const glow = util * 0.6 + hover * 0.3 + sel * 0.4;
      const dimFactor = dimmed ? (isMobile ? 0.35 : 0.06) : 1;
      const baseGlow = isMobile ? 0.08 : 0;

      if (bodyMat.current) {
        bodyMat.current.emissive.copy(AMBER_C);
        bodyMat.current.emissiveIntensity = (glow + baseGlow) * dimFactor * opacity;
        bodyMat.current.opacity = (dimmed ? (isMobile ? 0.35 : 0.15) + selectCur.current * 0.65 : 1) * opacity;
      }
      if (capMat.current) {
        capMat.current.emissive.copy(AMBER_C);
        capMat.current.emissiveIntensity = (glow * 0.6 + baseGlow) * dimFactor * opacity;
        capMat.current.opacity = (dimmed ? (isMobile ? 0.35 : 0.15) + selectCur.current * 0.65 : 1) * opacity;
      }
      if (outlineMat.current) {
        outlineMat.current.opacity = (dimmed ? 0.04 : 0.15 + util * 0.15 + hover * 0.3 + sel * 0.5) * opacity;
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

  // The Library (level 4): each main block carries one editorial track card.
  const track = useMemo(() => getTrackForBlock(block.id), [block.id]);
  const trackCardVisible = false; // Disabled: we show component names only on the die

  // Labels: only the 9 major (track-bearing) blocks get always-on labels — DOM
  // overlays are expensive, and 17 of them cluttered the floorplan anyway.
  // Any block still shows its label while selected. On Level 4, we show the component name labels.
  const labelVisible = (level <= 4) && (isMobile
    ? selected
    : (((level === 4 || _showLabels) && block.showLabel && !!track && !dimmed) || selected));

  return (
    <group position={[cx, 0, cz]}>
      {/* footprint ghost on die — only mounted while the block is lifted, so it
          costs nothing in the assembled state */}
      {!isMobile && t > 0.02 && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial color="#040608" transparent opacity={0.5} />
          <Edges threshold={15}>
            <lineBasicMaterial color={AMBER} transparent opacity={0.25} />
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
          {visMode === "thermal" ? (
            <shaderMaterial
              ref={thermalMat}
              vertexShader={ThermalShader.vertexShader}
              fragmentShader={ThermalShader.fragmentShader}
              uniforms={thermalUniforms}
            />
          ) : (
            <meshStandardMaterial
              ref={bodyMat}
              color={block.color}
              metalness={visMode === "logical" ? 0.95 : block.metalness}
              roughness={visMode === "logical" ? 0.15 : block.roughness}
              transparent={visMode === "logical" || dimmed}
              opacity={(dimmed ? (isMobile ? 0.35 : 0.15) + selectCur.current * 0.65 : visMode === "logical" ? 0.45 : 1) * opacity}
            />
          )}
          {!isMobile && (
            <Edges threshold={25} scale={1.002}>
              <lineBasicMaterial ref={outlineMat} color={AMBER} transparent opacity={selected ? 0.8 : 0.25} />
            </Edges>
          )}
        </mesh>

        {/* potato-mode cheap edge outline: 12 lines, 1 draw call */}
        {isMobile && (
          <lineSegments position={[0, h / 2, 0]} scale={[w, h, d]}>
            <primitive object={MOBILE_EDGE_GEO} attach="geometry" />
            <lineBasicMaterial ref={outlineMat} color={AMBER} transparent opacity={selected ? 0.65 : 0.3} />
          </lineSegments>
        )}

        {/* top cap — no shadow casting: it sits flush on the body */}
        {visMode !== "thermal" && (
          <mesh position={[0, h + 0.025, 0]}>
            <boxGeometry args={[Math.max(0.12, w - 0.08), 0.05, Math.max(0.12, d - 0.08)]} />
            <meshStandardMaterial
              ref={capMat}
              color={block.base}
              metalness={visMode === "logical" ? 0.95 : block.metalness + 0.05}
              roughness={visMode === "logical" ? 0.15 : Math.max(0.15, block.roughness - 0.08)}
              transparent={visMode === "logical" || dimmed}
              opacity={(dimmed ? (isMobile ? 0.35 : 0.15) + selectCur.current * 0.65 : visMode === "logical" ? 0.45 : 1) * opacity}
            />
          </mesh>
        )}

        {/* micro-architecture surface detail (SRAM arrays, shader grids, bump fields).
            PlaygroundDetails degrades itself on mobile (skips edges + wells), so it
            stays on in potato mode — the silhouette is what sells the silicon. */}
        {!dimmed && visMode !== "thermal" && <BlockDetail block={block} />}

        {/* architecture label */}
        {visMode !== "thermal" && labelVisible && (
          <>
            <Line
              points={[anchor, labelPt]}
              color={AMBER}
              lineWidth={1}
              transparent
              opacity={(selected ? 0.9 : 0.45) * opacity}
            />
            <mesh position={anchor}>
              <sphereGeometry args={[0.06, isMobile ? 6 : 10, isMobile ? 6 : 10]} />
              <meshBasicMaterial color={AMBER} transparent opacity={0.95 * opacity} />
            </mesh>
            <Html
              position={labelPt}
              center
              distanceFactor={28}
              zIndexRange={[100, 0]}
              occlude={false}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(selected ? null : block.id);
                }}
                onPointerOver={() => { if (!isMobile) document.body.style.cursor = "pointer"; }}
                onPointerOut={() => { if (!isMobile) document.body.style.cursor = "auto"; }}
                style={{ transform: "translateY(-50%)" }}
                className="pointer-events-auto select-none whitespace-nowrap cursor-pointer text-left block bg-transparent border-0 p-0"
              >
                <div
                  className="rounded-md px-1.5 py-0.5 hover:border-[#e8a23a]/50 transition-colors duration-200"
                  style={{
                    background: "rgba(6,8,12,0.92)",
                    border: `0.5px solid rgba(232,162,58,${selected ? 0.55 : 0.15})`,
                    boxShadow: selected
                      ? "0 0 10px rgba(232,162,58,0.18), 0 1px 3px rgba(0,0,0,0.55)"
                      : "0 1px 3px rgba(0,0,0,0.3)",
                    opacity: opacity,
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
              </button>
            </Html>
          </>
        )}

        {/* Track cards removed from die, component labels used instead */}

      </group>
    </group>
  );
}
