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

  // Auto-compute focused block coords for camera targeting (levels 4-10)
  // Uses the LIFTED position so camera aims at the block's final elevated top face
  const autoFocusCoords = useMemo(() => {
    if (level < 4) return null;
    const primaryId = PRIMARY_BLOCK_FOR_LEVEL[level];
    const block = primaryId ? BLOCKS.find((b) => b.id === primaryId) : null;
    if (!block) return null;
    return { cx: block.cx, cz: block.cz, h: block.lift + block.h };
  }, [level]);

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

      <CameraController levelFloat={levelFloat} selectedBlockCoords={autoFocusCoords ?? selectedBlockCoords} />

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

                let blockT = t;
                let blockSelected = selected === b.id;
                let blockDimmed = selected !== null && selected !== b.id;

                if (isLevelSpotlight) {
                  if (isBlockFocus) {
                    blockSelected = true;
                    blockDimmed = false; // Focused blocks are never dimmed
                    blockT = 1.0; // Full lift so article card on top is clearly visible
                  } else {
                    blockSelected = false;
                    blockDimmed = true;
                    blockT = 0.0;
                  }
                } else if (isLevelPipeline) {
                  if (b.id === "cpu-big") {
                    blockSelected = true;
                    blockDimmed = false;
                    blockT = 0.35; // Lift slightly to support pipeline stage grids
                  } else {
                    blockSelected = false;
                    blockDimmed = true;
                    blockT = 0.0;
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
