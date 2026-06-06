import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer, Edges, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
import { BLOCKS, DIE_W, DIE_D, SocMode, UTILIZATION } from "./data";
import { SocBlock } from "./SocBlock";
import { getCameraParamsInterpolated } from "./levelManager";
import { PowerRailShader } from "./shaders";
import {
  ComputerCasing,
  PackageSubstrate,
  PipelineSimulation,
} from "./ProceduralModels";

const AMBER = "#e8a23a";

function getUtil(id: string, mode: SocMode): number {
  const table = UTILIZATION[id];
  return table ? table[mode] : 0.1;
}

function DieInterconnects({ opacity }: { opacity: number }) {
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
    
    return list;
  }, []);

  return (
    <group>
      {buses.map((bus, idx) => {
        const dx = bus.end[0] - bus.start[0];
        const dz = bus.end[2] - bus.start[2];
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);
        const cx = (bus.start[0] + bus.end[0]) / 2;
        const cz = (bus.start[2] + bus.end[2]) / 2;
        return (
          <mesh key={idx} position={[cx, bus.start[1], cz]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[len, 0.005, bus.width]} />
            <meshStandardMaterial
              color={bus.color}
              metalness={0.9}
              roughness={0.2}
              transparent
              opacity={0.35 * opacity}
              emissive={bus.color === AMBER ? AMBER : undefined}
              emissiveIntensity={bus.color === AMBER ? 0.35 : undefined}
            />
          </mesh>
        );
      })}
      
      {/* Grid of micro-vias on the die */}
      {Array.from({ length: 12 }).map((_, i) =>
        Array.from({ length: 10 }).map((_, j) => {
          const x = -10.0 + i * 1.8;
          const z = -8.0 + j * 1.7;
          if (Math.abs(x) < 1.0 && Math.abs(z) < 1.0) return null;
          return (
            <mesh key={`${i}-${j}`} position={[x, 0.015, z]}>
              <cylinderGeometry args={[0.03, 0.03, 0.01, 6]} />
              <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} transparent opacity={0.4 * opacity} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

/* =========================================================================
   DIE SUBSTRATE & BASE
   ========================================================================= */
function Die({ visMode, opacity = 1 }: { visMode: string; opacity?: number }) {
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
      {/* Die slab — Premium reflective silicon wafer */}
      <mesh position={[0, -0.3, 0]} receiveShadow castShadow>
        <boxGeometry args={[dieW, 0.6, dieD]} />
        <meshStandardMaterial
          color={visMode === "logical" ? "#030408" : "#0d111d"} // highly reflective slate-blue silicon
          metalness={visMode === "logical" ? 0.95 : 0.98}
          roughness={visMode === "logical" ? 0.25 : 0.1} // glossy polished clearcoat style
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
            <meshStandardMaterial 
              color="#060910" 
              metalness={0.9} 
              roughness={0.15} 
              transparent 
              opacity={opacity} 
            />
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
            opacity={opacity}
          />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================================
   CINEMATIC CAMERA SYSTEM
   ========================================================================= */
function CameraController({
  levelFloat,
  selectedBlockCoords,
}: {
  levelFloat: number;
  selectedBlockCoords: { cx: number; cz: number; h: number } | null;
}) {
  const { camera, controls } = useThree();
  const targetParams = useMemo(
    () => getCameraParamsInterpolated(levelFloat, selectedBlockCoords),
    [levelFloat, selectedBlockCoords]
  );

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. Slow micro-breathing drift (Teenage Engineering style)
    const driftX = Math.sin(time * 0.4) * 0.15;
    const driftY = Math.cos(time * 0.3) * 0.12;
    const driftZ = Math.sin(time * 0.5) * 0.15;

    // 2. Parallax response to cursor motion
    const parallaxX = state.pointer.x * 0.8;
    const parallaxY = state.pointer.y * 0.6;

    // Calculate final target positions including cinematic offsets
    const finalPos = targetParams.position.clone().add(
      new THREE.Vector3(driftX + parallaxX, driftY + parallaxY, driftZ)
    );

    // Lerp camera position and FOV
    camera.position.lerp(finalPos, 0.08);
    const persCam = camera as THREE.PerspectiveCamera;
    if (persCam.isPerspectiveCamera) {
      persCam.fov += (targetParams.fov - persCam.fov) * 0.08;
      persCam.updateProjectionMatrix();
    }

    // Lerp OrbitControls target focal point
    if (controls) {
      const ctrl = controls as any;
      ctrl.target.lerp(targetParams.target, 0.08);
      ctrl.update();
    }
  });

  return null;
}

/* =========================================================================
   LIGHTS SETUP
   ========================================================================= */
function Lights({ visMode }: { visMode: string }) {
  const isThermal = visMode === "thermal";
  return (
    <>
      <ambientLight intensity={isThermal ? 0.05 : 0.18} color="#0c0c0a" />

      {/* Warm key microscope light */}
      <directionalLight
        position={[-8, 20, 10]}
        intensity={isThermal ? 0.3 : 1.8}
        color="#fff0d8"
        castShadow
      />

      {/* Cool fill light */}
      <directionalLight position={[12, 4, -8]} intensity={isThermal ? 0.15 : 0.35} color="#0a1530" />

      {/* Amber rim catch */}
      <directionalLight position={[-5, 3, -18]} intensity={0.4} color={AMBER} />
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
  levelFloat?: number;
  visMode?: string;
}

// Primary block for each spotlight level — camera zooms to this single block's top face
const PRIMARY_BLOCK_FOR_LEVEL: Record<number, string> = {
  4: "cpu-big",
  5: "gpu",
  6: "npu",
  7: "modem",
  8: "isp",
  9: "slc",
  10: "cpu-big",
};

function isFocused(blockId: string, level: number): boolean {
  return PRIMARY_BLOCK_FOR_LEVEL[level] === blockId;
}

function getStaggeredT(blockId: string, manualT: number): number {
  const block = BLOCKS.find((b) => b.id === blockId);
  if (!block) return manualT;
  const cx = block.cx;
  const cz = block.cz;
  const dist = Math.sqrt(cx * cx + cz * cz);
  const maxDist = 11.5; // normalized center-to-corner maximum distance
  const normDist = Math.min(1.0, dist / maxDist);
  
  // Center-outward explosion delay
  const delay = normDist * 0.45;
  const localT = Math.max(0, Math.min(1, (manualT - delay) / (1.0 - delay)));
  
  // Custom ease-in-out curve
  return localT * localT * (3 - 2 * localT);
}

function getTargetBlockT(blockId: string, levelFloat: number, manualT: number): number {
  // Levels 1-3: manual explode slider drives everything
  if (levelFloat <= 3.3) {
    return getStaggeredT(blockId, manualT);
  }

  // Level 10: pipeline stage focus on cpu-big
  if (levelFloat >= 9.5) {
    if (blockId === "cpu-big") {
      const progressTo10 = Math.max(0, Math.min(1, (levelFloat - 9.0) / 1.0));
      return progressTo10 * 0.35;
    }
    return 0.0;
  }

  // Narrative spotlight levels 4-9
  let focusLevel = -1;
  for (const [lvlStr, id] of Object.entries(PRIMARY_BLOCK_FOR_LEVEL)) {
    const lvl = parseInt(lvlStr);
    if (id === blockId && lvl >= 4 && lvl <= 9) {
      focusLevel = lvl;
      break;
    }
  }

  if (focusLevel !== -1) {
    const dist = Math.abs(levelFloat - focusLevel);
    // Smooth bell curve around focusLevel
    const factor = Math.max(0, 1.0 - dist);
    return factor * factor * (3 - 2 * factor); 
  }

  return 0.0;
}

export function Scene({
  t,
  showLabels,
  selected,
  setSelected,
  mode,
  levelFloat = 4.0,
  visMode = "physical",
}: SceneProps) {
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
  // At levelFloat = 1.0, progress = 0 (chip is low and invisible)
  // At levelFloat = 2.0, progress = 1 (chip is centered and visible)
  const chipProgress = Math.max(0, Math.min(1, levelFloat - 1.0));
  const chipY = -1.2 * (1 - chipProgress); // slides up by 1.2 units
  const chipOpacity = Math.min(1, chipProgress * 1.6); // reaches full opacity at levelFloat = 1.625

  return (
    <>
      {/* Transparent canvas background allows HTML circuit traces to show behind the 3D casing */}
      <fog attach="fog" args={["#08090e", 55, 110]} />

      <Lights visMode={visMode} />

      <Environment resolution={256}>
        <Lightformer intensity={1.4} color="#ffdca8" position={[-10, 8, 6]} scale={[10, 10, 1]} />
        <Lightformer intensity={0.6} color="#8aa0e0" position={[12, 6, -6]} scale={[8, 8, 1]} />
        <Lightformer intensity={0.8} color="#ffb878" position={[0, 5, -14]} scale={[12, 4, 1]} />
      </Environment>

      <CameraController levelFloat={levelFloat} selectedBlockCoords={selectedBlockCoords} />

      <group onPointerMissed={() => setSelected(null)}>
        {/* Layer 1: Computer Shell (slides down & fades out) */}
        <ComputerCasing levelFloat={levelFloat} />

        {/* Layer 2: Semiconductor SoC (slides up & fades in) */}
        <group position={[0, chipY, 0]}>
          <PackageSubstrate opacity={chipOpacity} />
          {levelFloat >= 1.15 && (
            <>
              <Die visMode={visMode} opacity={chipOpacity} />
              
              {BLOCKS.map((b) => {
                const isBlockFocus = isFocused(b.id, level);
                const isLevelSpotlight = level >= 4 && level <= 9;
                const isLevelPipeline = level === 10;

                let blockT = getTargetBlockT(b.id, levelFloat, t);
                let blockSelected = selected === b.id;
                let blockDimmed = selected !== null && selected !== b.id;

                if (isLevelSpotlight) {
                  if (isBlockFocus) {
                    blockSelected = true;
                    blockDimmed = false; // Focused blocks are never dimmed
                  } else {
                    blockSelected = false;
                    blockDimmed = true;
                  }
                } else if (isLevelPipeline) {
                  if (b.id === "cpu-big") {
                    blockSelected = true;
                    blockDimmed = false;
                  } else {
                    blockSelected = false;
                    blockDimmed = true;
                  }
                }

                return (
                  <SocBlock
                    key={b.id}
                    block={b}
                    t={blockT}
                    showLabels={showLabels && level <= 3} // Only show floating spatial labels on die overview (level 3)
                    selected={blockSelected}
                    onSelect={setSelected}
                    dimmed={blockDimmed}
                    modeUtilization={getUtil(b.id, mode)}
                    visMode={visMode}
                    opacity={chipOpacity}
                    focused={isBlockFocus}
                    level={level}
                  />
                );
              })}
            </>
          )}
        </group>

        {/* Layer 10: Procedural Pipeline stages grid (visible on level 10) */}
        <PipelineSimulation active={level === 10} blockCoords={selectedBlockCoords} />

      </group>

      <ContactShadows
        position={[0, -1.58, 0]}
        scale={52}
        resolution={512}
        blur={2.2}
        opacity={0.55}
        far={18}
        color="#000000"
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={1.0}
        maxDistance={80}
        target={[0.3, 1.5, 0.0]}
      />

      <EffectComposer multisampling={2}>
        <Bloom intensity={0.6} luminanceThreshold={0.5} luminanceSmoothing={0.15} mipmapBlur />
        <Vignette eskil={false} offset={0.18} darkness={0.65} />
        <SMAA />
      </EffectComposer>
    </>
  );
}
