import * as THREE from "three";
import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import type { Block } from "./data";
import { useQuality } from "./quality";
import { ThermalShader } from "./shaders";
import { BlockArticle } from "./BlockArticle";
import { BlockMicroArchitecture } from "./BlockMicroArchitecture";

const AMBER = "#e8a23a";
const AMBER_C = new THREE.Color(AMBER);
const GAP = 0.08;

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
  focused = false,
  level = 3,
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
  const thermalMat = useRef<THREE.ShaderMaterial>(null!);

  const cur = useRef(0);
  const utilCur = useRef(0);
  const hoverCur = useRef(0);
  const selectCur = useRef(0);
  const settled = useRef(false);
  const frameSkip = useRef(0);

  const edgeStrip = block.detail === "lpddr" || block.detail === "ioring";
  const w = Math.max(0.1, block.w - (edgeStrip ? 0 : GAP));

  // Pseudo-random deterministic factors for rotational wobble based on block ID
  const hashX = useMemo(() => {
    let h = 0;
    for (let i = 0; i < block.id.length; i++) {
      h = (h << 5) - h + block.id.charCodeAt(i);
    }
    return (h % 10) / 10 >= 0.5 ? 1 : -1;
  }, [block.id]);

  const hashZ = useMemo(() => {
    let h = 0;
    for (let i = 0; i < block.id.length; i++) {
      h = (h << 3) - h + block.id.charCodeAt(i);
    }
    return (h % 10) / 10 >= 0.5 ? 1 : -1;
  }, [block.id]);

  const hashRotY = useMemo(() => {
    let h = 0;
    for (let i = 0; i < block.id.length; i++) {
      h = (h << 7) - h + block.id.charCodeAt(i);
    }
    return ((h % 10) / 10 - 0.5) * 0.15; // subtle yaw spin
  }, [block.id]);
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

    const y = cur.current * liftMax;
    const microLift = utilCur.current * 0.25;
    const hoverLift = hoverCur.current * 0.5;
    const selectLift = selectCur.current * 0.3;

    const motion =
      Math.abs(t - cur.current) +
      Math.abs(modeUtilization - utilCur.current) +
      Math.abs((selected ? 1 : 0) - selectCur.current) +
      Math.abs((hovered ? 1 : 0) - hoverCur.current);
    const wasSettled = settled.current;
    settled.current = motion < 0.0015;

    if (settled.current && wasSettled && cur.current === t) {
      // Still allow thermal uniform animation even when position is settled
      if (visMode === "thermal" && thermalMat.current) {
        thermalMat.current.uniforms.uTime.value = state.clock.getElapsedTime();
        thermalMat.current.uniforms.uUtilization.value = utilCur.current;
      }
      return;
    }

    if (liftGroup.current) {
      liftGroup.current.position.y = y + microLift + hoverLift + selectLift;
      
      // Calculate organic mid-air wobble tilt (peaks at 0.5 progress)
      const hProgress = cur.current;
      const tiltFactor = Math.sin(hProgress * Math.PI);
      liftGroup.current.rotation.x = tiltFactor * 0.08 * hashX;
      liftGroup.current.rotation.z = tiltFactor * 0.08 * hashZ;
      liftGroup.current.rotation.y = hProgress * hashRotY;
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
      if (plinthMat.current) {
        plinthMat.current.opacity = (dimmed ? 0.03 : 0.08 + sel * 0.25) * opacity;
      }
    }
  });

  return (
    <group position={[cx, 0, cz]}>
      {/* footprint ghost on die */}
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
        {/* dark plinth base */}
        <mesh position={[0, 0.03, 0]} castShadow={!isMobile}>
          <boxGeometry args={[w + 0.02, 0.06, d + 0.02]} />
          <meshStandardMaterial color="#030508" metalness={0.95} roughness={0.6} transparent opacity={dimmed ? 0.12 : 1} />
          <Edges threshold={isMobile ? 30 : 15} scale={1.001}>
            <lineBasicMaterial ref={plinthMat} color={AMBER} transparent opacity={0.08} />
          </Edges>
        </mesh>

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
              opacity={dimmed ? (isMobile ? 0.35 : 0.15) + selectCur.current * 0.65 : visMode === "logical" ? 0.45 : 1}
            />
          )}
          <Edges threshold={25} scale={1.002}>
            <lineBasicMaterial ref={outlineMat} color={AMBER} transparent opacity={selected ? 0.8 : 0.25} />
          </Edges>
        </mesh>

        {/* top cap & micro-architecture details */}
        {visMode !== "thermal" && (
          isMobile ? (
            <mesh position={[0, h + 0.025, 0]} castShadow={!isMobile}>
              <boxGeometry args={[Math.max(0.12, w - 0.08), 0.05, Math.max(0.12, d - 0.08)]} />
              <meshStandardMaterial
                ref={capMat}
                color={block.base}
                metalness={visMode === "logical" ? 0.95 : block.metalness + 0.05}
                roughness={visMode === "logical" ? 0.15 : Math.max(0.15, block.roughness - 0.08)}
                transparent={visMode === "logical" || dimmed}
                opacity={dimmed ? (isMobile ? 0.35 : 0.15) + selectCur.current * 0.65 : visMode === "logical" ? 0.45 : 1}
              />
              {!isMobile && (
                <Edges threshold={15} scale={1.001}>
                  <lineBasicMaterial color={AMBER} transparent opacity={dimmed ? 0.04 : 0.22} />
                </Edges>
              )}
            </mesh>
          ) : (
            <BlockMicroArchitecture
              block={block}
              w={w}
              d={d}
              h={h}
              dimmed={dimmed}
              opacity={opacity}
              utilization={modeUtilization}
            />
          )
        )}

        {/* 3D Co-spatial Article Card on top face of block */}
        <BlockArticle
          blockId={block.id}
          active={focused}
          blockW={w}
          blockD={d}
          blockH={h}
          level={level}
        />
      </group>
    </group>
  );
}
