import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
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
    <div className="relative h-screen w-screen overflow-hidden bg-[#0b0d12] font-sans text-white select-none">

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
        <div className="flex items-baseline gap-2.5">
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-white/90">
            Bits&apos;nBrews
          </span>
          <span className="text-[11px] font-normal text-white/40">
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
            className="text-[11px] font-medium text-white/55 hover:text-white/90 transition-colors duration-200 border border-white/12 hover:border-white/30 px-3 py-1.5 rounded-md cursor-pointer bg-[#12151d]/80"
            title={perfMode === "high" ? "Switch to performance mode (lighter rendering)" : "Switch to high quality (bloom & antialiasing)"}
          >
            {perfMode === "high" ? "Quality: High" : "Quality: Performance"}
          </button>

          <button
            onClick={() => setT((p) => (p === 0 ? 1 : 0))}
            className="text-[11px] font-medium text-white/55 hover:text-white/90 transition-colors duration-200 border border-white/12 hover:border-white/30 px-3 py-1.5 rounded-md cursor-pointer bg-[#12151d]/80"
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
        {/* Edition line */}
        <div className={`${EYEBROW} text-white/40 mb-7`}>
          An interactive guide to the modern system-on-chip
        </div>

        <h1 className="text-[58px] font-semibold leading-[1.06] tracking-[-0.03em] text-white/95 mb-7">
          What&apos;s really inside <br />
          <span className="article-serif italic font-medium text-white/85">your processor.</span>
        </h1>
        <p className="text-[15px] leading-[1.8] text-white/60 max-w-[460px] mb-10">
          Bits&apos;nBrews bridges the gap between dense academic papers and
          practical computer architecture. Travel from the laptop in front of
          you down to the 3-nanometre silicon it runs on &mdash; one layer at a time.
        </p>
        <div className="flex items-center gap-5">
          <button
            onClick={() => {
              setTargetLevel(2);
              setChapterVisible(false);
              setTimeout(() => setChapterVisible(true), 320);
            }}
            className="group flex items-center gap-2.5 text-[13px] font-medium text-[#0b0d12] bg-white/95 hover:bg-white transition-all duration-200 px-6 py-3 rounded-lg cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.35),0_4px_12px_rgba(0,0,0,0.25)]"
          >
            <span>Start the journey</span>
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">&rarr;</span>
          </button>
          <span className="text-[12px] text-white/35">5 chapters · ~10 min</span>
        </div>
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
        <div className={`${EYEBROW} text-[#8aa9ff] mb-2.5`}>
          Chapter {currentChapter.chapter}
        </div>
        <h1 className="text-[28px] font-semibold leading-none tracking-tight text-white/92 mb-1.5">
          {currentChapter.title}
        </h1>
        <div className="text-[12px] text-white/45 mb-3.5">
          {currentChapter.subtitle}
        </div>
        <p className="text-[12.5px] leading-[1.7] text-white/60 max-w-[340px]">
          {currentChapter.description}
        </p>
        {targetLevel === 2 && (
          <button
            onClick={() => setShowPlayground(true)}
            className="mt-5 flex items-center gap-2 rounded-lg bg-[#5b7cfa] hover:bg-[#6d8cfb] text-white font-medium text-[12px] px-5 py-2.5 transition-colors duration-200 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.35),0_4px_12px_rgba(0,0,0,0.25)]"
          >
            <span>Open the interactive die</span>
            <span aria-hidden>&rarr;</span>
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
            className="panel absolute right-8 top-1/2 -translate-y-1/2 z-20 w-[320px] max-h-[65vh] overflow-y-auto rounded-xl p-5 scrollbar-thin"
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
            <span className="absolute right-6 text-[11px] font-medium text-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
              {c.title}
            </span>
            {/* Bar */}
            <div
              className="transition-all duration-300 rounded-full"
              style={{
                width: "3px",
                height: targetLevel === c.level ? "22px" : "10px",
                backgroundColor:
                  targetLevel === c.level
                    ? "#8aa9ff"
                    : "rgba(255,255,255,0.22)",
              }}
            />
          </button>
        ))}
      </div>

      {/* ── Chapter 3: Technical Tracks Menu ───────────────────────────────── */}
      <div
        className="panel absolute top-[110px] left-8 z-20 w-[340px] rounded-xl p-5 text-left"
        style={{
          opacity: targetLevel === 3 && chapterVisible ? 1 : 0,
          transform: targetLevel === 3 && chapterVisible ? "translateY(0)" : "translateY(-12px)",
          pointerEvents: targetLevel === 3 ? "auto" : "none",
          transition: "opacity 500ms ease, transform 500ms ease",
        }}
      >
        <div className={`${EYEBROW} text-[#8aa9ff] mb-4`}>
          Publication tracks
        </div>
        <div className="flex flex-col gap-1.5 max-h-[58vh] overflow-y-auto pr-1 scrollbar-none">
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
                className={`flex items-start gap-3.5 text-left px-3 py-2.5 rounded-lg transition-colors duration-200 group cursor-pointer ${
                  active
                    ? "bg-[#8aa9ff]/10"
                    : "hover:bg-white/[0.05]"
                }`}
              >
                <span className={`text-[11px] font-mono mt-0.5 transition-colors ${
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
          </div>

          {/* About & Team Row Card */}
          <div className="panel rounded-xl p-6 flex flex-col md:flex-row gap-8 justify-between mt-2">
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
          </div>

          {/* Section Divider */}
          <div className="flex items-center gap-4 border-t border-white/8 pt-5">
            <div className={`${EYEBROW} text-white/40`}>
              Content tracks
            </div>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Tracks List */}
          <div className="flex flex-col gap-3">
            {TRACKS.map((track, idx) => {
              const numStr = String(idx + 1).padStart(2, "0");
              return (
                <div
                  key={track.id}
                  className="panel hover:border-white/16 transition-colors duration-200 p-6 rounded-xl flex gap-6 group"
                >
                  <div className="text-[13px] font-mono text-white/30 leading-[1.6] shrink-0 w-8">
                    {numStr}
                  </div>
                  <div className="flex flex-col flex-1 text-left">
                    <h3 className="text-[16px] font-semibold text-white/90 group-hover:text-[#aec3ff] transition-colors">
                      {track.name}
                    </h3>
                    <p className="text-[13px] leading-relaxed text-white/55 mt-2">
                      {track.longSummary}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subscribe Newsletter Section */}
          <div className="panel rounded-xl p-8 text-center mt-6">
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
        <div className="flex-1 h-px bg-white/[0.08] relative overflow-hidden rounded-full">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-in-out bg-[#8aa9ff]/70"
            style={{
              width: `${((targetLevel - 1) / (TOTAL - 1)) * 100}%`,
            }}
          />
        </div>
        {/* Chapter counter */}
        <div className="text-[11px] font-mono text-white/35 shrink-0">
          {String(targetLevel).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
        </div>
        {/* Scroll hint — fades after first interaction */}
        <div className="text-[11px] text-white/30 shrink-0">
          Scroll or use arrow keys
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
        className="fixed inset-0 z-[80] bg-[#0b0d12] flex flex-col items-center justify-center"
        style={{
          opacity: booted ? 0 : 1,
          visibility: booted ? "hidden" : "visible",
          pointerEvents: booted ? "none" : "auto",
          transition: "opacity 800ms ease 100ms, visibility 0s linear 1000ms",
        }}
      >
        <div className="text-[16px] font-semibold tracking-[-0.01em] text-white/90 mb-8">
          Bits&apos;nBrews
        </div>
        <div className="w-[160px] h-[2px] bg-white/10 relative overflow-hidden rounded-full">
          <div className="boot-bar absolute inset-0 bg-white/70 rounded-full" />
        </div>
      </div>
    </div>
  );
}
