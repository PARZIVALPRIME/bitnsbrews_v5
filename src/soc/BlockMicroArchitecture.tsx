import { Edges } from "@react-three/drei";
import type { Block } from "./data";

const AMBER = "#e8a23a";

interface MicroArchProps {
  block: Block;
  w: number;
  d: number;
  h: number;
  dimmed: boolean;
  opacity: number;
  utilization: number;
}

export function BlockMicroArchitecture({ block, w, d, h, dimmed, opacity, utilization }: MicroArchProps) {
  const detail = block.detail;
  const baseOpacity = dimmed ? 0.2 : 1.0;
  const currentOpacity = baseOpacity * opacity;

  // Helper standard metallic material
  const metalMat = (color: string, roughness = 0.2, metalness = 0.95) => (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      transparent
      opacity={currentOpacity}
    />
  );

  // Helper emissive glowing material driven by utilization
  const glowMat = (color: string, intensity = 1.0) => (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={intensity * (dimmed ? 0.15 : 0.35 + utilization * 1.6)}
      roughness={0.15}
      metalness={0.1}
      transparent
      opacity={currentOpacity}
    />
  );

  // --- 1. CPU Big (3 Performance Cores + L3 Cache) ---
  if (detail === "cpuBig") {
    return (
      <group position={[0, h, 0]}>
        {/* L3 Cache region - flat textured slab on left side */}
        <mesh position={[-w / 4, 0.02, 0]} castShadow>
          <boxGeometry args={[w / 2 - 0.1, 0.04, d - 0.2]} />
          {metalMat("#131c2c", 0.4, 0.8)}
          <Edges threshold={15}>
            <lineBasicMaterial color={AMBER} transparent opacity={0.15 * currentOpacity} />
          </Edges>
        </mesh>
        
        {/* Cache subdivisions */}
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh key={i} position={[-w / 4, 0.042, -d / 3 + i * (d / 4.5)]}>
            <boxGeometry args={[w / 2.4, 0.01, d / 6]} />
            {metalMat("#1e2b40", 0.2, 0.9)}
          </mesh>
        ))}

        {/* 3 Performance Cores - raised silver modules with copper cores */}
        {[
          { x: w / 4, z: -d / 3 },
          { x: w / 4, z: 0 },
          { x: w / 4, z: d / 3 },
        ].map((core, i) => (
          <group key={i} position={[core.x, 0.06, core.z]}>
            <mesh castShadow>
              <boxGeometry args={[w / 2.3, 0.12, d / 4.5]} />
              {metalMat("#cfd2d6", 0.15, 0.98)}
              <Edges threshold={15}>
                <lineBasicMaterial color={AMBER} transparent opacity={0.35 * currentOpacity} />
              </Edges>
            </mesh>
            {/* Center core contact plate (copper) */}
            <mesh position={[0, 0.062, 0]}>
              <boxGeometry args={[w / 3.6, 0.02, d / 7]} />
              {metalMat("#b87333", 0.1, 0.95)}
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  // --- 2. CPU Eff (4 Efficiency Cores in 2x2 grid) ---
  if (detail === "cpuEff") {
    return (
      <group position={[0, h, 0]}>
        {/* Base slab */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[w - 0.1, 0.04, d - 0.1]} />
          {metalMat("#0f1c2c", 0.45, 0.8)}
        </mesh>
        {/* 4 cores */}
        {[-w / 4, w / 4].map((x, xi) =>
          [-d / 4, d / 4].map((z, zi) => (
            <group key={`${xi}-${zi}`} position={[x, 0.05, z]}>
              <mesh castShadow>
                <boxGeometry args={[w / 2.4, 0.08, d / 2.4]} />
                {metalMat("#3a4e68", 0.2, 0.9)}
                <Edges threshold={15}>
                  <lineBasicMaterial color={AMBER} transparent opacity={0.25 * currentOpacity} />
                </Edges>
              </mesh>
              <mesh position={[0, 0.042, 0]}>
                <boxGeometry args={[w / 3.5, 0.01, d / 3.5]} />
                {metalMat("#d4af37", 0.1, 0.95)}
              </mesh>
            </group>
          ))
        )}
      </group>
    );
  }

  // --- 3. GPU (4x4 Matrix of Shader Cores that glow purple based on utilization) ---
  if (detail === "gpu") {
    const rows = 4;
    const cols = 4;
    return (
      <group position={[0, h, 0]}>
        {/* Base slab */}
        <mesh position={[0, 0.01, 0]} castShadow>
          <boxGeometry args={[w - 0.1, 0.02, d - 0.1]} />
          {metalMat("#171124", 0.5, 0.75)}
        </mesh>
        {/* Grid of Shader Cores */}
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const posX = -w / 2 + (w / rows) * (r + 0.5);
            const posZ = -d / 2 + (d / cols) * (c + 0.5);
            const sizeX = w / rows - 0.12;
            const sizeZ = d / cols - 0.12;
            
            const seed = (r * cols + c) * 1.5;
            const height = 0.06 + Math.abs(Math.sin(seed)) * 0.04;
            const isGlowing = (r + c) % 3 === 0;

            return (
              <mesh key={`${r}-${c}`} position={[posX, height / 2 + 0.01, posZ]} castShadow>
                <boxGeometry args={[sizeX, height, sizeZ]} />
                {isGlowing ? glowMat("#a855f7", 1.4) : metalMat("#2c1b47", 0.22, 0.95)}
                <Edges threshold={15}>
                  <lineBasicMaterial color={isGlowing ? "#d8b4fe" : AMBER} transparent opacity={0.2 * currentOpacity} />
                </Edges>
              </mesh>
            );
          })
        )}
      </group>
    );
  }

  // --- 4. NPU (Systolic array - 5x4 grid of nodes connected by thin traces) ---
  if (detail === "npu") {
    const cols = 5;
    const rows = 4;
    return (
      <group position={[0, h, 0]}>
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[w - 0.1, 0.02, d - 0.1]} />
          {metalMat("#220d13", 0.5, 0.8)}
        </mesh>
        
        {/* Array Nodes */}
        {Array.from({ length: cols }).map((_, c) =>
          Array.from({ length: rows }).map((_, r) => {
            const posX = -w / 2 + (w / cols) * (c + 0.5);
            const posZ = -d / 2 + (d / rows) * (r + 0.5);
            const isPulse = (c * r + c + r) % 4 === 0;
            return (
              <group key={`${c}-${r}`} position={[posX, 0.02, posZ]}>
                <mesh castShadow>
                  <cylinderGeometry args={[w / 15, w / 15, 0.08, 8]} />
                  {isPulse ? glowMat("#ef4444", 1.8) : metalMat("#4c151e", 0.1, 0.9)}
                </mesh>
                <mesh position={[0, 0.045, 0]}>
                  <cylinderGeometry args={[w / 22, w / 22, 0.01, 8]} />
                  {metalMat("#cfd2d6", 0.1, 0.95)}
                </mesh>
              </group>
            );
          })
        )}
        
        {/* Horizontal & Vertical Systolic Grid Interconnect Lines */}
        {Array.from({ length: cols }).map((_, c) =>
          Array.from({ length: rows - 1 }).map((_, r) => {
            const posX = -w / 2 + (w / cols) * (c + 0.5);
            const posZ = -d / 2 + (d / rows) * (r + 1.0);
            return (
              <mesh key={`v-${c}-${r}`} position={[posX, 0.025, posZ]}>
                <boxGeometry args={[0.03, 0.01, d / rows - 0.1]} />
                {glowMat(AMBER, 0.6)}
              </mesh>
            );
          })
        )}
        {Array.from({ length: cols - 1 }).map((_, c) =>
          Array.from({ length: rows }).map((_, r) => {
            const posX = -w / 2 + (w / cols) * (c + 1.0);
            const posZ = -d / 2 + (d / rows) * (r + 0.5);
            return (
              <mesh key={`h-${c}-${r}`} position={[posX, 0.025, posZ]}>
                <boxGeometry args={[w / cols - 0.1, 0.01, 0.03]} />
                {glowMat(AMBER, 0.6)}
              </mesh>
            );
          })
        )}
      </group>
    );
  }

  // --- 5. System Level Cache (SLC) - 8 parallel cache banks ---
  if (detail === "slc") {
    const banks = 8;
    return (
      <group position={[0, h, 0]}>
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[w - 0.1, 0.02, d - 0.1]} />
          {metalMat("#060b14", 0.45, 0.85)}
        </mesh>
        {Array.from({ length: banks }).map((_, i) => {
          const posZ = -d / 2 + (d / banks) * (i + 0.5);
          return (
            <group key={i} position={[0, 0.04, posZ]}>
              <mesh castShadow>
                <boxGeometry args={[w - 0.3, 0.06, d / banks - 0.08]} />
                {metalMat("#1c2a3d", 0.18, 0.96)}
                <Edges threshold={15}>
                  <lineBasicMaterial color={AMBER} transparent opacity={0.15 * currentOpacity} />
                </Edges>
              </mesh>
              {/* Cache bank central micro-groove */}
              <mesh position={[0, 0.032, 0]}>
                <boxGeometry args={[w - 0.6, 0.01, 0.02]} />
                {metalMat("#d4af37", 0.1, 0.99)}
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }

  // --- 6. Stacked LPDDR Memory (3D stacked dies with wire loops) ---
  if (detail === "lpddr") {
    return (
      <group position={[0, h, 0]}>
        {/* Layer 1 memory die */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[w - 0.15, 0.1, d - 0.15]} />
          {metalMat("#0a0f18", 0.4, 0.9)}
          <Edges threshold={15}>
            <lineBasicMaterial color={AMBER} transparent opacity={0.2 * currentOpacity} />
          </Edges>
        </mesh>
        
        {/* Micro-solder-balls intermediate bonding layer */}
        {[-w / 3, 0, w / 3].map((x) =>
          [-d / 3, 0, d / 3].map((z, idx) => (
            <mesh key={`${x}-${z}-${idx}`} position={[x, 0.11, z]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              {metalMat("#cfd2d6", 0.1, 0.99)}
            </mesh>
          ))
        )}
        
        {/* Layer 2 memory die */}
        <mesh position={[0, 0.17, 0]} castShadow>
          <boxGeometry args={[w - 0.25, 0.08, d - 0.25]} />
          {metalMat("#111824", 0.35, 0.9)}
          <Edges threshold={15}>
            <lineBasicMaterial color={AMBER} transparent opacity={0.2 * currentOpacity} />
          </Edges>
        </mesh>
        
        {/* Gold side contact wire loops */}
        {[-w / 2 + 0.02, w / 2 - 0.02].map((x, xi) => (
          <mesh key={xi} position={[x, 0.08, 0]} rotation={[0, 0, xi === 0 ? Math.PI / 12 : -Math.PI / 12]}>
            <boxGeometry args={[0.02, 0.16, d - 0.4]} />
            {metalMat("#d4af37", 0.1, 0.95)}
          </mesh>
        ))}
      </group>
    );
  }

  // --- 7. Modem (RF shield enclosure mesh lid) ---
  if (detail === "modem") {
    return (
      <group position={[0, h, 0]}>
        {/* Metal shield frame */}
        <mesh position={[0, 0.06, 0]} castShadow>
          <boxGeometry args={[w - 0.1, 0.12, d - 0.1]} />
          {metalMat("#3a2d24", 0.25, 0.9)}
          <Edges threshold={15}>
            <lineBasicMaterial color={AMBER} transparent opacity={0.3 * currentOpacity} />
          </Edges>
        </mesh>
        {/* RF grid mesh screen */}
        <mesh position={[0, 0.125, 0]}>
          <boxGeometry args={[w - 0.4, 0.01, d - 0.4]} />
          {metalMat("#1f1a16", 0.5, 0.75)}
        </mesh>
        {/* Shield structural ribs */}
        {Array.from({ length: 3 }).map((_, i) => (
          <mesh key={i} position={[-w / 3 + i * (w / 3), 0.13, 0]}>
            <boxGeometry args={[0.08, 0.01, d - 0.6]} />
            {metalMat("#b87333", 0.2, 0.95)}
          </mesh>
        ))}
      </group>
    );
  }

  // --- 8. PMU (Power inductors + capacitor cylinders) ---
  if (detail === "pmu") {
    return (
      <group position={[0, h, 0]}>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[w - 0.1, 0.04, d - 0.1]} />
          {metalMat("#1b1812", 0.6, 0.5)}
        </mesh>
        
        {/* Coils/Inductors - dark blocks */}
        {[-w / 4, w / 4].map((x, idx) => (
          <mesh key={idx} position={[x, 0.12, -d / 4]} castShadow>
            <boxGeometry args={[w / 3, 0.16, d / 3.5]} />
            {metalMat("#0f0e0c", 0.8, 0.2)}
            <Edges threshold={15}>
              <lineBasicMaterial color={AMBER} transparent opacity={0.3 * currentOpacity} />
            </Edges>
          </mesh>
        ))}
        
        {/* Capacitors - aluminum cylinders */}
        {[-w / 3, 0, w / 3].map((x, idx) => (
          <group key={idx} position={[x, 0.14, d / 4]}>
            <mesh castShadow>
              <cylinderGeometry args={[w / 10, w / 10, 0.2, 12]} />
              {metalMat("#60685e", 0.25, 0.9)}
            </mesh>
            <mesh position={[0, 0.105, 0]}>
              <cylinderGeometry args={[w / 10.2, w / 10.2, 0.01, 12]} />
              {metalMat("#cfd2d6", 0.1, 0.99)}
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  // --- 9. ISP, DSP, Video (Buses + SMD components) ---
  if (detail === "isp" || detail === "dsp" || detail === "video") {
    const isTeal = detail === "isp";
    const baseColor = isTeal ? "#0a261c" : detail === "dsp" ? "#0f2c18" : "#0d2b20";
    const traceColor = isTeal ? "#b87333" : "#d4af37";
    return (
      <group position={[0, h, 0]}>
        {/* Base Logic Plate */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[w - 0.1, 0.04, d - 0.1]} />
          {metalMat(baseColor, 0.4, 0.85)}
          <Edges threshold={15}>
            <lineBasicMaterial color={AMBER} transparent opacity={0.2 * currentOpacity} />
          </Edges>
        </mesh>
        
        {/* Micro-Tracks (buses) */}
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh key={i} position={[-w / 3 + i * (w / 4.5), 0.042, 0]}>
            <boxGeometry args={[0.04, 0.01, d - 0.3]} />
            {metalMat(traceColor, 0.15, 0.95)}
          </mesh>
        ))}
        
        {/* Micro-SMD capacitor blocks */}
        {[-d / 3, d / 3].map((z, idx) => (
          <mesh key={idx} position={[w / 4, 0.06, z]} castShadow>
            <boxGeometry args={[0.22, 0.08, 0.36]} />
            {metalMat("#807060", 0.6, 0.1)}
          </mesh>
        ))}
      </group>
    );
  }

  // --- 10. Default Cap for infrastructure (memctrl, ioring) ---
  return (
    <mesh position={[0, h + 0.025, 0]} castShadow>
      <boxGeometry args={[Math.max(0.12, w - 0.08), 0.05, Math.max(0.12, d - 0.08)]} />
      {metalMat(block.base, 0.2, 0.9)}
      <Edges threshold={15} scale={1.001}>
        <lineBasicMaterial color={AMBER} transparent opacity={0.22 * currentOpacity} />
      </Edges>
    </mesh>
  );
}
