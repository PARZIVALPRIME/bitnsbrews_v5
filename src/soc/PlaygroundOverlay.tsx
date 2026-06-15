import { Suspense, useState, useMemo, useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Scene as PlaygroundScene } from "./PlaygroundScene";
import { BLOCKS, DOMAIN_ACCENTS, SocMode, UTILIZATION, accentFor } from "./data";
import { QualityContext } from "./quality";

const MODES: { id: SocMode; label: string }[] = [
  { id: "Idle",   label: "Idle" },
  { id: "Gaming", label: "Gaming" },
  { id: "AI",     label: "AI" },
  { id: "Camera", label: "Camera" },
  { id: "Web",    label: "Web" },
  { id: "Video",  label: "Video" },
];

// Legend swatches use the same domain accents the blocks glow with.
const LEGEND = [
  { label: "Compute (CPU)", color: DOMAIN_ACCENTS.cpuBig },
  { label: "Graphics (GPU)", color: DOMAIN_ACCENTS.gpu },
  { label: "AI Engine (NPU)", color: DOMAIN_ACCENTS.npu },
  { label: "Modem / RF", color: DOMAIN_ACCENTS.modem },
  { label: "Media & DSP", color: DOMAIN_ACCENTS.isp },
  { label: "Cache / Memory", color: DOMAIN_ACCENTS.slc },
  { label: "PMU / I/O", color: DOMAIN_ACCENTS.pmu },
  { label: "LPDDR5x", color: DOMAIN_ACCENTS.lpddr },
];

function CameraController({ cameraRef }: { cameraRef: React.MutableRefObject<THREE.Camera | null> }) {
  const { camera } = useThree();
  useEffect(() => { cameraRef.current = camera; }, [camera, cameraRef]);
  return null;
}

// Widen the FOV on portrait/narrow viewports so the wide die fits horizontally.
function AspectFov() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;
    const REF_ASPECT = 1.6;
    const BASE = 25;
    const aspect = size.width / Math.max(1, size.height);
    let fov = BASE;
    if (aspect < REF_ASPECT) {
      const vRef = THREE.MathUtils.degToRad(BASE);
      const hRef = 2 * Math.atan(Math.tan(vRef / 2) * REF_ASPECT);
      fov = Math.min(82, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hRef / 2) / aspect)));
    }
    cam.fov = fov;
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

export function PlaygroundOverlay({
  onClose,
  quality = "desktop"
}: {
  onClose: () => void;
  quality?: "desktop" | "mobile";
}) {
  const [t, setT] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<SocMode>("Idle");
  const cameraRef = useRef<THREE.Camera | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 25);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setMounted(false);
    setTimeout(onClose, 500);
  };

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
    <div
      className={`fixed inset-0 z-50 overflow-hidden bg-[#0b0d12] font-sans text-white select-none transition-all duration-500 ease-in-out ${
        mounted ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      }`}
    >
      {/* ambient gradient */}
      <div
        className="pointer-events-none absolute inset-0 z-1"
        style={{
          background:
            "radial-gradient(900px 600px at 10% 8%, rgba(91,124,250,0.05), transparent 55%), radial-gradient(700px 500px at 92% 88%, rgba(100,140,220,0.04), transparent 55%)",
        }}
      />

      <div className="absolute inset-0 z-0">
        <Canvas
          shadows={quality === "desktop"}
          dpr={quality === "desktop" ? [1, 2] : 1}
          camera={{ position: [20, 16, 22], fov: 25 }}
          gl={{ antialias: quality === "desktop", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
          className="absolute inset-0"
        >
          <QualityContext.Provider value={quality}>
            <Suspense fallback={null}>
              <PlaygroundScene t={t} showLabels={showLabels} selected={selected} setSelected={setSelected} mode={mode} />
              <CameraController cameraRef={cameraRef} />
              <AspectFov />
            </Suspense>
          </QualityContext.Provider>
        </Canvas>
      </div>

      {/* ───── Top bar: logo + modes + view toggle + close ───── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-b from-black/80 to-transparent">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div>
            <div className="text-[11px] font-medium text-white/45 leading-tight">
              Interactive die
            </div>
            <div className="text-[14px] font-semibold tracking-tight text-white/90 leading-tight">
              3nm Mobile SoC
            </div>
          </div>
        </div>

        {/* Mode switcher — drops to its own full-width, scrollable row on mobile */}
        <div className="order-last sm:order-none w-full sm:w-auto flex items-center justify-start sm:justify-center gap-0.5 rounded-lg border border-white/10 bg-[#12151d] p-0.5 overflow-x-auto scrollbar-none">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`shrink-0 rounded-md px-2.5 sm:px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                mode === m.id
                  ? "bg-[#5b7cfa] text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* View toggle and Close button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-[#12151d] p-0.5">
            <button
              onClick={() => setT(0)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                t === 0
                  ? "bg-white/90 text-[#0b0d12]"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              Assembled
            </button>
            <button
              onClick={() => setT(1)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                t === 1
                  ? "bg-white/90 text-[#0b0d12]"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              Exploded
            </button>
          </div>

          <button
            onClick={handleClose}
            className="flex items-center gap-2 rounded-lg border border-white/12 bg-[#12151d] px-4 py-2 text-[11px] font-medium text-white/60 hover:text-white/95 hover:border-white/25 transition-colors cursor-pointer"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            Close
          </button>
        </div>
      </div>

      {/* ───── Left: legend (hidden on mobile to declutter) ───── */}
      <div className="hidden sm:block absolute left-5 top-24 z-10 w-44 rounded-xl border border-white/10 bg-[rgba(15,18,26,0.94)] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.35),0_4px_12px_rgba(0,0,0,0.25)]">
        <div className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">
          Domains
        </div>
        <div className="space-y-1.5">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: l.color }}
              />
              <span className="text-[11px] text-white/60">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ───── Right: diagnostics panel (only when a block is selected) ───── */}
      {sel && (
        <div className="absolute left-3 right-3 sm:left-auto sm:right-5 top-[88px] sm:top-24 z-10 w-auto sm:w-72 max-h-[52vh] sm:max-h-none overflow-y-auto sm:overflow-hidden rounded-xl border border-white/10 bg-[rgba(15,18,26,0.94)] shadow-[0_2px_6px_rgba(0,0,0,0.4),0_12px_32px_rgba(0,0,0,0.35)]">
          {/* header */}
          <div className="border-b border-white/8 p-4 pb-3">
            <div className="flex items-start justify-between">
              <div className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: accentFor(sel) }}>
                Component
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Deselect component"
                className="flex h-5 w-5 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors cursor-pointer"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <h2 className="mt-1 text-[15px] font-semibold text-white/95 leading-tight">{sel.name}</h2>
            <p className="mt-0.5 text-[11px] text-white/40">{sel.fn}</p>
          </div>

          {/* utilization bar */}
          <div className="px-4 py-3 border-b border-white/8">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/45 font-medium">
                {mode} utilization
              </span>
              <span className="font-mono text-white/80">{Math.round(selUtil * 100)}%</span>
            </div>
            <div className="mt-1.5 h-1 w-full rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${selUtil * 100}%`,
                  background: accentFor(sel),
                }}
              />
            </div>
          </div>

          {/* description */}
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-[11.5px] leading-[1.65] text-white/60">{sel.description}</p>
          </div>

          {/* specs grid */}
          <div className="grid grid-cols-3 gap-px bg-white/6">
            {sel.specs.map((s) => (
              <div key={s.label} className="bg-[#0e1118] px-3 py-2.5">
                <div className="text-[9px] font-medium uppercase tracking-wide text-white/35">
                  {s.label}
                </div>
                <div className="mt-0.5 text-[11.5px] font-mono text-white/85">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───── Bottom-left: explode slider ───── */}
      <div className="absolute bottom-5 left-5 z-10 w-56 rounded-xl border border-white/10 bg-[rgba(15,18,26,0.94)] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.35),0_4px_12px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">
            Explode
          </span>
          <span className="font-mono text-[10px] text-white/60">{Math.round(t * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(t * 100)}
          onChange={(e) => setT(Number(e.target.value) / 100)}
          className="soc-slider w-full cursor-pointer"
        />
        {/* Architecture Labels Toggle */}
        <button
          onClick={() => setShowLabels((s) => !s)}
          className="mt-2.5 flex w-full items-center justify-between rounded-md border border-white/8 bg-white/[0.03] px-2.5 py-1.5 transition-colors hover:border-white/20 cursor-pointer"
        >
          <span className="text-[10px] font-medium text-white/55">
            Architecture labels
          </span>
          <span
            className="relative inline-block h-3.5 w-6 rounded-full transition"
            style={{ backgroundColor: showLabels ? "#5b7cfa" : "rgba(255,255,255,0.12)" }}
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
            className="text-[10px] text-white/40 hover:text-white/70 transition-colors cursor-pointer"
          >
            Reset view
          </button>
          <span className="text-[10px] text-white/25">
            Scroll to zoom
          </span>
        </div>
      </div>

      {/* ───── Bottom-right: zoom controls ───── */}
      <div className="absolute right-5 bottom-5 z-10 flex flex-col gap-1.5">
        <button
          onClick={() => zoom(0.82)}
          aria-label="Zoom in"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[rgba(15,18,26,0.94)] text-white/55 text-sm hover:text-white/90 hover:border-white/25 transition-colors cursor-pointer"
        >
          +
        </button>
        <button
          onClick={() => { if (cameraRef.current) { cameraRef.current.position.set(20, 16, 22); cameraRef.current.updateMatrixWorld(true); }}}
          aria-label="Reset zoom"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[rgba(15,18,26,0.94)] text-white/55 hover:text-white/90 hover:border-white/25 transition-colors cursor-pointer"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" /></svg>
        </button>
        <button
          onClick={() => zoom(1.2)}
          aria-label="Zoom out"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[rgba(15,18,26,0.94)] text-white/55 text-sm hover:text-white/90 hover:border-white/25 transition-colors cursor-pointer"
        >
          −
        </button>
      </div>

      {/* ───── Bottom credit ───── */}
      <div className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10">
        <span className="font-mono text-[10px] text-white/25">
          22×18u die · 3nm EUV · ~12B transistors
        </span>
      </div>
    </div>
  );
}
