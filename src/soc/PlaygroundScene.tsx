import { OrbitControls, Environment, Lightformer, Edges, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
import { BLOCKS, DIE_W, DIE_D, SocMode, UTILIZATION } from "./data";
import { SocBlock } from "./PlaygroundBlock";
import { TrafficNetwork } from "./Traffic";

function getUtil(id: string, mode: SocMode): number {
  const table = UTILIZATION[id];
  return table ? table[mode] : 0.1;
}

/* ---------- Die substrate ---------- */

function Die() {
  const dieW = DIE_W + 1.4;
  const dieD = DIE_D + 1.4;
  const packageW = dieW + 3;
  const packageD = dieD + 3;
  const baseW = dieW + 5.4;
  const baseD = dieD + 5.4;
  const rail = 0.14;

  return (
    <group>
      {/* die slab: top at Y=0 */}
      <mesh position={[0, -0.3, 0]} receiveShadow castShadow>
        <boxGeometry args={[dieW, 0.6, dieD]} />
        <meshStandardMaterial color="#080c10" metalness={0.35} roughness={0.75} />
        <Edges threshold={15} scale={1.001}>
          <lineBasicMaterial color="#c79a4e" transparent opacity={0.35} />
        </Edges>
      </mesh>

      {/* recessed die inlay */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[dieW - 0.3, dieD - 0.3]} />
        <meshStandardMaterial color="#060910" metalness={0.3} roughness={0.8} />
      </mesh>

      {/* scribe-line amber border */}
      {[
        [0, 0.01, -dieD / 2 + rail / 2, dieW, 0.015, rail] as const,
        [0, 0.01, dieD / 2 - rail / 2, dieW, 0.015, rail] as const,
        [-dieW / 2 + rail / 2, 0.01, 0, rail, 0.015, dieD] as const,
        [dieW / 2 - rail / 2, 0.01, 0, rail, 0.015, dieD] as const,
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            color="#c79a4e"
            emissive="#c79a4e"
            emissiveIntensity={0.55}
            metalness={1}
            roughness={0.15}
          />
        </mesh>
      ))}

      {/* package substrate */}
      <mesh position={[0, -0.86, 0]} receiveShadow>
        <boxGeometry args={[packageW, 0.48, packageD]} />
        <meshStandardMaterial color="#070a10" metalness={0.65} roughness={0.6} />
        <Edges threshold={15} scale={1.001}>
          <lineBasicMaterial color="#b8904a" transparent opacity={0.5} />
        </Edges>
      </mesh>

      {/* package amber rail */}
      {[
        [0, -0.60, -packageD / 2 + rail / 2, packageW, 0.03, rail] as const,
        [0, -0.60, packageD / 2 - rail / 2, packageW, 0.03, rail] as const,
        [-packageW / 2 + rail / 2, -0.60, 0, rail, 0.03, packageD] as const,
        [packageW / 2 - rail / 2, -0.60, 0, rail, 0.03, packageD] as const,
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#b8904a" metalness={1} roughness={0.2} emissive="#4b3616" emissiveIntensity={0.15} />
        </mesh>
      ))}

      {/* interposer / plinth */}
      <mesh position={[0, -1.35, 0]} receiveShadow>
        <boxGeometry args={[baseW, 0.44, baseD]} />
        <meshStandardMaterial color="#050607" metalness={0.55} roughness={0.68} />
        <Edges threshold={15} scale={1.001}>
          <lineBasicMaterial color="#7a5c2c" transparent opacity={0.4} />
        </Edges>
      </mesh>
    </group>
  );
}

/* ---------- Lighting (per brief spec) ---------- */

function Lights() {
  return (
    <>
      {/* ambient — very dim, just enough to read block undersides */}
      <ambientLight intensity={0.18} color="#0c0c0a" />

      {/* Light 1: Warm key (microscope lamp feel) */}
      <directionalLight
        position={[-8, 20, 10]}
        intensity={1.8}
        color="#fff0d8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0003}
      />

      {/* Light 2: Cool fill (die at rest is cold) */}
      <directionalLight position={[12, 4, -8]} intensity={0.35} color="#0a1530" />

      {/* Light 3: Amber rim (dramatic edge catch from behind) */}
      <directionalLight position={[-5, 3, -18]} intensity={0.4} color="#c79a4e" />

      {/* subtle overhead downwash for readability */}
      <directionalLight position={[0, 18, 0]} intensity={0.2} color="#d8d0c8" />
    </>
  );
}

/* ---------- Scene ---------- */

export function Scene({
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
      <color attach="background" args={["#08090e"]} />
      <fog attach="fog" args={["#08090e", 50, 100]} />

      <Lights />

      <Environment resolution={256}>
        <Lightformer intensity={1.4} color="#ffdca8" position={[-10, 8, 6]} scale={[10, 10, 1]} />
        <Lightformer intensity={0.6} color="#8aa0e0" position={[12, 6, -6]} scale={[8, 8, 1]} />
        <Lightformer intensity={0.8} color="#ffb878" position={[0, 5, -14]} scale={[12, 4, 1]} />
        <Lightformer intensity={0.35} color="#e0ddd8" position={[0, 14, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[22, 22, 1]} />
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

      <ContactShadows
        position={[0, -1.58, 0]}
        scale={52}
        resolution={1024}
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
        minDistance={16}
        maxDistance={70}
        target={[0.3, 1.5, 0.0]}
      />

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.55} luminanceThreshold={0.5} luminanceSmoothing={0.15} mipmapBlur />
        <Vignette eskil={false} offset={0.18} darkness={0.65} />
        <SMAA />
      </EffectComposer>
    </>
  );
}
