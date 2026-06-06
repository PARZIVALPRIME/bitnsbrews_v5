import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { BLOCKS, TRAFFIC_PATHS, SocMode } from "./data";
import { useQuality } from "./quality";

const AMBER = "#e8a23a";

/* ---------- shader: a thin tube with a flowing gradient ---------- */

const flowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const flowFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uOpacity;
  uniform float uSpeed;
  varying vec2 vUv;

  void main() {
    // flowing gradient along the tube length (uv.y for TubeGeometry length axis)
    float t = vUv.y - uTime * uSpeed;

    // a few crisp soft pulses repeating
    float pulse = 0.0;
    for (int i = 0; i < 3; i++) {
      float seg = fract(t + float(i) * 0.33);
      pulse += smoothstep(0.45, 0.5, seg) - smoothstep(0.5, 0.58, seg);
    }

    // base dim glow + bright crests
    float base = 0.18;
    float intensity = base + pulse * 0.95;

    // soft fade at endpoints so the line doesn't pop in/out
    float endFade = smoothstep(0.0, 0.06, vUv.y) * (1.0 - smoothstep(0.94, 1.0, vUv.y));

    gl_FragColor = vec4(uColor * intensity, uOpacity * (0.35 + pulse) * endFade);
  }
`;

function FlowTube({
  from,
  to,
  color,
  bandwidth,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  bandwidth?: string;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const isMobile = useQuality() === "mobile";

  const { tubeGeo, curve, midPoint } = useMemo(() => {
    const distance = from.distanceTo(to);
    const arcHeight = 1.2 + Math.min(4.5, distance * 0.14);
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    mid.y += arcHeight;

    const c = new THREE.QuadraticBezierCurve3(from.clone(), mid, to.clone());
    // Far fewer tube/ring segments on mobile.
    const geo = new THREE.TubeGeometry(c, isMobile ? 24 : 60, 0.045, isMobile ? 5 : 8, false);
    return { tubeGeo: geo, curve: c, midPoint: mid };
  }, [from, to, isMobile]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 1.0 },
      uSpeed: { value: 0.35 },
    }),
    [color],
  );

  const headRef = useRef<THREE.Mesh>(null!);
  const headHaloRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (matRef.current) matRef.current.uniforms.uTime.value = time;

    // single elegant leading pulse traveling along the curve
    const t = (time * 0.35) % 1;
    const p = curve.getPointAt(t);
    if (headRef.current) headRef.current.position.copy(p);
    if (!isMobile && headHaloRef.current) {
      headHaloRef.current.position.copy(p);
      const s = 1 + Math.sin(time * 4) * 0.08;
      headHaloRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      {/* glowing flow tube */}
      <mesh geometry={tubeGeo}>
        <shaderMaterial
          ref={matRef}
          vertexShader={flowVertex}
          fragmentShader={flowFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* leading pulse head */}
      <mesh ref={headRef}>
        <sphereGeometry args={[0.085, isMobile ? 8 : 14, isMobile ? 8 : 14]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* desktop-only extras: halo, endpoint rings, and bandwidth chip */}
      {!isMobile && (
        <>
          <mesh ref={headHaloRef}>
            <sphereGeometry args={[0.22, 14, 14]} />
            <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>

          <mesh position={from}>
            <ringGeometry args={[0.14, 0.2, 24]} />
            <meshBasicMaterial color={color} transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh position={to}>
            <ringGeometry args={[0.14, 0.2, 24]} />
            <meshBasicMaterial color={color} transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>

          {bandwidth && (
            <Html position={[midPoint.x, midPoint.y + 0.3, midPoint.z]} center distanceFactor={28} zIndexRange={[60, 0]}>
              <div className="pointer-events-none select-none">
                <div
                  className="rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-wider whitespace-nowrap backdrop-blur-md"
                  style={{
                    color: color,
                    borderColor: `${color}55`,
                    backgroundColor: "rgba(8,10,16,0.7)",
                    boxShadow: `0 0 12px ${color}40`,
                  }}
                >
                  {bandwidth}
                </div>
              </div>
            </Html>
          )}
        </>
      )}
    </group>
  );
}

/* ---------- network ---------- */

// Friendly bandwidth labels per source so the diagram tells a story
const SOURCE_BANDWIDTH: Record<string, string> = {
  gpu: "GPU · 400 GB/s",
  "cpu-big": "CPU · 256 GB/s",
  "cpu-eff": "CPU-E · 64 GB/s",
  npu: "NPU · 180 GB/s",
  isp: "ISP · 32 GB/s",
  video: "Video · 24 GB/s",
  modem: "Modem · 12 GB/s",
  slc: "SLC ⇄ DRAM",
};

export function TrafficNetwork({ mode, t }: { mode: SocMode; t: number }) {
  const paths = useMemo(
    () => TRAFFIC_PATHS.filter((p) => p.modes.includes(mode)),
    [mode],
  );

  return (
    <group>
      {paths.map((path) => {
        const from = BLOCKS.find((b) => b.id === path.from);
        const to = BLOCKS.find((b) => b.id === path.to);
        if (!from || !to) return null;

        // attach to the top of each block, scaled by current explode amount
        const yFrom = t * from.lift + from.h + 0.15;
        const yTo = t * to.lift + to.h + 0.15;

        const start = new THREE.Vector3(from.cx, yFrom, from.cz);
        const end = new THREE.Vector3(to.cx, yTo, to.cz);

        return (
          <FlowTube
            key={`${path.from}-${path.to}-${mode}`}
            from={start}
            to={end}
            color={AMBER}
            bandwidth={SOURCE_BANDWIDTH[from.id]}
          />
        );
      })}
    </group>
  );
}
