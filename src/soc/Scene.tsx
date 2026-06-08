import * as THREE from "three";
import { useMemo, useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer, Edges, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { BLOCKS, DIE_W, DIE_D, SocMode, UTILIZATION } from "./data";
import { SocBlock } from "./SocBlock";
import { getCameraParamsInterpolated } from "./levelManager";
import { useQuality } from "./quality";
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
  color: "#e8a23a", // Amber/Gold
  emissive: "#e8a23a",
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

function RainbowDatastreams({ levelFloat }: { levelFloat: number }) {
  const streamVisible = levelFloat <= 1.8;
  const opacityMultiplier = Math.max(0, 1.0 - (levelFloat - 1.0) * 1.55); // fades out quickly
  
  const packetRefs = useRef<THREE.Mesh[]>([]);

  const colors = ["#ff007f", "#3b82f6", "#10b981", "#fbbf24", "#a855f7", "#ec4899", "#06b6d4", "#f97316"];
  
  // 36 paths
  const paths = useMemo(() => {
    const list = [];
    const dieW = DIE_W + 1.4;
    const dieD = DIE_D + 1.4;
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
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
  }, []);

  useFrame((state) => {
    if (!streamVisible) return;
    const time = state.clock.getElapsedTime();

    paths.forEach((path, i) => {
      const tVal = (time * path.speed + path.offset) % 1.0;
      const mesh = packetRefs.current[i];
      if (mesh) {
        const pos = path.curve.getPointAt(tVal);
        mesh.position.copy(pos);
      }
    });
  });

  if (!streamVisible) return null;

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
              attach="material"
              color={path.color}
              transparent
              opacity={0.08 * opacityMultiplier}
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
              color={path.color}
              emissive={path.color}
              emissiveIntensity={100.0 * opacityMultiplier}
              transparent
              opacity={opacityMultiplier}
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
          />
        </mesh>
      ))}
      {/* Input Output pins at the edges of the die */}
      <DieIOPins dieW={dieW} dieD={dieD} opacity={opacity} />
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
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(0, 1.5, 0));

  const targetParams = useMemo(
    () => getCameraParamsInterpolated(levelFloat, selectedBlockCoords),
    [levelFloat, selectedBlockCoords]
  );

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Subtle micro-breathing drift only
    const driftX = Math.sin(time * 0.4) * 0.06;
    const driftY = Math.cos(time * 0.3) * 0.04;
    const driftZ = Math.sin(time * 0.5) * 0.06;

    const finalPos = targetParams.position.clone().add(
      new THREE.Vector3(driftX, driftY, driftZ)
    );

    // Smooth lerp
    camera.position.lerp(finalPos, 0.06);
    targetRef.current.lerp(targetParams.target, 0.06);
    camera.lookAt(targetRef.current);

    const persCam = camera as THREE.PerspectiveCamera;
    if (persCam.isPerspectiveCamera) {
      persCam.fov += (targetParams.fov - persCam.fov) * 0.06;
      persCam.updateProjectionMatrix();
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
    : 0.35 + Math.max(0, 1.0 - (levelFloat - 1.0) * 1.55) * 0.55;

  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#0c0c0a" />

      {/* Chapter 1 Hero Spotlight */}
      {spotlightIntensity > 0.01 && (
        <spotLight
          position={[0, 18, 0]}
          intensity={spotlightIntensity}
          color="#fff3df"
          angle={Math.PI / 4.5}
          penumbra={0.7}
          decay={0}
          castShadow={!isMobile}
        />
      )}

      {/* Warm key microscope light */}
      <directionalLight
        position={[-8, 20, 10]}
        intensity={isThermal ? 0.3 : 4.5}
        color="#fff0d8"
        castShadow={!isMobile}
      />

      {/* Cool fill light */}
      <directionalLight position={[12, 4, -8]} intensity={isThermal ? 0.15 : 1.2} color="#0a1530" />

      {/* Amber rim catch */}
      <directionalLight position={[-5, 3, -18]} intensity={1.5} color={AMBER} />
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

  // Level 11: fully assembled chip or manual explode slider
  if (levelFloat >= 10.5) {
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

  // Dynamic fog arguments to prevent the chip from being hidden by the fog in Chapter 1 (camera at [0, 80, 100])
  const cameraDist = levelFloat <= 1.5 ? 135 : levelFloat <= 2.5 ? 60 : 50;
  const fogStart = cameraDist * 0.9;
  const fogEnd = cameraDist * 1.8;

  return (
    <>
      {/* Transparent canvas background allows HTML circuit traces to show behind the 3D casing */}
      <fog attach="fog" args={["#08090e", fogStart, fogEnd]} />

      <Lights visMode={visMode} levelFloat={levelFloat} />

      {!isMobile ? (
        <Environment resolution={256}>
          <Lightformer intensity={1.4} color="#ffdca8" position={[-10, 8, 6]} scale={[10, 10, 1]} />
          <Lightformer intensity={0.6} color="#8aa0e0" position={[12, 6, -6]} scale={[8, 8, 1]} />
          <Lightformer intensity={0.8} color="#ffb878" position={[0, 5, -14]} scale={[12, 4, 1]} />
        </Environment>
      ) : null}

      <CameraController levelFloat={levelFloat} selectedBlockCoords={selectedBlockCoords} />

      <group onPointerMissed={() => setSelected(null)}>
        {/* Layer 1: Computer Shell (slides down & fades out) */}
        <ComputerCasing levelFloat={levelFloat} />

        {/* Rainbow Datastreams flowing into the die on Chapter 1 */}
        <RainbowDatastreams levelFloat={levelFloat} />

        {/* Layer 2: Semiconductor SoC (slides up & fades in) */}
        <group position={[0, chipY, 0]}>
          <PackageSubstrate opacity={chipOpacity} />
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
        </group>

        {/* Layer 10: Procedural Pipeline stages grid (visible on level 10) */}
        <PipelineSimulation active={level === 10} blockCoords={selectedBlockCoords} />

      </group>

      {!isMobile ? (
        <ContactShadows
          position={[0, -1.58, 0]}
          scale={52}
          resolution={512}
          blur={2.2}
          opacity={0.55}
          far={18}
          color="#000000"
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

      {!isMobile ? (
        <EffectComposer multisampling={2}>
          <Bloom intensity={0.4} luminanceThreshold={0.6} luminanceSmoothing={0.2} />
          <Vignette eskil={false} offset={0.18} darkness={0.65} />
        </EffectComposer>
      ) : null}
    </>
  );
}
