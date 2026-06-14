import * as THREE from "three";
import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Html, Line } from "@react-three/drei";
import { accentFor, type Block } from "./data";
import { useQuality } from "./quality";
import { ThermalShader } from "./shaders";
import { BlockDetail } from "./PlaygroundDetails";
import { getTrackForBlock, ARTICLE_BLOCK_IDS } from "../articles";
import { globalLevelState } from "./levelManager";

// Physical copper tone — support rods and metal hardware only.
const COPPER = "#c79a4e";
const GAP = 0.08;

// Pre-built cheap edge geometry for potato mode: 12 lines, one draw call.
const MOBILE_EDGE_GEO = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));

export function SocBlock({
  block,
  selected,
  onSelect,
  dimmed,
  modeUtilization,
  visMode = "physical",
  t: playgroundT,
  showPlayground = false,
  playgroundShowLabels = true,
}: {
  block: Block;
  selected: boolean;
  onSelect: (id: string | null) => void;
  dimmed: boolean;
  modeUtilization: number;
  visMode?: string;
  t?: number;
  showPlayground?: boolean;
  playgroundShowLabels?: boolean;
}) {
  const quality = useQuality();
  const isMobile = quality === "mobile";

  // Domain accent: each block family glows in its own color instead of a
  // uniform amber — the die doubles as its own legend.
  const accent = accentFor(block);
  const accentC = useMemo(() => new THREE.Color(accent), [accent]);

  const [hovered, setHovered] = useState(false);
  const [level, setLevel] = useState(1);
  const [btnHovered, setBtnHovered] = useState(false);

  const liftGroup = useRef<THREE.Group>(null!);
  const rod = useRef<THREE.Mesh>(null!);
  const bodyMat = useRef<THREE.MeshStandardMaterial>(null!);
  const capMat = useRef<THREE.MeshStandardMaterial>(null!);
  const outlineMat = useRef<THREE.LineBasicMaterial>(null!);
  const thermalMat = useRef<THREE.ShaderMaterial>(null!);

  const labelLineRef = useRef<any>(null!);
  const labelSphereMatRef = useRef<THREE.MeshBasicMaterial>(null!);
  const labelDivRef = useRef<HTMLDivElement>(null!);

  const cur = useRef(0);
  const liftVel = useRef(0);
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
  const dist = useMemo(() => Math.sqrt(cx * cx + cz * cz), [cx, cz]);
  const isArticleBlock = useMemo(() => ARTICLE_BLOCK_IDS.has(block.id), [block.id]);
  const track = useMemo(() => getTrackForBlock(block.id), [block.id]);

  const thermalUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uUtilization: { value: 0 },
      uBaseColor: { value: new THREE.Color(block.color) },
    }),
    [block.color]
  );

  useFrame((state, delta) => {
    const levelFloat = globalLevelState.current;

    // Update local level state when it crosses integer boundary
    const currentLevel = Math.round(levelFloat);
    if (currentLevel !== level) {
      setLevel(currentLevel);
    }

    // Calculate smooth label opacity based on levelFloat
    let labelOpacity = 0;
    if (showPlayground) {
      labelOpacity = (playgroundShowLabels && block.showLabel) || selected ? 1.0 : 0.0;
    } else {
      // Transition from 2 to 3. We want labels to fade in from 2.4 and fade out by 3.6
      if (levelFloat >= 2.4 && levelFloat <= 3.6) {
        if (levelFloat >= 2.4 && levelFloat < 2.8) {
          labelOpacity = (levelFloat - 2.4) / 0.4;
        } else if (levelFloat >= 2.8 && levelFloat <= 3.2) {
          labelOpacity = 1.0;
        } else {
          labelOpacity = (3.6 - levelFloat) / 0.4;
        }
      }
      
      const shouldBeVisible = isMobile
        ? selected
        : ((block.showLabel && !!track && !dimmed) || selected);
      
      if (!shouldBeVisible) {
        labelOpacity = 0.0;
      }
    }

    // Direct opacity and visibility mutations on Three.js & DOM refs for locked 60fps scrolling
    if (labelLineRef.current && labelLineRef.current.material) {
      labelLineRef.current.material.opacity = (selected ? 0.9 : 0.45) * labelOpacity;
      labelLineRef.current.material.transparent = true;
      labelLineRef.current.visible = labelOpacity > 0.01;
    }
    if (labelSphereMatRef.current) {
      labelSphereMatRef.current.opacity = 0.95 * labelOpacity;
      labelSphereMatRef.current.visible = labelOpacity > 0.01;
    }
    if (labelDivRef.current) {
      labelDivRef.current.style.opacity = `${labelOpacity}`;
      labelDivRef.current.style.pointerEvents = labelOpacity > 0.15 ? "auto" : "none";
    }

    if (isMobile) {
      frameSkip.current = (frameSkip.current + 1) % 2;
    }
    const doMatUpdate = !isMobile || frameSkip.current === 0;

    // 1. Calculate gallery transition progress (Level 2 to Level 3)
    //    In playground mode, use the explode slider value directly.
    let staggeredT: number;
    let liftScale: number;
    if (showPlayground && playgroundT !== undefined) {
      // Playground mode: use explode factor with staggered delay for visual interest
      const normDist = Math.min(1.0, dist / 11.5);
      const delay = normDist * 0.25;
      const localT = Math.max(0, Math.min(1, (playgroundT - delay) / (1.0 - delay)));
      staggeredT = localT * localT * (3 - 2 * localT);
      liftScale = 1.15; // Wider spread in playground
    } else {
      const rampUp = Math.max(0, Math.min(1, (levelFloat - 2.05) / 0.85));
      const rampDown = Math.max(0, Math.min(1, (levelFloat - 3.1) / 0.8));
      const galleryT = rampUp * (1 - rampDown);
      const normDist = Math.min(1.0, dist / 11.5);
      const delay = normDist * 0.45;
      const localT = Math.max(0, Math.min(1, (galleryT - delay) / (1.0 - delay)));
      staggeredT = localT * localT * (3 - 2 * localT);
      // 3. Dynamic liftScale to shrink blocks as camera pulls back
      liftScale = 0.6 - Math.max(0, Math.min(1, levelFloat - 2.0)) * 0.15;
    }

    // 4. Spring physics solver step for physical block lift 'cur.current'
    const dt = Math.min(0.03, delta);
    const diff = cur.current - staggeredT;
    const accel = -160 * diff - 16 * liftVel.current; // k=160, c=16
    liftVel.current += accel * dt;
    cur.current += liftVel.current * dt;
    cur.current = Math.max(0, cur.current); // Clamp to prevent sinking through motherboard

    // Snap spring to target when close to let settled checks early-return
    if (Math.abs(cur.current - staggeredT) < 0.0005 && Math.abs(liftVel.current) < 0.002) {
      cur.current = staggeredT;
      liftVel.current = 0;
    }

    // 5. Outward-propagating boot-up ripple wave when entering level 2
    const introProgress = Math.max(0, Math.min(1, levelFloat - 1.0));
    const tWave = Math.max(0, (introProgress - 0.6) / 0.4);
    const waveFront = tWave * 12.0; // maxDist from center is ~11.5
    const waveWidth = 2.5;
    const distFromFront = Math.abs(dist - waveFront);
    const rippleActive = tWave > 0 && tWave < 1.25;
    const rippleFactor = rippleActive ? Math.max(0, 1.0 - distFromFront / waveWidth) * Math.sin(tWave * Math.PI) : 0;

    const rippleLift = rippleFactor * 0.22;
    const rippleGlow = rippleFactor * 1.8;

    // 6. Smoothly update standard indicators
    utilCur.current += (modeUtilization - utilCur.current) * (isMobile ? 0.08 : 0.06);
    hoverCur.current += ((hovered && !dimmed ? 1 : 0) - hoverCur.current) * 0.15;
    selectCur.current += ((selected ? 1 : 0) - selectCur.current) * 0.14;

    // Snap secondary indicators
    if (Math.abs(modeUtilization - utilCur.current) < 0.001) utilCur.current = modeUtilization;
    if (Math.abs((selected ? 1 : 0) - selectCur.current) < 0.001) selectCur.current = selected ? 1 : 0;
    if (Math.abs((hovered ? 1 : 0) - hoverCur.current) < 0.001) hoverCur.current = hovered ? 1 : 0;

    const y = cur.current * liftMax * liftScale;
    const microLift = utilCur.current * 0.25;
    const hoverLift = hoverCur.current * 0.5;
    const selectLift = selectCur.current * 0.3;
    const totalY = y + microLift + hoverLift + selectLift + rippleLift;

    const blockOpacity = 0.85 + 0.15 * Math.max(0, Math.min(1, levelFloat - 1.0));

    const motion =
      Math.abs(staggeredT - cur.current) +
      Math.abs(modeUtilization - utilCur.current) +
      Math.abs((selected ? 1 : 0) - selectCur.current) +
      Math.abs((hovered ? 1 : 0) - hoverCur.current) +
      rippleFactor;
    const wasSettled = settled.current;
    settled.current = motion < 0.005;

    // Gallery knowledge-map breathing pulse setting
    const galleryPulse = level === 3 && isArticleBlock && !isMobile;

    if (settled.current && wasSettled && cur.current === staggeredT) {
      if (visMode === "thermal" && thermalMat.current) {
        thermalMat.current.uniforms.uTime.value = state.clock.getElapsedTime();
        thermalMat.current.uniforms.uUtilization.value = utilCur.current;
      }
      if (galleryPulse && doMatUpdate && bodyMat.current) {
        const time = state.clock.getElapsedTime();
        const pulse = (Math.sin(time * 1.6 + cx * 0.7 + cz * 0.5) * 0.5 + 0.5) * 0.22;
        const dimF = dimmed ? 0.06 : 1;
        bodyMat.current.emissiveIntensity = (utilCur.current * 0.6 + pulse) * dimF * blockOpacity;
        if (capMat.current) {
          capMat.current.emissiveIntensity = (utilCur.current * 0.36 + pulse * 0.8) * dimF * blockOpacity;
        }
        if (outlineMat.current) {
          outlineMat.current.opacity = (dimmed ? 0.04 : 0.22 + pulse * 0.8) * blockOpacity;
        }
      }
      return;
    }

    if (liftGroup.current) {
      liftGroup.current.position.y = totalY;
    }

    if (rod.current) {
      const len = Math.max(0.001, totalY - 0.08);
      rod.current.scale.y = len;
      rod.current.position.y = 0.08 + len / 2;
      rod.current.visible = totalY > 0.025;
    }

    if (visMode === "thermal" && thermalMat.current) {
      thermalMat.current.uniforms.uTime.value = state.clock.getElapsedTime();
      thermalMat.current.uniforms.uUtilization.value = utilCur.current;
    }

    if (doMatUpdate) {
      const util = utilCur.current;
      const hover = hoverCur.current;
      const sel = selectCur.current;
      const glow = util * 0.6 + hover * 0.3 + sel * 0.4 + rippleGlow;
      const dimFactor = dimmed ? (isMobile ? 0.35 : 0.06) : 1;
      const baseGlow = isMobile ? 0.08 : 0;

      if (bodyMat.current) {
        bodyMat.current.emissive.copy(accentC);
        bodyMat.current.emissiveIntensity = (glow + baseGlow) * dimFactor * blockOpacity;
        bodyMat.current.opacity = (dimmed ? (isMobile ? 0.35 : 0.15) + selectCur.current * 0.65 : 1) * blockOpacity;
      }
      if (capMat.current) {
        capMat.current.emissive.copy(accentC);
        capMat.current.emissiveIntensity = (glow * 0.6 + baseGlow) * dimFactor * blockOpacity;
        capMat.current.opacity = (dimmed ? (isMobile ? 0.35 : 0.15) + selectCur.current * 0.65 : 1) * blockOpacity;
      }
      if (outlineMat.current) {
        outlineMat.current.opacity = (dimmed ? 0.04 : 0.15 + util * 0.15 + hover * 0.3 + sel * 0.5) * blockOpacity;
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

  const labelVisible = showPlayground
    ? (playgroundShowLabels && block.showLabel) || selected
    : (level >= 2 && level <= 3) && (isMobile
      ? selected
      : ((block.showLabel && !!track && !dimmed) || selected));

  return (
    <group position={[cx, 0, cz]}>
      {/* footprint ghost on die — only mounted while the block is lifted, so it
          costs nothing in the assembled state */}
      {!isMobile && level === 3 && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial color="#040608" transparent opacity={0.5} />
          <Edges threshold={15}>
            <lineBasicMaterial color="#9aa6ba" transparent opacity={0.2} />
          </Edges>
        </mesh>
      )}

      {/* support rod */}
      <mesh ref={rod} visible={false}>
        <cylinderGeometry args={[0.03, 0.03, 1, isMobile ? 6 : 8]} />
        <meshStandardMaterial color="#8a6a2a" metalness={1} roughness={0.2} emissive={COPPER} emissiveIntensity={0.3} />
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
              metalness={visMode === "logical" ? 0.95 : Math.min(0.92, block.metalness * 1.35)}
              roughness={visMode === "logical" ? 0.15 : Math.max(0.18, block.roughness * 0.55)}
              transparent={visMode === "logical" || dimmed}
              opacity={dimmed ? (isMobile ? 0.35 : 0.15) + selectCur.current * 0.65 : visMode === "logical" ? 0.45 : 1}
            />
          )}
          {!isMobile && (
            <Edges threshold={25} scale={1.002}>
              <lineBasicMaterial ref={outlineMat} color={accent} transparent opacity={selected ? 0.8 : 0.25} />
            </Edges>
          )}
        </mesh>

        {/* potato-mode cheap edge outline: 12 lines, 1 draw call */}
        {isMobile && (
          <lineSegments position={[0, h / 2, 0]} scale={[w, h, d]}>
            <primitive object={MOBILE_EDGE_GEO} attach="geometry" />
            <lineBasicMaterial ref={outlineMat} color={accent} transparent opacity={selected ? 0.65 : 0.3} />
          </lineSegments>
        )}

        {/* top cap — no shadow casting: it sits flush on the body */}
        {visMode !== "thermal" && (
          <mesh position={[0, h + 0.025, 0]}>
            <boxGeometry args={[Math.max(0.12, w - 0.08), 0.05, Math.max(0.12, d - 0.08)]} />
            <meshStandardMaterial
              ref={capMat}
              color={block.base}
              metalness={visMode === "logical" ? 0.95 : Math.min(0.95, block.metalness * 1.45)}
              roughness={visMode === "logical" ? 0.15 : Math.max(0.12, block.roughness * 0.45)}
              transparent={visMode === "logical" || dimmed}
              opacity={dimmed ? (isMobile ? 0.35 : 0.15) + selectCur.current * 0.65 : visMode === "logical" ? 0.45 : 1}
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
              ref={labelLineRef}
              points={[anchor, labelPt]}
              color={accent}
              lineWidth={1}
              transparent
              opacity={selected ? 0.9 : 0.45}
            />
            <mesh position={anchor}>
              <sphereGeometry args={[0.06, isMobile ? 6 : 10, isMobile ? 6 : 10]} />
              <meshBasicMaterial ref={labelSphereMatRef} color={accent} transparent opacity={0.95} />
            </mesh>
            <Html
              position={labelPt}
              center
              distanceFactor={32}
              zIndexRange={[100, 0]}
              occlude={false}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(block.id);
                }}
                onPointerOver={() => {
                  if (!isMobile) {
                    setBtnHovered(true);
                    document.body.style.cursor = "pointer";
                  }
                }}
                onPointerOut={() => {
                  if (!isMobile) {
                    setBtnHovered(false);
                    document.body.style.cursor = "auto";
                  }
                }}
                style={{
                  transform: btnHovered ? "translate3d(0, -50%, 0) scale(1.03)" : "translate3d(0, -50%, 0) scale(1.0)",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                className="pointer-events-auto select-none whitespace-nowrap cursor-pointer text-left block bg-transparent border-0 p-0"
              >
                <div
                  ref={labelDivRef}
                  className="rounded-xl px-4 py-3 transition-all duration-300 ease-out"
                  style={{
                    background: selected 
                      ? "rgba(18, 22, 33, 0.85)" 
                      : "rgba(11, 13, 18, 0.75)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: `1px solid ${selected ? accent : btnHovered ? `${accent}80` : "rgba(255,255,255,0.1)"}`,
                    boxShadow: selected 
                      ? `0 0 20px ${accent}40, inset 0 0 12px ${accent}20` 
                      : btnHovered 
                        ? `0 0 15px ${accent}25, 0 4px 12px rgba(0,0,0,0.4)` 
                        : "0 4px 16px rgba(0,0,0,0.5)",
                    transform: btnHovered ? "translateY(-2px)" : "translateY(0)",
                  }}
                >
                  <div
                    className="font-semibold tracking-tight text-white/95 leading-tight"
                    style={{
                      fontSize: selected ? "13px" : "11px",
                    }}
                  >
                    {block.name}
                  </div>
                  {selected && (
                    <div
                      className="mt-1.5 leading-relaxed text-white/60"
                      style={{ fontSize: "10px" }}
                    >
                      {block.fn}
                    </div>
                  )}
                  <div
                    className="mt-1 font-mono tracking-wider font-semibold text-[8.5px]"
                    style={{ color: selected ? accent : "rgba(226,232,244,0.4)" }}
                  >
                    {block.w.toFixed(1)}×{block.d.toFixed(1)}×{h.toFixed(1)}u · {block.detail.toUpperCase()}
                  </div>
                  {track && !selected && (
                    <div
                      className="mt-2.5 flex items-center gap-1.5 font-mono font-bold leading-none tracking-wider text-[8px] transition-transform duration-200"
                      style={{ color: accent }}
                    >
                      <span>EXPLORE MODULE</span>
                      <span className="text-[9px] transition-transform group-hover:translate-x-1">&rarr;</span>
                    </div>
                  )}
                  {track && selected && (
                    <div
                      className="mt-3 flex items-center gap-1.5 font-mono font-bold leading-none tracking-wider text-[8px] animate-pulse"
                      style={{ color: accent }}
                    >
                      <span>OPEN SYSTEM PORTAL</span>
                      <span className="text-[9px]">&rarr;</span>
                    </div>
                  )}
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
