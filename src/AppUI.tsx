import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { QualityContext } from "./soc/quality";
import { CHAPTERS, TOTAL } from "./chapters";
import { getArticleForLevel, parseMarkdown } from "./chapterArticles";
import { TRACKS, getTrackArticle } from "./trackArticles";
import { getTrackForBlock, getArticle } from "./articles";
import { ArticleReader } from "./ArticleReader";
import { ComponentPortal } from "./ComponentPortal";

import { PlaygroundOverlay } from "./soc/PlaygroundOverlay";

interface SceneProps {
  t: number;
  showLabels: boolean;
  selected: string | null;
  setSelected: (id: string | null) => void;
  mode: "Idle";
  levelFloat: number;
  visMode: string;
}

interface UiProps {
  sceneComponent: React.ComponentType<SceneProps>;
  quality?: "desktop" | "mobile";
}

function CircuitBackground({ active }: { active: boolean }) {
  const [shouldRender, setShouldRender] = useState(active);

  useEffect(() => {
    if (active) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 1050);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!shouldRender) return null;

  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000 ease-in-out"
      style={{ opacity: active ? 0.45 : 0 }}
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ambientGlow" cx="20%" cy="50%" r="55%">
            <stop offset="0%" stopColor="rgba(232, 162, 58, 0.12)" />
            <stop offset="100%" stopColor="rgba(8, 9, 14, 0)" />
          </radialGradient>
          <linearGradient id="traceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(232, 162, 58, 0.3)" />
            <stop offset="50%" stopColor="rgba(232, 162, 58, 0.8)" />
            <stop offset="100%" stopColor="rgba(232, 162, 58, 0.1)" />
          </linearGradient>
        </defs>

        <style>{`
          @keyframes circuitDash {
            to {
              stroke-dashoffset: -160;
            }
          }
          .circuit-line {
            stroke: url(#traceGrad);
            stroke-width: 1.5;
            stroke-linecap: round;
            stroke-dasharray: 12 48;
            animation: circuitDash 10s linear infinite;
          }
          .circuit-node {
            fill: #e8a23a;
            filter: drop-shadow(0 0 4px rgba(232,162,58,0.7));
          }
        `}</style>

        {/* Ambient warm glow behind text */}
        <rect width="100%" height="100%" fill="url(#ambientGlow)" />

        {/* Tech Grid */}
        <pattern id="bgGrid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255, 255, 255, 0.015)" strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#bgGrid)" />

        <g opacity="0.55">
          {/* Main bus lines */}
          <path d="M -10 120 L 180 120 L 280 220 L 460 220" fill="none" className="circuit-line" />
          <path d="M 60 170 L 200 170 L 250 220" fill="none" className="circuit-line" style={{ animationDelay: "-2.5s" }} />
          <path d="M -20 380 L 320 380 L 420 480 L 680 480" fill="none" className="circuit-line" style={{ animationDelay: "-5s" }} />
          
          <path d="M 220 0 L 220 120" fill="none" stroke="rgba(232, 162, 58, 0.08)" strokeWidth="1" />
          <path d="M 320 380 L 320 540 L 280 580" fill="none" className="circuit-line" style={{ animationDelay: "-1.2s" }} />
          <path d="M 180 120 L 180 240 L 110 310 L 110 480" fill="none" className="circuit-line" style={{ animationDelay: "-6.2s" }} />

          {/* Solder circles */}
          <circle cx="180" cy="120" r="3.2" className="circuit-node" />
          <circle cx="280" cy="220" r="3.2" className="circuit-node" />
          <circle cx="320" cy="380" r="3.2" className="circuit-node" />
          <circle cx="420" cy="480" r="3.5" className="circuit-node" />
          <circle cx="110" cy="310" r="2.5" className="circuit-node" />
          
          {/* Silicon footprint pads array */}
          <g opacity="0.25" transform="translate(195, 260)">
            {Array.from({ length: 4 }).map((_, r) =>
              Array.from({ length: 6 }).map((_, c) => (
                <circle key={`${r}-${c}`} cx={c * 14} cy={r * 14} r="1" fill="#e8a23a" />
              ))
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}

export function AppUI({ sceneComponent: SceneComp, quality: _quality = "desktop" }: UiProps) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [targetLevel, setTargetLevel] = useState(1);       // snap destination (1-7)
  const [chapterVisible, setChapterVisible] = useState(true); // text fade state
  const [t, setT] = useState(0.0);
  const [visMode] = useState("physical");
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hubAtBottom, setHubAtBottom] = useState(false);

  // ── Article gallery (Page 4) state ────────────────────────────────────────
  const [readerArticleId, setReaderArticleId] = useState<string | null>(null);
  const [activeComponentPortal, setActiveComponentPortal] = useState<string | null>(null);
  const readerOpenRef = useRef(false);
  useEffect(() => {
    readerOpenRef.current = readerArticleId !== null || activeComponentPortal !== null;
  }, [readerArticleId, activeComponentPortal]);

  const [showPlayground, setShowPlayground] = useState(false);

  // Performance scaling settings
  const [perfMode, setPerfMode] = useState<"high" | "low">("high");
  const [autoDowngraded, setAutoDowngraded] = useState(false);

  // Branded boot screen — covers shader compilation / first-frame jank.
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setBooted(true), 1400);
    return () => clearTimeout(id);
  }, []);

  // Dynamic resolution: high mode starts at 1.5× and self-tunes against the
  // measured frame rate, so strong GPUs stay crisp and weaker ones stay smooth.
  const [dynamicDpr, setDynamicDpr] = useState(1.5);

  // 1. Hard hardware specs check (RAM & integrated GPU check) on mount
  useEffect(() => {
    const isLowRam = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4;
    let isLowGpu = false;
    try {
      const canvas = document.createElement("canvas");
      const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
          const lowGpuKeywords = ["intel", "uhd", "hd graphics", "iris", "mali", "adreno", "microsoft basic", "generic"];
          isLowGpu = lowGpuKeywords.some(keyword => renderer.toLowerCase().includes(keyword));
        }
      }
    } catch (e) {
      console.warn("GPU specs check bypassed:", e);
    }

    if (isLowRam || isLowGpu) {
      setPerfMode("low");
      setAutoDowngraded(true);
    }
  }, []);

  // 2. Dynamic live FPS benchmark during first 2 seconds of loading
  useEffect(() => {
    let frameCount = 0;
    let startTime = performance.now();
    let rAF: number;
    let checked = false;

    const checkFps = () => {
      frameCount++;
      const now = performance.now();
      const elapsed = now - startTime;

      if (elapsed >= 2000) {
        const fps = (frameCount * 1000) / elapsed;
        console.log("Dynamic FPS measured:", fps);
        if (fps < 45 && !checked) {
          setPerfMode("low");
          setAutoDowngraded(true);
          checked = true;
        }
      } else {
        rAF = requestAnimationFrame(checkFps);
      }
    };

    rAF = requestAnimationFrame(checkFps);
    return () => cancelAnimationFrame(rAF);
  }, []);

  useEffect(() => {
    setSelectedTrack(null);
    setSelectedBlock(null);
    setHubAtBottom(false);
    setSubscribed(false);
    setEmail("");

  }, [targetLevel]);

  // Track targetLevel in a ref to keep global listeners current without rebinding
  const targetLevelRef = useRef(targetLevel);
  useEffect(() => {
    targetLevelRef.current = targetLevel;
  }, [targetLevel]);

  // ── Scroll accumulator (avoids skipping chapters on fast scrolling) ───────
  const accumRef = useRef(0);
  const cooldownRef = useRef(false);

  // ── Snap-to-chapter scroll: wheel + keyboard ──────────────────────────────
  useEffect(() => {
    const advance = (dir: 1 | -1) => {
      setTargetLevel((prev) => {
        const next = Math.max(1, Math.min(TOTAL, prev + dir));
        if (next !== prev) {
          // Briefly hide chapter text so it fades back in for new chapter
          setChapterVisible(false);
          setTimeout(() => setChapterVisible(true), 320);
        }
        return next;
      });
    };

    const handleWheel = (e: WheelEvent) => {
      // Article reader open: let it scroll natively, never navigate chapters.
      if (readerOpenRef.current) return;

      const currentLvl = targetLevelRef.current;

      if (currentLvl === 5) {
        // On the final Hub page, let the catalog container handle scrolling
        // unless we are at the top and the user is scrolling UP, in which case we go back.
        const container = document.getElementById("hub-catalog-container");
        if (container) {
          const isAtTop = container.scrollTop <= 0;
          const isScrollingUp = e.deltaY < 0;

          if (isAtTop && isScrollingUp) {
            e.preventDefault();
          } else {
            // Let the wheel event scroll the container naturally
            return;
          }
        }
      } else {
        e.preventDefault();
      }

      if (cooldownRef.current) return;
      accumRef.current += e.deltaY;
      const threshold = 120;
      if (accumRef.current > threshold) {
        advance(1);
        accumRef.current = 0;
        cooldownRef.current = true;
        setTimeout(() => { cooldownRef.current = false; }, 400);
      } else if (accumRef.current < -threshold) {
        advance(-1);
        accumRef.current = 0;
        cooldownRef.current = true;
        setTimeout(() => { cooldownRef.current = false; }, 400);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (readerOpenRef.current) return;
      const currentLvl = targetLevelRef.current;

      // On the final Hub page, only let ArrowUp/PageUp capture navigation if we are at the top
      if (currentLvl === 5) {
        const container = document.getElementById("hub-catalog-container");
        if (container) {
          const isAtTop = container.scrollTop <= 0;
          if (["ArrowUp", "PageUp"].includes(e.key) && isAtTop) {
            e.preventDefault();
            advance(-1);
          }
        }
        return;
      }
      
      if (["ArrowDown", "PageDown"].includes(e.key)) { e.preventDefault(); advance(1); }
      if (["ArrowUp", "PageUp"].includes(e.key))   { e.preventDefault(); advance(-1); }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  // ── Chapter transition handlers ───

  const currentChapter = CHAPTERS.find((c) => c.level === targetLevel) ?? CHAPTERS[CHAPTERS.length - 1];
  const SceneEl = SceneComp;

  // On the Library page the die is the table of contents: clicking a block
  // (or its floating track card) opens that track's article portal.
  // Stable identity (useCallback) keeps memoized scene blocks from re-rendering.
  const handleBlockSelect = useCallback((id: string | null) => {
    setSelectedBlock(id);
    if (id && targetLevelRef.current === 4) {
      setActiveComponentPortal(id);
    }
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#08090e] font-sans text-white select-none">

      {/* ── Landing Page Background Grid & Circuits ─────────────────────── */}
      <CircuitBackground active={targetLevel === 1} />

      {/* ── 3D Canvas ─────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-1">
        <Canvas
          shadows={perfMode === "high"}
          dpr={perfMode === "high" ? dynamicDpr : 1}
          camera={{ position: [20, 16, 22], fov: 25 }}
          gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
          className="absolute inset-0"
        >
          <QualityContext.Provider value={perfMode === "high" ? "desktop" : "mobile"}>
            <PerformanceMonitor
              bounds={() => [48, 60]}
              flipflops={4}
              onIncline={() => setDynamicDpr((d) => Math.min(1.5, d + 0.25))}
              onDecline={() => setDynamicDpr((d) => Math.max(1, d - 0.25))}
              onFallback={() => setDynamicDpr(1)}
            >
              <Suspense fallback={null}>
                <SceneEl
                  t={t}
                  showLabels={targetLevel === 3}
                  selected={selectedBlock}
                  setSelected={handleBlockSelect}
                  mode="Idle"
                  targetLevel={targetLevel}
                  visMode={visMode}
                />
              </Suspense>
            </PerformanceMonitor>
          </QualityContext.Provider>
        </Canvas>
      </div>

      {/* ── Film grain — static SVG noise, premium texture at zero GPU cost ── */}
      <div
        className="pointer-events-none fixed inset-0 z-[35]"
        style={{
          opacity: 0.035,
          mixBlendMode: "overlay",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "256px 256px",
        }}
      />

      {/* ── Vignette: two layers that cross-fade between ch1 and ch2+ ───── */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: "linear-gradient(to right, rgba(8,9,14,0.95) 0%, rgba(8,9,14,0.85) 30%, transparent 60%)",
          opacity: targetLevel === 1 ? 1 : 0,
          transition: "opacity 700ms ease",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(8,9,14,0.55))",
          opacity: targetLevel === 1 ? 0 : 1,
          transition: "opacity 700ms ease",
        }}
      />

      {/* ── Top-left: Publication wordmark ───────────────────────────────── */}
      <div className="absolute top-6 left-8 z-20">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#e8a23a] rounded-[1px] shadow-[0_0_8px_rgba(232,162,58,0.6)]" />
          <span className="text-[10px] font-mono font-semibold tracking-[0.35em] text-white/45 uppercase">
            Bits'nBrews
          </span>
        </div>
        <div className="text-[10px] font-semibold tracking-[0.18em] text-white/20 uppercase mt-1 ml-3.5">
          Architecture Explorer
        </div>
      </div>

      {/* ── Top-right: Explode & Performance toggles ──────────────────────── */}
      <div className="absolute top-6 right-8 z-20 flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const nextMode = perfMode === "high" ? "low" : "high";
              setPerfMode(nextMode);
              setAutoDowngraded(false);
            }}
            className={`text-[9px] font-mono font-semibold tracking-[0.2em] uppercase transition-colors duration-200 border px-3 py-1.5 rounded-sm ${
              perfMode === "high"
                ? "border-amber-400/30 text-amber-400 hover:bg-amber-400/10 cursor-pointer"
                : "border-red-400/30 text-red-400 hover:bg-red-400/10 cursor-pointer"
            }`}
            title={perfMode === "high" ? "Switch to Potato Mode (Optimized)" : "Switch to High Quality (Bloom & Antialiasing)"}
          >
            {perfMode === "high" ? "⚡ HIGH QUALITY" : "🥔 POTATO MODE"}
          </button>

          <button
            onClick={() => setT((p) => (p === 0 ? 1 : 0))}
            className="text-[9px] font-mono font-semibold tracking-[0.2em] uppercase text-white/35 hover:text-white/70 transition-colors duration-200 border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-sm cursor-pointer"
          >
            {t === 0 ? "EXPLODE VIEW" : "ASSEMBLE"}
          </button>
        </div>
        {autoDowngraded && (
          <span className="text-[7px] font-mono text-red-400/80 tracking-wider uppercase bg-red-400/5 border border-red-400/10 px-1.5 py-0.5 rounded-sm select-none">
            Auto-optimized for low-end PC
          </span>
        )}
      </div>

      {/* ── Chapter 1: Editorial hero — always mounted, fades in/out ────────── */}
      <div
        className="absolute left-0 top-0 bottom-0 z-20 flex flex-col justify-center pl-16 pr-8 w-[52%]"
        style={{
          opacity: targetLevel === 1 && chapterVisible ? 1 : 0,
          transform: targetLevel === 1 && chapterVisible ? "translateY(0)" : "translateY(14px)",
          transition: "opacity 600ms ease, transform 600ms ease",
          pointerEvents: targetLevel === 1 ? "auto" : "none",
        }}
      >
        {/* Technical metadata badges */}
        <div className="flex gap-4 items-center mb-6">
          <span className="text-[8px] font-mono font-bold tracking-[0.25em] text-[#e8a23a] uppercase bg-[#e8a23a]/5 border border-[#e8a23a]/15 px-2.5 py-1 rounded-sm">
            3nm GAA EUV PROCESS
          </span>
          <span className="text-[8px] font-mono font-bold tracking-[0.25em] text-white/40 uppercase">
            EDITION 2026
          </span>
        </div>

        <h1 className="text-[60px] font-bold leading-[1.04] tracking-[-0.03em] text-white/95 mb-6">
          Where Silicon <br />
          <span className="article-serif italic font-semibold bg-gradient-to-r from-[#f5dfae] via-[#e8a23a] to-[#9c6b22] bg-clip-text text-transparent">
            Meets Intent.
          </span>
        </h1>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-16 h-px bg-[#e8a23a]/50" />
          <div className="w-1 h-1 rotate-45 bg-[#e8a23a]/70" />
        </div>
        <p className="text-[14.5px] leading-[1.8] text-white/55 max-w-[460px] mb-9 font-light">
          Bits&apos;nBrews bridges the gap between dense academic papers
          and practical computer architecture &mdash; delivered through a bespoke,
          high-performance physical and spatial engineering simulation.
        </p>
        <button
          onClick={() => {
            setTargetLevel(2);
            setChapterVisible(false);
            setTimeout(() => setChapterVisible(true), 320);
          }}
          className="self-start flex items-center gap-3 text-[10px] font-mono font-bold tracking-[0.25em] uppercase text-[#e8a23a] hover:text-black hover:bg-[#e8a23a] transition-all duration-300 group border border-[#e8a23a]/40 hover:border-[#e8a23a] px-6 py-3 rounded-sm bg-black/25 hover:shadow-[0_0_24px_rgba(232,162,58,0.35)]"
        >
          <span>Explore the Architecture</span>
          <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
        </button>
      </div>

      {/* ── Chapters 2–3: Compact bottom-left — always mounted, fades in/out ── */}
      <div
        className="absolute bottom-16 left-8 z-20 max-w-sm"
        style={{
          opacity: targetLevel > 1 && targetLevel <= 3 && chapterVisible ? 1 : 0,
          transform: targetLevel > 1 && targetLevel <= 3 && chapterVisible ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 500ms ease, transform 500ms ease",
          pointerEvents: targetLevel > 1 && targetLevel <= 3 ? "auto" : "none",
        }}
      >
        <div className="text-[8px] font-mono font-bold tracking-[0.3em] text-white/40 uppercase mb-2">
          {currentChapter.tag}
        </div>
        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-[11px] font-mono text-[#e8a23a]/55 tracking-widest">
            {currentChapter.chapter}
          </span>
          <h1 className="text-[28px] font-bold leading-none tracking-tight text-white/90">
            {currentChapter.title}
          </h1>
        </div>
        <div className="text-[11px] font-mono text-white/40 tracking-wider mb-3">
          {currentChapter.subtitle}
        </div>
        <div className="w-8 h-px bg-white/20 mb-3" />
        <p className="text-[12px] leading-[1.7] text-white/55 max-w-[340px]">
          {currentChapter.description}
        </p>
        {targetLevel === 2 && (
          <button
            onClick={() => setShowPlayground(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-mono font-bold tracking-wider text-[10px] px-4 py-2.5 transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(232,162,58,0.1)] hover:shadow-[0_0_20px_rgba(232,162,58,0.2)]"
          >
            <span>⚡ EXPERIENCE FULL DIE</span>
          </button>
        )}
      </div>
      
      {/* ── Right: Detail panel (level 3 selected track/block) ── */}
      {(() => {
        if (targetLevel !== 3 || (selectedTrack === null && selectedBlock === null)) return null;

        const activeArticle =
          selectedTrack !== null
            ? getTrackArticle(selectedTrack)
            : selectedBlock !== null
            ? (() => {
                const blockLevelMap: Record<string, number> = {
                  "cpu-big": 4,
                  "gpu": 5,
                  "npu": 6,
                  "modem": 7,
                  "isp": 8,
                  "slc": 9,
                };
                const lvl = blockLevelMap[selectedBlock];
                return lvl ? getArticleForLevel(lvl) : getArticleForLevel(3);
              })()
            : "";

        const isVisible = chapterVisible;

        return (
          <div
            className="absolute right-8 top-1/2 -translate-y-1/2 z-20 w-[320px] max-h-[65vh] overflow-y-auto rounded-xl border border-white/8 bg-black/50 backdrop-blur-xl p-5 scrollbar-thin"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible
                ? "translateY(-50%) translateX(0)"
                : "translateY(-50%) translateX(16px)",
              transition: "opacity 500ms ease, transform 500ms ease",
              pointerEvents: isVisible ? "auto" : "none",
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="text-[8px] font-mono font-bold tracking-[0.25em] text-[#e8a23a]/70 uppercase">
                {selectedTrack !== null ? "Technical Track" : "Block Detail"}
              </div>
              <button
                onClick={() => {
                  setSelectedTrack(null);
                  setSelectedBlock(null);
                }}
                className="text-[9px] font-mono text-white/40 hover:text-[#e8a23a] transition-colors cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <div className="text-left text-white/80">
              {parseMarkdown(activeArticle)}
            </div>
          </div>
        );
      })()}

      {/* ── Right side: Chapter navigation dots ──────────────────────────── */}
      <div
        className="absolute right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 items-center transition-all duration-500"
        style={{
          opacity: targetLevel >= 4 ? 0 : 1,
          pointerEvents: targetLevel >= 4 ? "none" : "auto",
        }}
      >
        {CHAPTERS.map((c) => (
          <button
            key={c.level}
            onClick={() => {
              setTargetLevel(c.level);
              setChapterVisible(false);
              setTimeout(() => setChapterVisible(true), 320);
            }}
            title={c.title}
            className="group relative flex items-center justify-end gap-2"
          >
            {/* Label on hover */}
            <span className="absolute right-5 text-[8px] font-mono tracking-widest text-white/50 uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
              {c.title}
            </span>
            {/* Dot */}
            <div
              className="transition-all duration-300 rounded-full"
              style={{
                width: targetLevel === c.level ? "7px" : "4px",
                height: targetLevel === c.level ? "7px" : "4px",
                backgroundColor:
                  targetLevel === c.level
                    ? "#e8a23a"
                    : "rgba(255,255,255,0.22)",
                boxShadow: targetLevel === c.level
                  ? "0 0 8px rgba(232,162,58,0.6)"
                  : "none",
              }}
            />
          </button>
        ))}
      </div>

      {/* ── Chapter 3: Technical Tracks Menu ───────────────────────────────── */}
      <div
        className="absolute top-[110px] left-8 z-20 w-[340px] bg-black/55 border border-white/10 backdrop-blur-2xl rounded-2xl p-5 text-left shadow-2xl"
        style={{
          opacity: targetLevel === 3 && chapterVisible ? 1 : 0,
          transform: targetLevel === 3 && chapterVisible ? "translateY(0)" : "translateY(-12px)",
          pointerEvents: targetLevel === 3 ? "auto" : "none",
          transition: "opacity 500ms ease, transform 500ms ease",
        }}
      >
        <div className="text-[9px] font-mono font-bold tracking-[0.3em] text-[#e8a23a] uppercase mb-2">
          Technical Publication Tracks
        </div>
        <div className="w-12 h-px bg-[#e8a23a]/45 mb-4" />
        <div className="flex flex-col gap-2.5 max-h-[58vh] overflow-y-auto pr-1 scrollbar-none">
          {TRACKS.map((track, idx) => {
            const active = selectedTrack === track.id;
            const numStr = String(idx + 1).padStart(2, "0");
            return (
              <button
                key={track.id}
                onClick={() => {
                  setSelectedTrack(track.id);
                  setSelectedBlock(null);
                }}
                className={`flex items-start gap-4 text-left p-3 rounded-xl transition-all duration-300 border group ${
                  active
                    ? "bg-[#e8a23a]/12 border-[#e8a23a]/40 shadow-[0_0_15px_rgba(232,162,58,0.08)]"
                    : "bg-white/[0.01] border-transparent hover:bg-white/[0.04] hover:border-white/8"
                }`}
              >
                <span className={`text-[12px] font-mono font-bold tracking-tight transition-colors ${
                  active ? "text-[#e8a23a]" : "text-white/30 group-hover:text-white/60"
                }`}>
                  {numStr}
                </span>
                <div className="flex flex-col">
                  <span className={`text-[11px] font-bold tracking-wide transition-colors ${
                    active ? "text-[#e8a23a]" : "text-white/85 group-hover:text-white"
                  }`}>
                    {track.name}
                  </span>
                  <span className="text-[9px] text-white/45 leading-relaxed mt-1 font-light">
                    {track.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Hub: Full-screen Dark Backdrop Overlay ───────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 z-15 bg-black transition-opacity duration-1000 ease-in-out"
        style={{
          opacity: targetLevel === 5 ? (hubAtBottom ? 0.22 : 0.82) : 0,
        }}
      />

      {/* ── Level 11: Hub Directory & Team Dashboard (Single Column Redesign) ── */}
      <div
        id="hub-catalog-container"
        className="absolute inset-x-8 z-25 text-left overflow-y-auto scrollbar-thin"
        style={{
          top: "96px",
          bottom: "24px",
          opacity: targetLevel === 5 && chapterVisible ? 1 : 0,
          transform: targetLevel === 5 && chapterVisible ? "translateY(0)" : "translateY(16px)",
          pointerEvents: targetLevel === 5 ? "auto" : "none",
          transition: "opacity 600ms ease, transform 600ms ease",
        }}
        onScroll={(e) => {
          const target = e.currentTarget;
          const threshold = 160;
          const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
          setHubAtBottom(nearBottom);
        }}
      >
        <div className="max-w-[760px] mx-auto flex flex-col gap-8 pr-3">
          {/* Header */}
          <div className="text-center mt-6">
            <h1 className="text-4xl font-extrabold tracking-[0.35em] text-white/95 uppercase font-mono">
              Bits&apos;nBrews
            </h1>
            <div className="text-[9px] font-mono tracking-[0.3em] text-[#e8a23a] uppercase mt-3">
              Technical Publication Catalog &amp; Hub
            </div>
            <p className="text-xs text-white/45 max-w-lg mx-auto font-light leading-relaxed mt-4">
              Explore our technical series breaking down silicon, processor design, and engineering strategies. Scroll down to browse all tracks or subscribe to the newsletter.
            </p>
          </div>

          {/* About & Team Row Card */}
          <div className="bg-white/[0.015] border border-white/5 backdrop-blur-xl rounded-2xl p-6 flex flex-col md:flex-row gap-8 justify-between mt-2 shadow-xl shadow-black/10">
            <div className="flex-1">
              <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#e8a23a] uppercase mb-2">
                About the Publication
              </div>
              <p className="text-xs leading-[1.7] text-white/55 font-light">
                Bits&apos;nBrews is an interactive digital engineering museum. We bridge the gap between academic VLSI briefs and practical chip design through beautiful spatial graphics, real-time code pipeline simulations, and deep-dive technical journalism.
              </p>
            </div>

            <div className="w-full md:w-[240px] md:border-l border-white/5 md:pl-6 flex flex-col gap-4">
              <div className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#e8a23a]/75 uppercase mb-1">
                Development Team
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-semibold text-white/80">Dhruv</span>
                  <span className="text-[8px] font-mono text-white/35 uppercase">Architectural Dev</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-semibold text-white/80">Gemini Partner</span>
                  <span className="text-[8px] font-mono text-white/35 uppercase">AI Programmer</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-semibold text-white/80">Parzival Prime</span>
                  <span className="text-[8px] font-mono text-white/35 uppercase">Graphics Director</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section Divider */}
          <div className="flex items-center gap-4 border-t border-white/5 pt-4">
            <div className="text-[9px] font-mono font-bold tracking-[0.25em] text-[#e8a23a]/75 uppercase">
              Technical Content Tracks
            </div>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Tracks List */}
          <div className="flex flex-col gap-4">
            {TRACKS.map((track, idx) => {
              const numStr = String(idx + 1).padStart(2, "0");
              return (
                <div
                  key={track.id}
                  className="bg-white/[0.012] border border-white/5 hover:border-[#e8a23a]/15 transition-all duration-300 p-6 rounded-2xl flex gap-6 shadow-md hover:shadow-lg group"
                >
                  <div className="text-3xl font-extrabold text-[#e8a23a]/30 font-mono tracking-tighter leading-none shrink-0 w-12">
                    {numStr}
                  </div>
                  <div className="flex flex-col flex-1 text-left">
                    <h3 className="text-base font-bold text-white/90 group-hover:text-[#e8a23a] transition-colors">
                      {track.name}
                    </h3>
                    <p className="text-xs leading-relaxed text-white/50 font-light mt-2.5">
                      {track.longSummary}
                    </p>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Subscribe Newsletter Section */}
          <div className="bg-[#e8a23a]/5 border border-[#e8a23a]/15 card-glowing-border rounded-2xl p-8 text-center mt-6 shadow-xl relative overflow-hidden backdrop-blur-xl transition-all duration-500">
            {/* Ambient Tech Circuit Background */}
            <svg className="absolute inset-0 z-0 pointer-events-none opacity-25 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <style>{`
                @keyframes dashOffsetSub {
                  to {
                    stroke-dashoffset: -40;
                  }
                }
                .sub-line {
                  stroke: rgba(232, 162, 58, 0.15);
                  stroke-width: 1;
                  stroke-linecap: round;
                  fill: none;
                }
                .sub-flow {
                  stroke: #e8a23a;
                  stroke-width: 1.5;
                  stroke-linecap: round;
                  stroke-dasharray: 4 20;
                  animation: dashOffsetSub 3s linear infinite;
                  fill: none;
                }
              `}</style>
              <path d="M -20,30 H 420 L 460,70 V 180" className="sub-line" />
              <path d="M -20,30 H 420 L 460,70 V 180" className="sub-flow" />
              
              <path d="M 520,10 H 380 L 340,50 V 160" className="sub-line" />
              <path d="M 520,10 H 380 L 340,50 V 160" className="sub-flow" style={{ animationDelay: "-1.5s" }} />
              
              <circle cx="460" cy="70" r="2" fill="#e8a23a" />
              <circle cx="340" cy="50" r="2" fill="#e8a23a" />
            </svg>

            <div className="max-w-md mx-auto relative z-10">
              <div className="text-[9px] font-mono font-bold tracking-[0.3em] text-[#e8a23a] uppercase mb-2">
                Newsletter Inner Circle
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white/95 mb-2 font-mono uppercase text-glow-gold">
                Join the Architecture Circle
              </h2>
              <p className="text-xs text-white/55 leading-relaxed font-light mb-6">
                Receive weekly exclusive spatial-first writeups on physical silicon layouts, execution pipelines, and instruction-set tradeoffs. No marketing fluff. Written for hardware engineers and systems architects.
              </p>

              {subscribed ? (
                <div className="py-4 text-center animate-fade-in">
                  <div className="relative w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                    {/* Glowing outer pulsing circles */}
                    <div className="absolute inset-0 rounded-full bg-[#e8a23a]/20 animate-pulse-glow" />
                    <div className="absolute inset-2 rounded-full bg-[#e8a23a]/30 animate-pulse-glow" style={{ animationDelay: "0.5s" }} />
                    {/* Golden success circle */}
                    <div className="relative w-8 h-8 rounded-full bg-black border border-[#e8a23a] flex items-center justify-center shadow-[0_0_15px_rgba(232,162,58,0.4)]">
                      <svg className="w-4 h-4 text-[#e8a23a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="animate-checkmark" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-[#e8a23a] text-glow-gold">
                    Welcome to the Circle
                  </div>
                  <p className="text-[10px] text-white/45 mt-2 font-light max-w-xs mx-auto leading-relaxed">
                    Check your inbox. Your entry to the microarchitecture briefs has been registered.
                  </p>
                </div>
              ) : (
                <>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!email) return;
                      setSubmitting(true);
                      setTimeout(() => {
                        setSubmitting(false);
                        setSubscribed(true);
                      }, 1000);
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your professional email..."
                      className="flex-1 bg-black/60 border border-white/10 focus:border-[#e8a23a] focus:ring-1 focus:ring-[#e8a23a] outline-none text-xs px-4 py-3 rounded-lg text-white font-mono transition-all duration-300 placeholder-white/25"
                      required
                      disabled={submitting}
                    />
                    <button
                      type="submit"
                      className="bg-[#e8a23a] hover:bg-white text-black font-mono font-bold tracking-widest uppercase text-[9px] px-6 py-3 rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(232,162,58,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="animate-spin h-3 w-3 text-black" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          VERIFYING...
                        </span>
                      ) : (
                        "SUBSCRIBE"
                      )}
                    </button>
                  </form>
                  
                  {/* Persuasive Silicon Proof Point */}
                  <div className="mt-6 pt-5 border-t border-white/5 flex flex-col items-center justify-center gap-2">
                    <span className="text-[8px] font-mono tracking-widest text-white/35 uppercase">
                      Join 14,200+ hardware practitioners from
                    </span>
                    <div className="flex gap-4 items-center opacity-45 grayscale hover:opacity-75 transition-opacity duration-300 mt-0.5">
                      <span className="text-[9px] font-bold tracking-wider font-mono text-white/80">AMD</span>
                      <span className="text-white/20">•</span>
                      <span className="text-[9px] font-bold tracking-wider font-mono text-white/80">NVIDIA</span>
                      <span className="text-white/20">•</span>
                      <span className="text-[9px] font-bold tracking-wider font-mono text-white/80">INTEL</span>
                      <span className="text-white/20">•</span>
                      <span className="text-[9px] font-bold tracking-wider font-mono text-white/80">APPLE</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Spacer to prevent visual clipping/cutoff at the bottom of the flex list */}
          <div className="h-32 shrink-0 pointer-events-none" />
        </div>
      </div>

      {/* ── Bottom: progress bar + scroll hint ───────────────────────────── */}
      <div 
        className="absolute bottom-6 left-8 right-8 z-20 flex items-center gap-4 transition-all duration-500"
        style={{
          opacity: targetLevel === 5 ? 0 : 1,
          pointerEvents: targetLevel === 5 ? "none" : "auto",
        }}
      >
        {/* Progress bar */}
        <div className="flex-1 h-px bg-white/[0.07] relative overflow-hidden rounded-full">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-in-out"
            style={{
              width: `${((targetLevel - 1) / (TOTAL - 1)) * 100}%`,
              background: "linear-gradient(90deg, rgba(232,162,58,0.25), rgba(232,162,58,0.85))",
              boxShadow: "0 0 8px rgba(232,162,58,0.35)",
            }}
          />
        </div>
        {/* Chapter counter */}
        <div className="text-[9px] font-mono text-white/25 tracking-widest shrink-0">
          {String(targetLevel).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
        </div>
        {/* Scroll hint — fades after first interaction */}
        <div className="text-[8px] font-mono text-white/20 tracking-[0.2em] uppercase shrink-0">
          ↑ ↓ scroll or arrow keys
        </div>
      </div>

      {showPlayground && (
        <PlaygroundOverlay
          quality={perfMode === "high" ? "desktop" : "mobile"}
          onClose={() => setShowPlayground(false)}
        />
      )}

      {activeComponentPortal && (
        <ComponentPortal
          componentId={activeComponentPortal}
          onClose={() => {
            setActiveComponentPortal(null);
            setSelectedBlock(null);
          }}
          onReadArticle={(articleId) => {
            setReaderArticleId(articleId);
          }}
        />
      )}

      {(() => {
        if (!readerArticleId) return null;
        const article = getArticle(readerArticleId);
        if (!article) return null;
        return <ArticleReader article={article} onClose={() => setReaderArticleId(null)} />;
      })()}

      {/* ── Boot screen — branded cover while shaders compile ─────────────── */}
      <div
        className="fixed inset-0 z-[80] bg-[#030407] flex flex-col items-center justify-center"
        style={{
          opacity: booted ? 0 : 1,
          visibility: booted ? "hidden" : "visible",
          pointerEvents: booted ? "none" : "auto",
          transition: "opacity 800ms ease 100ms, visibility 0s linear 1000ms",
        }}
      >
        <div className="text-[13px] font-mono font-bold tracking-[0.5em] text-white/85 uppercase mb-1">
          Bits'nBrews
        </div>
        <div className="text-[8px] font-mono tracking-[0.35em] text-[#e8a23a]/80 uppercase mb-8">
          Architecture Explorer
        </div>
        <div className="w-[180px] h-px bg-white/8 relative overflow-hidden rounded-full">
          <div className="boot-bar absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#e8a23a] to-transparent" />
        </div>
        <div className="text-[7px] font-mono tracking-[0.3em] text-white/25 uppercase mt-4">
          Compiling silicon…
        </div>
      </div>
    </div>
  );
}
