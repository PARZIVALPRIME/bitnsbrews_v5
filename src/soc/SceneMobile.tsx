import { OrbitControls, AdaptiveDpr, Environment, Lightformer, Edges } from "@react-three/drei";
import { EffectComposer, Bloom, SMAA } from "@react-three/postprocessing";
import { BLOCKS, DIE_W, DIE_D, SocMode, UTILIZATION } from "./data";
import { SocBlock } from "./SocBlock";
import { TrafficNetwork } from "./Traffic";

function getUtil(id: string, mode: SocMode): number {
  const table = UTILIZATION[id];
  return table ? table[mode] : 0.1;
}

function Die() {
  const dieW = DIE_W + 1.4;
  const dieD = DIE_D + 1.4;
  const packageW = dieW + 3;
  const packageD = dieD + 3;
  const baseW = dieW + 5.4;
  const baseD = dieD + 5.4;

  return (
    <group>
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[dieW, 0.6, dieD]} />
        <meshStandardMaterial color="#0c0f16" metalness={0.9} roughness={0.4} />
        <Edges threshold={20} scale={1.001}>
          <lineBasicMaterial color="#e8a23a" transparent opacity={0.3} />
        </Edges>
      </mesh>

      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[dieW - 0.2, dieD - 0.2]} />
        <meshStandardMaterial color="#080a12" metalness={1.0} roughness={0.25} />
      </mesh>

      {[
        [0, 0.012, -dieD / 2 + 0.04, dieW, 0.015, 0.08] as const,
        [0, 0.012, dieD / 2 - 0.04, dieW, 0.015, 0.08] as const,
        [-dieW / 2 + 0.04, 0.012, 0, 0.08, 0.015, dieD] as const,
        [dieW / 2 - 0.04, 0.012, 0, 0.08, 0.015, dieD] as const,
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#e8a23a" emissive="#e8a23a" emissiveIntensity={1.5} metalness={1} roughness={0.1} />
        </mesh>
      ))}

      <mesh position={[0, -0.8, 0]}>
        <boxGeometry args={[packageW, 0.4, packageD]} />
        <meshStandardMaterial color="#0a0c14" metalness={0.8} roughness={0.5} />
      </mesh>

      <mesh position={[0, -1.3, 0]}>
        <boxGeometry args={[baseW, 0.4, baseD]} />
        <meshStandardMaterial color="#040508" metalness={0.7} roughness={0.6} />
        <Edges threshold={20}>
          <lineBasicMaterial color="#e8a23a" transparent opacity={0.15} />
        </Edges>
      </mesh>
    </group>
  );
}

export function SceneMobile({
  t,
  showLabels,
  selected,
  setSelected,
  mode,
}: {
  t: number;
  showLabels: boolean;
  selected: string | null;
  setSelected: (id: string | null) => void;
  mode: SocMode;
}) {
  return (
    <>
      <color attach="background" args={["#050608"]} />
      <fog attach="fog" args={["#050608", 65, 110]} />

      <ambientLight intensity={0.4} color="#ffffff" />
      <hemisphereLight args={["#fff2d8", "#05050a", 0.7]} />

      <directionalLight position={[-10, 20, 15]} intensity={2.5} color="#fff5e0" />
      <directionalLight position={[12, 10, -5]} intensity={1.0} color="#a0c0ff" />
      <directionalLight position={[-5, 5, -20]} intensity={1.8} color="#e8a23a" />

      <Environment resolution={256}>
        <Lightformer intensity={4.5} color="#ffffff" position={[-10, 10, 5]} scale={[15, 15, 1]} />
        <Lightformer intensity={1.5} color="#a0c0ff" position={[10, 5, -10]} scale={[10, 10, 1]} />
        <Lightformer intensity={2.5} color="#ffb878" position={[0, 8, -15]} scale={[20, 5, 1]} />
        <Lightformer intensity={1.2} color="#ffffff" position={[0, 15, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[30, 30, 1]} />
      </Environment>

      <group onPointerMissed={() => setSelected(null)}>
        <Die />
        {BLOCKS.map((b) => (
          <SocBlock
            key={b.id}
            block={b}
            t={t}
            showLabels={showLabels}
            selected={selected === b.id}
            onSelect={setSelected}
            dimmed={selected !== null && selected !== b.id}
            modeUtilization={getUtil(b.id, mode)}
          />
        ))}
        <TrafficNetwork mode={mode} t={t} />
      </group>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.85}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={16}
        maxDistance={70}
        target={[0.3, 1.5, 0.0]}
      />

      <AdaptiveDpr pixelated />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
        <SMAA />
      </EffectComposer>
    </>
  );
}
