import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { QualityContext } from "./soc/quality";
import { CHAPTERS, TOTAL } from "./chapters";
import { getArticleForLevel, parseMarkdown } from "./chapterArticles";
import { TRACKS, getTrackArticle } from "./trackArticles";
import { getArticle } from "./articles";
import { ArticleReader } from "./ArticleReader";
import { ComponentPortal } from "./ComponentPortal";

import { PlaygroundOverlay } from "./soc/PlaygroundOverlay";

interface SceneProps {
  t: number;
  showLabels: boolean;
  selected: string | null;
  setSelected: (id: string | null) => void;
  mode: "Idle";
  targetLevel: number;
  visMode: string;
}

interface UiProps {
  sceneComponent: React.ComponentType<SceneProps>;
  quality?: "desktop" | "mobile";
}

// Shared label style: quiet uppercase eyebrow — used sparingly, one per section.
const EYEBROW = "text-[10px] font-medium tracking-[0.12em] uppercase";

// One motion vocabulary for every overlay: tactile spring, quick exits.
const SPRING = { type: "spring", stiffness: 280, damping: 28 } as const;
const EXIT_TWEEN = { duration: 0.22, ease: "easeIn" } as const;

const riseIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: SPRING },
  exit: { opacity: 0, y: -10, transition: EXIT_TWEEN },
};

const staggerParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0 } },
};

// Headline lines rise out of an overflow-hidden mask — editorial, not flashy.
const lineReveal = {
  hidden: { y: "112%" },
  visible: { y: "0%", transition: { type: "spring", stiffness: 200, damping: 30 } },
  exit: { y: "0%" },
} as const;

export function AppUI({ sceneComponent: SceneComp, quality: _quality = "desktop" }: UiProps) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [targetLevel, setTargetLevel] = useState(1);       // snap destination (1-7)
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

  // Escape closes overlays top-down: reader first, then the component portal.
  // Centralized here so stacked layers never close together on one keypress.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (readerArticleId) {
        setReaderArticleId(null);
      } else if (activeComponentPortal) {
        setActiveComponentPortal(null);
        setSelectedBlock(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readerArticleId, activeComponentPortal]);

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
      setTargetLevel((prev) => Math.max(1, Math.min(TOTAL, prev + dir)));
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
  const suspendMainScene = readerArticleId !== null || showPlayground;

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
    <div className="relative h-screen w-screen overflow-hidden bg-[#0b0d12] font-sans text-white select-none">

      {/* ── 3D Canvas ─────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-1">
        {!suspendMainScene && (
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
        )}
      </div>

      {/* ── Vignette: two layers that cross-fade between ch1 and ch2+ ───── */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: "linear-gradient(to right, rgba(11,13,18,0.95) 0%, rgba(11,13,18,0.85) 30%, transparent 60%)",
          opacity: targetLevel === 1 ? 1 : 0,
          transition: "opacity 700ms ease",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(11,13,18,0.5))",
          opacity: targetLevel === 1 ? 0 : 1,
          transition: "opacity 700ms ease",
        }}
      />

      {/* ── Top-left: Publication wordmark ───────────────────────────────── */}
      <div className="absolute top-6 left-8 z-20">
        <div className="flex items-center gap-3">
          <span className="article-serif text-[17px] font-semibold tracking-[-0.01em] text-white/92">
            Bits&apos;nBrews
          </span>
          <span className="h-3 w-px bg-white/15" aria-hidden />
          <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/40">
            Architecture Explorer
          </span>
        </div>
      </div>

      {/* ── Top-right: Explode & Performance toggles ──────────────────────── */}
      <div className="absolute top-6 right-8 z-20 flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const nextMode = perfMode === "high" ? "low" : "high";
              setPerfMode(nextMode);
              setAutoDowngraded(false);
            }}
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/55 hover:text-white/90 transition-colors duration-200 border border-white/12 hover:border-white/30 px-3 py-2 rounded-md cursor-pointer bg-[#12151d]"
            title={perfMode === "high" ? "Switch to performance mode (lighter rendering)" : "Switch to high quality (bloom & antialiasing)"}
          >
            Quality · {perfMode === "high" ? "High" : "Perf"}
          </button>

          <button
            onClick={() => setT((p) => (p === 0 ? 1 : 0))}
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/55 hover:text-white/90 transition-colors duration-200 border border-white/12 hover:border-white/30 px-3 py-2 rounded-md cursor-pointer bg-[#12151d]"
          >
            {t === 0 ? "Exploded view" : "Assemble"}
          </button>
        </div>
        {autoDowngraded && (
          <span className="text-[10px] text-white/40 select-none">
            Adjusted automatically for this device
          </span>
        )}
      </div>

      {/* ── Chapter 1: Editorial hero — staggered spring entrance ──────────── */}
      <AnimatePresence>
        {targetLevel === 1 && (
          <motion.div
            key="hero"
            variants={staggerParent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute left-0 top-0 bottom-0 z-20 flex flex-col justify-center pl-16 pr-8 w-[52%]"
          >
            {/* Edition line */}
            <motion.div variants={riseIn} className="flex items-center gap-3 mb-7">
              <span className="h-px w-10 bg-[#8aa9ff]/60" aria-hidden />
              <span className={`${EYEBROW} text-white/40`}>
                An interactive guide to the modern system-on-chip
              </span>
            </motion.div>

            <motion.h1
              variants={riseIn}
              className="font-semibold leading-[1.06] tracking-[-0.03em] text-white/95 mb-7"
              style={{ fontSize: "clamp(42px, 4.6vw, 68px)" }}
            >
              <span className="block overflow-hidden pb-1">
                <motion.span variants={lineReveal} className="block">
                  What&apos;s really inside
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-2">
                <motion.span
                  variants={lineReveal}
                  className="block article-serif italic font-medium text-white/85"
                >
                  your processor.
                </motion.span>
              </span>
            </motion.h1>
            <motion.p variants={riseIn} className="text-[15px] leading-[1.8] text-white/60 max-w-[460px] mb-10">
              Bits&apos;nBrews bridges the gap between dense academic papers and
              practical computer architecture. Travel from the laptop in front of
              you down to the 3-nanometre silicon it runs on &mdash; one layer at a time.
            </motion.p>
            <motion.div variants={riseIn} className="flex items-center gap-5">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING}
                onClick={() => setTargetLevel(2)}
                className="group flex items-center gap-2.5 text-[13px] font-medium text-[#0b0d12] bg-white/95 hover:bg-white px-6 py-3 rounded-lg cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.35),0_4px_12px_rgba(0,0,0,0.25)]"
              >
                <span>Start the journey</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">&rarr;</span>
              </motion.button>
              <span className="text-[12px] text-white/35">5 chapters · ~10 min</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chapters 2–3: Compact bottom-left — cross-fades between chapters ── */}
      <AnimatePresence mode="wait">
        {targetLevel > 1 && targetLevel <= 3 && (
          <motion.div
            key={`chapter-${targetLevel}`}
            variants={staggerParent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute bottom-16 left-8 z-20 max-w-sm"
          >
            <motion.div variants={riseIn} className="flex items-center gap-3 mb-3">
              <span className="font-mono text-[10px] tabular-nums text-[#8aa9ff]" aria-hidden>
                {currentChapter.chapter}
              </span>
              <span className="h-px w-8 bg-[#8aa9ff]/50" aria-hidden />
              <span className={`${EYEBROW} text-[#8aa9ff]`}>Chapter</span>
            </motion.div>
            <motion.h1 variants={riseIn} className="article-serif text-[32px] font-semibold leading-[1.05] tracking-[-0.01em] text-white/95 mb-2">
              {currentChapter.title}
            </motion.h1>
            <motion.div variants={riseIn} className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-white/40 mb-3.5">
              {currentChapter.subtitle}
            </motion.div>
            <motion.p variants={riseIn} className="text-[12.5px] leading-[1.7] text-white/60 max-w-[340px]">
              {currentChapter.description}
            </motion.p>
            {targetLevel === 2 && (
              <motion.button
                variants={riseIn}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowPlayground(true)}
                className="mt-5 flex items-center gap-2 rounded-lg bg-[#5b7cfa] hover:bg-[#6d8cfb] text-white font-medium text-[12px] px-5 py-2.5 transition-colors duration-200 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.35),0_4px_12px_rgba(0,0,0,0.25)]"
              >
                <span>Open the interactive die</span>
                <span aria-hidden>&rarr;</span>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ── Right: Detail panel (level 3 selected track/block) ── */}
      <AnimatePresence>
        {targetLevel === 3 && (selectedTrack !== null || selectedBlock !== null) && (() => {
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

          return (
            <motion.div
              key={selectedTrack ?? selectedBlock}
              initial={{ opacity: 0, x: 24, y: "-50%" }}
              animate={{ opacity: 1, x: 0, y: "-50%", transition: SPRING }}
              exit={{ opacity: 0, x: 16, y: "-50%", transition: EXIT_TWEEN }}
              className="panel absolute right-8 top-1/2 z-20 w-[320px] max-h-[65vh] overflow-y-auto rounded-xl p-5 scrollbar-thin"
            >
              <div className="flex justify-between items-center mb-2">
                <div className={`${EYEBROW} text-[#8aa9ff]`}>
                  {selectedTrack !== null ? "Technical track" : "Block detail"}
                </div>
                <button
                  onClick={() => {
                    setSelectedTrack(null);
                    setSelectedBlock(null);
                  }}
                  aria-label="Close panel"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-white/40 hover:text-white/90 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="text-left text-white/80">
                {parseMarkdown(activeArticle)}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

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
            onClick={() => setTargetLevel(c.level)}
            title={c.title}
            className="group relative flex items-center justify-end gap-2 cursor-pointer py-0.5"
          >
            {/* Label on hover */}
            <span className="absolute right-6 text-[11px] font-medium text-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
              {c.title}
            </span>
            {/* Bar */}
            <motion.div
              className="rounded-full"
              animate={{
                height: targetLevel === c.level ? 22 : 10,
                backgroundColor:
                  targetLevel === c.level ? "#8aa9ff" : "rgba(255,255,255,0.22)",
              }}
              transition={SPRING}
              style={{ width: 3 }}
            />
          </button>
        ))}
      </div>

      {/* ── Chapter 3: Technical Tracks Menu — staggered list reveal ────────── */}
      <AnimatePresence>
        {targetLevel === 3 && (
          <motion.div
            key="tracks-menu"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0, transition: SPRING }}
            exit={{ opacity: 0, y: -10, transition: EXIT_TWEEN }}
            className="panel absolute top-[110px] left-8 z-20 w-[340px] rounded-xl p-5 text-left"
          >
            <div className="flex items-baseline justify-between pb-3 mb-2.5 border-b border-white/8">
              <div className={`${EYEBROW} text-[#8aa9ff]`}>
                Publication tracks
              </div>
              <span className="font-mono text-[10px] tabular-nums text-white/30">
                {String(TRACKS.length).padStart(2, "0")}
              </span>
            </div>
            <motion.div
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.035, delayChildren: 0.1 } },
              }}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-1.5 max-h-[58vh] overflow-y-auto pr-1 scrollbar-none"
            >
              {TRACKS.map((track, idx) => {
                const active = selectedTrack === track.id;
                const numStr = String(idx + 1).padStart(2, "0");
                return (
                  <motion.button
                    key={track.id}
                    variants={{
                      hidden: { opacity: 0, x: -12 },
                      visible: { opacity: 1, x: 0, transition: SPRING },
                    }}
                    onClick={() => {
                      setSelectedTrack(track.id);
                      setSelectedBlock(null);
                    }}
                    className={`flex items-start gap-3.5 text-left px-3 py-2.5 rounded-lg transition-colors duration-200 group cursor-pointer ${
                      active
                        ? "bg-[#8aa9ff]/10"
                        : "hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className={`text-[11px] font-mono tabular-nums mt-0.5 transition-colors ${
                      active ? "text-[#8aa9ff]" : "text-white/30 group-hover:text-white/55"
                    }`}>
                      {numStr}
                    </span>
                    <div className="flex flex-col">
                      <span className={`text-[12.5px] font-medium transition-colors ${
                        active ? "text-[#aec3ff]" : "text-white/85 group-hover:text-white"
                      }`}>
                        {track.name}
                      </span>
                      <span className="text-[11px] text-white/45 leading-snug mt-0.5">
                        {track.desc}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hub: Full-screen Dark Backdrop Overlay ───────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 z-15 bg-black transition-opacity duration-1000 ease-in-out"
        style={{
          opacity: targetLevel === 5 ? (hubAtBottom ? 0.22 : 0.82) : 0,
        }}
      />

      {/* ── Level 11: Hub Directory & Team Dashboard (Single Column Redesign) ── */}
      <AnimatePresence>
      {targetLevel === 5 && (
      <motion.div
        key="hub"
        id="hub-catalog-container"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0, transition: SPRING }}
        exit={{ opacity: 0, y: 16, transition: EXIT_TWEEN }}
        className="absolute inset-x-8 z-25 text-left overflow-y-auto scrollbar-thin"
        style={{ top: "96px", bottom: "24px" }}
        onScroll={(e) => {
          const target = e.currentTarget;
          const threshold = 160;
          const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
          setHubAtBottom(nearBottom);
        }}
      >
        <motion.div
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
          }}
          initial="hidden"
          animate="visible"
          className="max-w-[760px] mx-auto flex flex-col gap-8 pr-3"
        >
          {/* Header */}
          <motion.div variants={riseIn} className="text-center mt-6">
            <h1 className="article-serif text-[44px] font-semibold tracking-[-0.01em] text-white/95">
              Bits&apos;nBrews
            </h1>
            <div className={`${EYEBROW} text-[#8aa9ff] mt-2`}>
              Publication catalog
            </div>
            <p className="text-[13px] text-white/55 max-w-lg mx-auto leading-relaxed mt-4">
              Technical series breaking down silicon, processor design, and engineering
              trade-offs. Browse the tracks below or subscribe to the newsletter.
            </p>
          </motion.div>

          {/* About & Team Row Card */}
          <motion.div variants={riseIn} className="panel rounded-xl p-6 flex flex-col md:flex-row gap-8 justify-between mt-2">
            <div className="flex-1">
              <div className={`${EYEBROW} text-white/40 mb-2.5`}>
                About the publication
              </div>
              <p className="text-[13px] leading-[1.7] text-white/60">
                Bits&apos;nBrews is an interactive digital engineering museum. We bridge the gap between academic VLSI briefs and practical chip design through spatial graphics, real-time pipeline simulations, and deep-dive technical journalism.
              </p>
            </div>

            <div className="w-full md:w-[240px] md:border-l border-white/8 md:pl-6 flex flex-col gap-4">
              <div className={`${EYEBROW} text-white/40 mb-1`}>
                Team
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[12px] font-medium text-white/85">Dhruv</span>
                  <span className="text-[11px] text-white/40">Architecture</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[12px] font-medium text-white/85">Gemini Partner</span>
                  <span className="text-[11px] text-white/40">Engineering</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[12px] font-medium text-white/85">Parzival Prime</span>
                  <span className="text-[11px] text-white/40">Graphics</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section Divider */}
          <motion.div variants={riseIn} className="flex items-center gap-4 border-t border-white/8 pt-5">
            <div className={`${EYEBROW} text-white/40`}>
              Content tracks
            </div>
            <div className="flex-1 h-px bg-white/8" />
            <span className="font-mono text-[10px] tabular-nums text-white/30">
              {String(TRACKS.length).padStart(2, "0")} series
            </span>
          </motion.div>

          {/* Tracks List */}
          <div className="flex flex-col gap-3">
            {TRACKS.map((track, idx) => {
              const numStr = String(idx + 1).padStart(2, "0");
              return (
                <motion.div
                  key={track.id}
                  variants={riseIn}
                  whileHover={{ y: -2 }}
                  transition={SPRING}
                  className="panel hover:border-white/16 transition-colors duration-200 p-6 rounded-xl flex gap-6 group"
                >
                  <div className="text-[13px] font-mono tabular-nums text-white/30 leading-[1.6] shrink-0 w-9 border-r border-white/6 group-hover:border-white/12 transition-colors">
                    {numStr}
                  </div>
                  <div className="flex flex-col flex-1 text-left">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-[16px] font-semibold text-white/90 group-hover:text-[#aec3ff] transition-colors">
                        {track.name}
                      </h3>
                      <span
                        className="text-[13px] text-white/0 group-hover:text-white/45 -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
                        aria-hidden
                      >
                        &rarr;
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-white/55 mt-2">
                      {track.longSummary}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Subscribe Newsletter Section */}
          <motion.div variants={riseIn} className="panel rounded-xl p-8 text-center mt-6">
            <div className="max-w-md mx-auto">
              <h2 className="article-serif text-[24px] font-semibold tracking-tight text-white/95 mb-2.5">
                The newsletter
              </h2>
              <p className="text-[13px] text-white/55 leading-relaxed mb-6">
                Spatial-first writeups on silicon layouts, execution pipelines, and
                instruction-set trade-offs. Written for engineers and the engineering-curious.
              </p>

              {subscribed ? (
                <div className="py-4 text-center animate-fade-in">
                  <div className="relative w-11 h-11 mx-auto mb-4 flex items-center justify-center rounded-full bg-[#5bd6a2]/12 border border-[#5bd6a2]/40">
                    <svg className="w-4 h-4 text-[#5bd6a2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="animate-checkmark" />
                    </svg>
                  </div>
                  <div className="text-[13px] font-medium text-white/90">
                    You&apos;re on the list
                  </div>
                  <p className="text-[12px] text-white/50 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    Check your inbox to confirm your subscription.
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
                      placeholder="you@example.com"
                      aria-label="Email address"
                      className="flex-1 bg-[#0b0d12] border border-white/12 focus:border-[#8aa9ff] focus:ring-1 focus:ring-[#8aa9ff]/40 outline-none text-[13px] px-4 py-3 rounded-lg text-white transition-colors duration-200 placeholder-white/30"
                      required
                      disabled={submitting}
                    />
                    <button
                      type="submit"
                      className="bg-white/95 hover:bg-white text-[#0b0d12] font-medium text-[13px] px-6 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Subscribing
                        </span>
                      ) : (
                        "Subscribe"
                      )}
                    </button>
                  </form>
                  <p className="mt-4 text-[11px] text-white/35">
                    Published fortnightly. No marketing, unsubscribe anytime.
                  </p>
                </>
              )}
            </div>
          </motion.div>

          {/* Spacer to prevent visual clipping/cutoff at the bottom of the flex list */}
          <div className="h-32 shrink-0 pointer-events-none" />
        </motion.div>
      </motion.div>
      )}
      </AnimatePresence>

      {/* ── Bottom: progress bar + scroll hint ───────────────────────────── */}
      <div 
        className="absolute bottom-6 left-8 right-8 z-20 flex items-center gap-4 transition-all duration-500"
        style={{
          opacity: targetLevel === 5 ? 0 : 1,
          pointerEvents: targetLevel === 5 ? "none" : "auto",
        }}
      >
        {/* Current chapter title */}
        <AnimatePresence mode="wait">
          <motion.div
            key={targetLevel}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-[11px] font-medium text-white/50 shrink-0 w-[120px]"
          >
            {currentChapter.title}
          </motion.div>
        </AnimatePresence>
        {/* Progress bar */}
        <div className="flex-1 h-px bg-white/[0.08] relative overflow-hidden rounded-full">
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full bg-[#8aa9ff]/70"
            animate={{ width: `${((targetLevel - 1) / (TOTAL - 1)) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 24 }}
          />
        </div>
        {/* Chapter counter */}
        <div className="text-[11px] font-mono tabular-nums text-white/35 shrink-0">
          {String(targetLevel).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
        </div>
        {/* Scroll hint — fades after first interaction */}
        <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-white/25 shrink-0">
          Scroll or use arrow keys
        </div>
      </div>

      {showPlayground && (
        <PlaygroundOverlay
          quality={perfMode === "high" ? "desktop" : "mobile"}
          onClose={() => setShowPlayground(false)}
        />
      )}

      <AnimatePresence>
        {activeComponentPortal && (
          <ComponentPortal
            key={activeComponentPortal}
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
      </AnimatePresence>

      <AnimatePresence>
        {(() => {
          if (!readerArticleId) return null;
          const article = getArticle(readerArticleId);
          if (!article) return null;
          return <ArticleReader key={readerArticleId} article={article} onClose={() => setReaderArticleId(null)} />;
        })()}
      </AnimatePresence>

      {/* ── Boot screen — branded cover while shaders compile ─────────────── */}
      <AnimatePresence>
        {!booted && (
          <motion.div
            key="boot"
            className="fixed inset-0 z-[80] bg-[#0b0d12] flex flex-col items-center justify-center"
            exit={{ opacity: 0, transition: { duration: 0.7, ease: "easeInOut" } }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: SPRING }}
              className="text-[16px] font-semibold tracking-[-0.01em] text-white/90 mb-3"
            >
              Bits&apos;nBrews
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.2, duration: 0.4 } }}
              className={`${EYEBROW} text-white/35 mb-8`}
            >
              Architecture Explorer
            </motion.div>
            <div className="w-[160px] h-[2px] bg-white/10 relative overflow-hidden rounded-full">
              <div className="boot-bar absolute inset-0 bg-white/70 rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
