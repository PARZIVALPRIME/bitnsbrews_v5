import { Suspense, useState, useMemo, useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Scene } from "./soc/Scene";
import { BLOCKS, SocMode, UTILIZATION } from "./soc/data";

const MODES: { id: SocMode; icon: string; label: string }[] = [
  { id: "Idle",   icon: "∿", label: "Idle" },
  { id: "Gaming", icon: "❖", label: "Gaming" },
  { id: "AI",     icon: "✧", label: "AI" },
  { id: "Camera", icon: "◎", label: "Camera" },
  { id: "Web",    icon: "⊕", label: "Web" },
  { id: "Video",  icon: "▣", label: "Video" },
];

const LEGEND = [
  { label: "Compute (CPU)", color: "#12284a" },
  { label: "Graphics (GPU)", color: "#180830" },
  { label: "AI Engine (NPU)", color: "#300810" },
  { label: "Modem / RF", color: "#281808" },
  { label: "Media & DSP", color: "#0a2018" },
  { label: "Cache / Memory", color: "#0c1a28" },
  { label: "PMU / I/O", color: "#0e0e08" },
  { label: "LPDDR5x", color: "#060c18" },
];

function CameraController({ cameraRef }: { cameraRef: React.MutableRefObject<THREE.Camera | null> }) {
  const { camera } = useThree();
  useEffect(() => { cameraRef.current = camera; }, [camera, cameraRef]);
  return null;
}

export default function App() {
  const [t, setT] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<SocMode>("Idle");
  const cameraRef = useRef<THREE.Camera | null>(null);

  const sel = useMemo(() => BLOCKS.find((b) => b.id === selected) || null, [selected]);

  const selUtil = useMemo(() => {
    if (!sel) return 0;
    const u = UTILIZATION[sel.id];
    return u ? u[mode] : 0;
  }, [sel, mode]);

  const zoom = (factor: number) => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    const len = cam.position.length();
    const next = Math.min(68, Math.max(16, len * factor));
    cam.position.multiplyScalar(next / len);
    cam.updateMatrixWorld(true);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#08090e] font-sans text-white">
      {/* ambient gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 600px at 10% 8%, rgba(232,162,58,0.04), transparent 55%), radial-gradient(700px 500px at 92% 88%, rgba(100,140,220,0.04), transparent 55%)",
        }}
      />

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [20, 16, 22], fov: 25 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        className="absolute inset-0"
      >
        <Suspense fallback={null}>
          <Scene t={t} selected={selected} setSelected={setSelected} mode={mode} targetLevel={3} />
          <CameraController cameraRef={cameraRef} />
        </Suspense>
      </Canvas>

      {/* ───── Top bar: logo + modes + view toggle ───── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-400/10 ring-1 ring-amber-400/25">
            <span className="text-[11px] text-amber-300 font-bold">◉</span>
          </div>
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-amber-200/60">
              Silicon Architecture
            </div>
            <div className="text-[13px] font-semibold tracking-tight text-white/90 leading-tight">
              3nm Mobile SoC
            </div>
          </div>
        </div>

        {/* Mode switcher */}
        <div className="flex items-center gap-0.5 rounded-full border border-white/8 bg-black/40 p-0.5 backdrop-blur-xl">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide transition-all ${
                mode === m.id
                  ? "bg-amber-400/85 text-black shadow-md shadow-amber-500/20"
                  : "text-white/45 hover:text-white/75 hover:bg-white/[0.04]"
              }`}
            >
              <span className="text-[11px] leading-none">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-0.5 rounded-full border border-white/8 bg-black/40 p-0.5 backdrop-blur-xl">
          <button
            onClick={() => setT(0)}
            className={`rounded-full px-3 py-1 text-[10px] font-semibold transition ${
              t === 0
                ? "bg-white/90 text-black shadow"
                : "text-white/45 hover:text-white/75"
            }`}
          >
            Assembled
          </button>
          <button
            onClick={() => setT(1)}
            className={`rounded-full px-3 py-1 text-[10px] font-semibold transition ${
              t === 1
                ? "bg-white/90 text-black shadow"
                : "text-white/45 hover:text-white/75"
            }`}
          >
            Exploded
          </button>
        </div>
      </div>

      {/* ───── Left: legend ───── */}
      <div className="absolute left-5 top-20 z-10 w-44 rounded-xl border border-white/6 bg-black/30 p-3.5 backdrop-blur-xl">
        <div className="mb-2.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-white/35">
          Domains
        </div>
        <div className="space-y-1.5">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: l.color, boxShadow: `0 0 4px ${l.color}80` }}
              />
              <span className="text-[10px] text-white/55">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ───── Right: diagnostics panel (only when a block is selected) ───── */}
      {sel && (
        <div className="absolute right-5 top-16 z-10 w-72 rounded-2xl border border-amber-300/15 bg-black/50 shadow-2xl backdrop-blur-2xl overflow-hidden">
          {/* header */}
          <div className="border-b border-white/6 p-4 pb-3">
            <div className="flex items-start justify-between">
              <div className="text-[8px] font-semibold uppercase tracking-[0.22em] text-amber-200/60">
                Component
              </div>
              <button
                onClick={() => setSelected(null)}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-[10px] text-white/40 hover:bg-white/10 hover:text-white/80 transition"
              >
                ✕
              </button>
            </div>
            <h2 className="mt-1 text-[15px] font-semibold text-white/95 leading-tight">{sel.name}</h2>
            <p className="mt-0.5 text-[9px] text-white/35">{sel.fn}</p>
          </div>

          {/* utilization bar */}
          <div className="px-4 py-3 border-b border-white/6">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-white/40 uppercase tracking-wider font-semibold">
                {mode} utilization
              </span>
              <span className="font-mono text-amber-200/80">{Math.round(selUtil * 100)}%</span>
            </div>
            <div className="mt-1.5 h-1 w-full rounded-full bg-white/6 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${selUtil * 100}%`,
                  background: `linear-gradient(90deg, #e8a23a, ${selUtil > 0.7 ? "#ff8040" : "#e8a23a"})`,
                  boxShadow: `0 0 8px rgba(232,162,58,${selUtil * 0.6})`,
                }}
              />
            </div>
          </div>

          {/* description */}
          <div className="px-4 py-3 border-b border-white/6">
            <p className="text-[10px] leading-[1.65] text-white/55">{sel.description}</p>
          </div>

          {/* specs grid */}
          <div className="grid grid-cols-3 gap-px bg-white/4">
            {sel.specs.map((s) => (
              <div key={s.label} className="bg-black/40 px-3 py-2.5">
                <div className="text-[7px] font-semibold uppercase tracking-wider text-white/30">
                  {s.label}
                </div>
                <div className="mt-0.5 text-[11px] font-semibold text-white/85">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───── Bottom-left: explode slider ───── */}
      <div className="absolute bottom-5 left-5 z-10 w-56 rounded-xl border border-white/6 bg-black/30 p-3.5 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/35">
            Explode
          </span>
          <span className="font-mono text-[9px] text-amber-200/60">{Math.round(t * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(t * 100)}
          onChange={(e) => setT(Number(e.target.value) / 100)}
          className="soc-slider w-full"
        />
        {/* Architecture Labels Toggle */}
        <button
          onClick={() => setShowLabels((s) => !s)}
          className="mt-2.5 flex w-full items-center justify-between rounded-md border border-white/6 bg-black/20 px-2.5 py-1.5 transition hover:border-amber-300/20 hover:bg-white/[0.03]"
        >
          <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/50">
            Architecture Labels
          </span>
          <span
            className="relative inline-block h-3.5 w-6 rounded-full transition"
            style={{ backgroundColor: showLabels ? "rgba(232,162,58,0.6)" : "rgba(255,255,255,0.12)" }}
          >
            <span
              className="absolute top-px left-0.5 inline-block h-2.5 w-2.5 rounded-full bg-white shadow transition"
              style={{ transform: showLabels ? "translateX(9px)" : "translateX(0)" }}
            />
          </span>
        </button>
        <div className="mt-2 flex items-center justify-between">
          <button
            onClick={() => { if (cameraRef.current) { cameraRef.current.position.set(20, 16, 22); cameraRef.current.updateMatrixWorld(true); }}}
            className="text-[8px] text-white/30 hover:text-white/50 transition"
          >
            reset view
          </button>
          <span className="text-[8px] text-white/15">
            scroll to zoom
          </span>
        </div>
      </div>

      {/* ───── Bottom-right: zoom controls ───── */}
      <div className="absolute right-5 bottom-5 z-10 flex flex-col gap-1.5">
        <button
          onClick={() => zoom(0.82)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-black/40 backdrop-blur-xl text-white/50 text-xs hover:text-amber-200 hover:border-amber-300/30 transition"
        >
          +
        </button>
        <button
          onClick={() => { if (cameraRef.current) { cameraRef.current.position.set(20, 16, 22); cameraRef.current.updateMatrixWorld(true); }}}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-black/40 backdrop-blur-xl text-white/50 text-[9px] hover:text-amber-200 hover:border-amber-300/30 transition"
        >
          ◎
        </button>
        <button
          onClick={() => zoom(1.2)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-black/40 backdrop-blur-xl text-white/50 text-xs hover:text-amber-200 hover:border-amber-300/30 transition"
        >
          −
        </button>
      </div>

      {/* ───── Bottom credit ───── */}
      <div className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10">
        <span className="font-mono text-[8px] tracking-[0.15em] text-white/15">
          22×18u die · 3nm EUV FinFET · ~12B transistors
        </span>
      </div>
    </div>
  );
}
