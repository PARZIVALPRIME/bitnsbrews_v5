import { lazy, Suspense, useState, useEffect, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { QualityContext } from "./soc/quality";
import { CHAPTERS, TOTAL } from "./chapters";
import { getArticleForLevel, parseMarkdown } from "./chapterArticles";
import { TRACKS, getTrackArticle } from "./trackArticles";
import { getArticle } from "./articles";
import { Footer } from "./components/Footer";
import { BLOCKS } from "./soc/data";
import { ARTICLE_BLOCK_IDS } from "./articles";
import { TrackIcon } from "./components/TrackIcon";

const LazyArticleReader = lazy(() => import("./ArticleReader").then((module) => ({ default: module.ArticleReader })));
const LazyComponentPortal = lazy(() => import("./ComponentPortal").then((module) => ({ default: module.ComponentPortal })));
const LazyTrackPage = lazy(() => import("./TrackPage").then((module) => ({ default: module.TrackPage })));
const LazySearchPalette = lazy(() => import("./components/SearchPalette").then((module) => ({ default: module.SearchPalette })));
const LazyPlaygroundOverlay = lazy(() => import("./soc/PlaygroundOverlay").then((module) => ({ default: module.PlaygroundOverlay })));

interface SceneProps {
  t: number;
  showLabels: boolean;
  selected: string | null;
  setSelected: (id: string | null) => void;
  mode: "Idle";
  targetLevel: number;
  visMode: string;
  uiTransitionRef?: React.MutableRefObject<{ onUpdate: (levelFloat: number) => void } | null>;
  scrollTargetRef?: React.MutableRefObject<number>;
}

interface UiProps {
  sceneComponent: React.ComponentType<SceneProps>;
}

// Shared label style: quiet uppercase eyebrow — used sparingly, one per section.
const EYEBROW = "text-[10px] font-medium tracking-[0.12em] uppercase";



export function AppUI({ sceneComponent: SceneComp }: UiProps) {
  // ── State ─────────────────────────────────────────────────────────────────
  // Continuous-scroll journey: `scrollTargetRef` (1..TOTAL) is driven by wheel /
  // touch / keyboard; the 3D scene eases its camera toward it. `activeLevel` is
  // the rounded level the camera is currently at — it gates which overlays mount
  // (all existing render logic reads it via the `targetLevel` alias below).
  const [activeLevel, setActiveLevel] = useState(1);
  const targetLevel = activeLevel;                          // alias for existing render logic
  const activeLevelRef = useRef(1);
  const scrollTargetRef = useRef(1);
  const [chapterVisible] = useState(true); // text fade state (kept visible; panels fade via levelFloat)
  const [t, setT] = useState(0.0);
  const [visMode] = useState("physical");
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hubAtBottom, setHubAtBottom] = useState(false);
  const [activeTrackPageId, setActiveTrackPageId] = useState<string | null>(null);

  // ── Article gallery (Page 4) state ────────────────────────────────────────
  const [readerArticleId, setReaderArticleId] = useState<string | null>(null);
  const [activeComponentPortal, setActiveComponentPortal] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const readerOpenRef = useRef(false);
  useEffect(() => {
    readerOpenRef.current =
      readerArticleId !== null || activeComponentPortal !== null || activeTrackPageId !== null || isSearchOpen;
  }, [readerArticleId, activeComponentPortal, activeTrackPageId, isSearchOpen]);

  const [showPlayground, setShowPlayground] = useState(false);

  // Performance scaling settings
  const [perfMode, setPerfMode] = useState<"high" | "low">("high");
  const [autoDowngraded, setAutoDowngraded] = useState(false);
  const [showPerfPrompt, setShowPerfPrompt] = useState(false);

  // Branded boot screen — covers shader compilation / first-frame jank.
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setBooted(true), 1400);
    return () => clearTimeout(id);
  }, []);

  // ── HTML Panel Refs for Real-Time Canvas Synchronization ───────────────────
  const heroPanelRef = useRef<HTMLDivElement>(null);
  const chapterPanelRef = useRef<HTMLDivElement>(null);
  const tracksMenuRef = useRef<HTMLDivElement>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);

  const uiTransitionRef = useRef<{ onUpdate: (levelFloat: number) => void } | null>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const onUpdate = useCallback((levelFloat: number) => {
    // Parallax displacements (max 6px)
    const mx = 0; // mouse.current.x * 6;
    const my = 0; // mouse.current.y * 6;

    // 1. Chapter 1 Hero Panel
    if (heroPanelRef.current) {
      const opacity = Math.max(0, 1 - Math.abs(levelFloat - 1) * 1.55);
      const ty = (levelFloat - 1) * -35 + my;
      heroPanelRef.current.style.opacity = `${opacity}`;
      heroPanelRef.current.style.transform = `translate3d(${mx}px, ${ty}px, 0)`;
      heroPanelRef.current.style.pointerEvents = opacity > 0.15 ? "auto" : "none";
    }

    // 2. Chapters 2–4 Panel
    if (chapterPanelRef.current) {
      let opacity = 0;
      if (levelFloat >= 1.7 && levelFloat <= 4.25) {
        const fromCh1 = Math.min(1, (levelFloat - 1.7) * 4.5);
        const toCh5 = Math.min(1, (4.25 - levelFloat) * 4.0);
        opacity = Math.min(fromCh1, toCh5);
      }
      const ty = (Math.round(levelFloat) - levelFloat) * 20 + my;
      chapterPanelRef.current.style.opacity = `${opacity}`;
      chapterPanelRef.current.style.transform = `translate3d(${mx}px, ${ty}px, 0)`;
      chapterPanelRef.current.style.pointerEvents = opacity > 0.15 ? "auto" : "none";
    }

    // 3. Chapter 3 Tracks Menu
    if (tracksMenuRef.current) {
      const opacity = Math.max(0, 1 - Math.abs(levelFloat - 3) * 3.0);
      const ty = (levelFloat - 3) * -25 + my;
      tracksMenuRef.current.style.opacity = `${opacity}`;
      tracksMenuRef.current.style.transform = `translate3d(${mx}px, ${ty}px, 0)`;
      tracksMenuRef.current.style.pointerEvents = opacity > 0.15 ? "auto" : "none";
    }

    // 4. Detail Panel
    if (detailPanelRef.current) {
      const opacity = Math.max(0, 1 - Math.abs(levelFloat - 3) * 3.0);
      detailPanelRef.current.style.opacity = `${opacity}`;
      detailPanelRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      detailPanelRef.current.style.pointerEvents = opacity > 0.15 ? "auto" : "none";
    }

    // 5. Progress Bar
    if (progressBarRef.current) {
      const opacity = Math.max(0, 1 - Math.max(0, levelFloat - 4) * 2.2);
      progressBarRef.current.style.opacity = `${opacity}`;
      progressBarRef.current.style.pointerEvents = opacity > 0.15 ? "auto" : "none";
    }
    if (progressFillRef.current) {
      const p = Math.max(0, Math.min(1, (levelFloat - 1) / (TOTAL - 1)));
      progressFillRef.current.style.width = `${p * 100}%`;
    }

    // Sync the rounded "active level" to the camera's visual position so overlays
    // mount/unmount in step with what's on screen.
    const rounded = Math.max(1, Math.min(TOTAL, Math.round(levelFloat)));
    if (rounded !== activeLevelRef.current) {
      activeLevelRef.current = rounded;
      setActiveLevel(rounded);
    }
  }, []);

  useEffect(() => {
    uiTransitionRef.current = { onUpdate };
  }, [onUpdate]);

  // Auto-dismiss performance prompt after 8 seconds
  useEffect(() => {
    if (showPerfPrompt) {
      const timer = setTimeout(() => setShowPerfPrompt(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showPerfPrompt]);

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

    // Phones/tablets: start in the lighter tier immediately (don't wait for the
    // 2s FPS probe). Coarse pointer or a narrow viewport is a strong signal.
    const isTouchOrSmall =
      (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches) ||
      window.innerWidth < 768;

    if (isLowRam || isLowGpu || isTouchOrSmall) {
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

  // Jump the journey to a specific level (the scene eases there smoothly).
  const goToLevel = useCallback((lvl: number) => {
    scrollTargetRef.current = Math.max(1, Math.min(TOTAL, lvl));
  }, []);

  // ── Continuous virtual scroll: wheel + touch + keyboard drive a 1..TOTAL
  //    position; the scene eases its camera toward it (that easing is the
  //    inertia). No snapping, no chapter steps — one continuous journey. ───────
  useEffect(() => {
    const WHEEL_SENS = 0.0022; // levels per wheel delta unit
    const TOUCH_SENS = 0.006;  // levels per px dragged

    const nudge = (delta: number) => {
      scrollTargetRef.current = Math.max(1, Math.min(TOTAL, scrollTargetRef.current + delta));
    };

    const nativeScrollEl = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return el
        ? (el.closest(".overflow-y-auto, .overflow-y-scroll, .scrollbar-thin, input[type='range']") as HTMLElement | null)
        : null;
    };

    // Inside the Hub (level 5) the catalog scrolls natively; we only re-capture
    // when the user is at the top of the catalog and scrolling/dragging up.
    const hubBlocks = (goingUp: boolean) => {
      if (activeLevelRef.current !== 5) return false;
      const container = document.getElementById("hub-catalog-container");
      const atTop = !container || container.scrollTop <= 0;
      return !(atTop && goingUp);
    };

    const handleWheel = (e: WheelEvent) => {
      if (readerOpenRef.current) return;
      if (hubBlocks(e.deltaY < 0)) return;          // let the hub catalog scroll
      if (activeLevelRef.current !== 5 && nativeScrollEl(e.target)) return; // panels scroll natively
      e.preventDefault();
      nudge(e.deltaY * WHEEL_SENS);
    };

    let lastTouchY: number | null = null;
    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0]?.clientY ?? null;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (readerOpenRef.current || lastTouchY === null) return;
      const y = e.touches[0]?.clientY ?? lastTouchY;
      const dy = lastTouchY - y;
      lastTouchY = y;
      if (hubBlocks(dy < 0)) return;
      if (activeLevelRef.current !== 5 && nativeScrollEl(e.target)) return;
      if (e.cancelable) e.preventDefault();
      nudge(dy * TOUCH_SENS);
    };
    const handleTouchEnd = () => {
      lastTouchY = null;
    };

    const handleKey = (e: KeyboardEvent) => {
      if (readerOpenRef.current || activeLevelRef.current === 5) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        nudge(e.key === " " ? 0.6 : 0.35);
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        nudge(-0.35);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
      // Introduce a tiny delay (150ms) to ensure responsive feel
      // while avoiding double-trigger issues
      setTimeout(() => {
        // Double check they haven't deselected or changed blocks during the transition
        setSelectedBlock((current) => {
          if (current === id) {
            setActiveComponentPortal(id);
          }
          return current;
        });
      }, 150);
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
              onDecline={() => {
                setDynamicDpr((d) => Math.max(1, d - 0.25));
                if (perfMode === "high") {
                  setShowPerfPrompt(true);
                }
              }}
              onFallback={() => {
                setDynamicDpr(1);
                if (perfMode === "high") {
                  setShowPerfPrompt(true);
                }
              }}
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
                  uiTransitionRef={uiTransitionRef}
                  scrollTargetRef={scrollTargetRef}
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

      {/* ── Top Header Bar ── */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-8 h-16 sm:h-20 pointer-events-none select-none">
        {/* Wordmark logo */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="text-[13px] font-semibold tracking-[0.22em] text-white uppercase">
            Bits&apos;nBrews
          </div>
          <span className="hidden sm:inline-block h-4 w-px bg-white/12" />
          <span className="hidden sm:inline text-[10px] font-mono tracking-wider text-white/40 uppercase">
            Semiconductor Explorer
          </span>
        </div>

        {/* Global Controls Grid */}
        <div className="flex items-center gap-3 pointer-events-auto">

          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 text-[10px] font-mono font-medium tracking-wider text-white/50 hover:text-white transition-colors duration-200 border border-white/8 hover:border-white/20 px-3.5 py-2 rounded-lg cursor-pointer bg-[#12151d]/90 shadow-sm"
            title="Search Library (Cmd+K)"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>SEARCH</span>
            <kbd className="hidden sm:inline-block border border-white/20 rounded px-1.5 py-0.5 text-[9px] font-mono text-white/30 ml-1">
              ⌘K
            </kbd>
          </button>

          <div className="relative hidden sm:flex items-center">
            {showPerfPrompt && perfMode === "high" && (
              <div className="absolute top-[calc(100%+8px)] right-0 flex items-center gap-2 bg-[#ff4a5a] text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-[0_4px_12px_rgba(255,74,90,0.25)] whitespace-nowrap animate-fade-in z-30 border border-white/10 before:content-[''] before:absolute before:-top-1.5 before:right-6 before:border-x-[6px] before:border-x-transparent before:border-b-[6px] before:border-b-[#ff4a5a]">
                <span>Lagging? Switch to Lite mode for a smoother look!</span>
                <button 
                  onClick={() => setShowPerfPrompt(false)} 
                  className="hover:text-white/80 font-bold ml-1 cursor-pointer outline-none"
                >
                  ✕
                </button>
              </div>
            )}
            <button
              onClick={() => {
                const nextMode = perfMode === "high" ? "low" : "high";
                setPerfMode(nextMode);
                setAutoDowngraded(false);
                setShowPerfPrompt(false);
              }}
              className="text-[10px] font-mono font-medium tracking-wider text-white/50 hover:text-white transition-colors duration-200 border border-white/8 hover:border-white/20 px-3.5 py-2 rounded-lg cursor-pointer bg-[#12151d]/90 shadow-sm"
            >
              {perfMode === "high" ? "QUALITY: HIGH" : "QUALITY: LITE"}
            </button>
          </div>

          <button
            onClick={() => setT((p) => (p === 0 ? 1 : 0))}
            className="hidden sm:block text-[10px] font-mono font-medium tracking-wider text-white/50 hover:text-white transition-colors duration-200 border border-white/8 hover:border-white/20 px-3.5 py-2 rounded-lg cursor-pointer bg-[#12151d]/90 shadow-sm"
          >
            {t === 0 ? "EXPLODE" : "ASSEMBLE"}
          </button>
        </div>
      </header>

      {/* ── Chapter 1: Editorial hero ────────── */}
      <div
        ref={heroPanelRef}
        className="absolute left-0 top-0 bottom-0 z-20 flex flex-col justify-center pl-6 pr-6 sm:pl-16 sm:pr-8 w-full sm:w-[52%] will-change-transform"
        style={{
          opacity: 1,
          transform: "translate3d(0, 0, 0)",
          pointerEvents: "auto",
        }}
      >
        <h1 className="text-[30px] sm:text-[38px] font-semibold leading-[1.15] tracking-tight text-white/95 mb-6 mt-8">
          What&apos;s really inside <br />
          <span className="article-serif italic font-normal text-white/80">your processor.</span>
        </h1>
        <p className="text-[13.5px] leading-[1.7] text-white/55 max-w-[420px] mb-8">
          Have you ever wondered what actually happens inside your phone or computer? 
          We take you on a visual walkthrough from the screen you look at every day 
          right down to the tiny microscopic circuits that make it all work, explaining 
          the magic in simple terms, one layer at a time.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            onClick={() => goToLevel(2)}
            className="group flex items-center gap-2.5 text-[13px] font-medium text-[#0b0d12] bg-white/95 hover:bg-white transition-all duration-200 px-6 py-3 rounded-lg cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.35),0_4px_12px_rgba(0,0,0,0.25)]"
          >
            <span>Start the journey</span>
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">&rarr;</span>
          </button>
          <button
            onClick={() => {
              goToLevel(5);
              setTimeout(() => {
                const el = document.getElementById("hub-catalog-container");
                if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
              }, 900);
            }}
            className="text-[13px] font-medium text-white/70 hover:text-white transition-colors cursor-pointer tracking-wider"
          >
            SUBSCRIBE
          </button>
        </div>
      </div>

      {/* ── Chapters 2–4: Compact bottom-left ── */}
      <div
        ref={chapterPanelRef}
        className="absolute left-4 right-4 bottom-20 sm:left-8 sm:right-auto sm:bottom-12 z-20 w-auto sm:w-[420px] text-left will-change-transform"
        style={{
          opacity: 0,
          transform: "translate3d(0, 20px, 0)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            opacity: chapterVisible ? 1 : 0,
            transform: chapterVisible ? "translate3d(0, 0, 0)" : "translate3d(0, 6px, 0)",
            transition: "opacity 160ms cubic-bezier(0.16, 1, 0.3, 1), transform 160ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div className="text-[9.5px] font-mono tracking-[0.12em] text-[#8aa9ff] mb-2 uppercase">
            Chapter {currentChapter.chapter}
          </div>
          <h1 className="text-[20px] font-medium tracking-tight text-white/90 mb-1">
            {currentChapter.title}
          </h1>
          <div className="text-[11px] font-mono tracking-wider text-white/40 mb-3.5 uppercase">
            {currentChapter.subtitle}
          </div>
          <p className="text-[12px] leading-[1.65] text-white/50 max-w-[320px]">
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
      </div>
      
      {/* ── Right: Detail panel (level 3 selected block) ── */}
      {(() => {
        if (targetLevel !== 3 || selectedBlock === null) return null;

        const activeArticle = (() => {
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
        })();

        const isVisible = chapterVisible;

        return (
          <div
            ref={detailPanelRef}
            className="panel absolute left-4 right-4 sm:left-auto sm:right-8 top-1/2 -translate-y-1/2 z-20 w-auto sm:w-[320px] max-h-[55vh] sm:max-h-[65vh] overflow-y-auto rounded-xl p-5 scrollbar-thin will-change-transform"
            style={{
              opacity: 0,
              transform: "translate3d(0, -50%, 0)",
              pointerEvents: "none",
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <div className={`${EYEBROW} text-[#8aa9ff]`}>
                Block detail
              </div>
              <button
                onClick={() => {
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

      {/* ── Chapter 4 3D Keyboard Accessibility ────────────────────────────── */}
      {targetLevel === 4 && (
        <div className="sr-only" aria-live="polite">
          {BLOCKS.filter(b => ARTICLE_BLOCK_IDS.has(b.id)).map((block) => (
            <button
              key={block.id}
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-50 focus:bg-[#12151d] focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:border focus:border-[#8aa9ff]"
              onFocus={() => setSelectedBlock(block.id)}
              onBlur={() => setSelectedBlock(null)}
              onClick={() => {
                setSelectedBlock(block.id);
                setActiveComponentPortal(block.id);
              }}
              tabIndex={0}
            >
              Open details for {block.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Chapter 3: Technical Tracks Menu ───────────────────────────────── */}
      <div
        ref={tracksMenuRef}
        className="panel absolute top-[88px] sm:top-[110px] left-4 right-4 sm:left-8 sm:right-auto z-20 w-auto sm:w-[340px] rounded-xl p-5 text-left flex flex-col max-h-[42vh] sm:max-h-[calc(100vh-410px)] will-change-transform"
        style={{
          opacity: 0,
          transform: "translate3d(0, -12px, 0)",
          pointerEvents: "none",
        }}
      >
        <div className={`${EYEBROW} text-[#8aa9ff] mb-4`}>
          Publication tracks
        </div>
        <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 scrollbar-none flex-1">
          {TRACKS.map((track, idx) => {
            const numStr = String(idx + 1).padStart(2, "0");
            return (
              <button
                key={track.id}
                onClick={() => {
                  setActiveTrackPageId(track.id);
                }}
                className="flex items-start gap-3.5 text-left px-3 py-2.5 rounded-lg transition-colors duration-200 group cursor-pointer hover:bg-white/[0.05]"
              >
                <span className="text-[11px] font-mono mt-0.5 text-white/30 group-hover:text-white/55 transition-colors">
                  {numStr}
                </span>
                <div className="flex flex-col">
                  <span className="text-[12.5px] font-medium text-white/85 group-hover:text-white transition-colors">
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
        className="absolute inset-x-0 z-25 text-left overflow-y-auto scrollbar-thin"
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
        <div className="max-w-[760px] mx-auto flex flex-col gap-8 px-6 sm:px-8">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {TRACKS.map((track, idx) => {
              const numStr = String(idx + 1).padStart(2, "0");
              return (
                <div
                  key={track.id}
                  style={{
                    opacity: targetLevel === 5 ? 1 : 0,
                    transform: targetLevel === 5 ? "translateY(0)" : "translateY(16px)",
                    transition: `opacity 600ms ease ${idx * 80}ms, transform 600ms ease ${idx * 80}ms`
                  }}
                >
                  <button
                    onClick={() => setActiveTrackPageId(track.id)}
                    className="group relative flex flex-col text-left w-full h-full rounded-2xl border border-white/10 bg-[#12151d] hover:bg-[#1a1d27] hover:border-white/20 transition-all duration-300 overflow-hidden hover:-translate-y-1 shadow-lg"
                  >
                    {/* Glowy background effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#8aa9ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    <div className="p-6 sm:p-7 flex flex-col h-full relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-[#8aa9ff] group-hover:scale-110 transition-transform duration-300 origin-bottom-left">
                          <TrackIcon id={track.id} className="w-8 h-8" color="#8aa9ff" />
                        </span>
                        <span className="text-[11px] font-mono font-medium text-white/30 group-hover:text-[#8aa9ff] transition-colors tracking-widest">
                          NO. {numStr}
                        </span>
                      </div>
                      
                      <h3 className="text-[18px] font-semibold text-white/95 group-hover:text-white transition-colors mb-2.5">
                        {track.name}
                      </h3>
                      <p className="text-[13px] leading-relaxed text-white/60 group-hover:text-white/75 transition-colors flex-grow">
                        {track.longSummary}
                      </p>
                      
                      <div className="mt-5 flex items-center text-[12px] font-medium text-[#8aa9ff] opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-1 group-hover:translate-x-0">
                        Explore Track &rarr;
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

        </div>

        {/* ── Subscribe Newsletter: Full Sweep Footer ── */}
        <Footer
          onNavigateToDie={() => {
            goToLevel(2);
            setShowPlayground(true);
          }}
          onNavigateToTracks={() => {
            const el = document.getElementById("hub-catalog-container");
            if (el) {
              el.scrollTo({ top: 380, behavior: "smooth" });
            }
          }}
        />
      </div>

      {/* ── Bottom: progress bar + scroll hint ───────────────────────────── */}
      <div 
        ref={progressBarRef}
        className="absolute bottom-6 left-8 right-8 z-20 flex items-center gap-4 will-change-transform"
        style={{
          opacity: 1,
          pointerEvents: "auto",
        }}
      >
        {/* Continuous journey progress — width driven per-frame in onUpdate */}
        <div className="flex-1 h-px bg-white/[0.08] relative overflow-hidden rounded-full">
          <div
            ref={progressFillRef}
            className="absolute left-0 top-0 h-full rounded-full bg-[#8aa9ff]/70"
            style={{ width: "0%" }}
          />
        </div>
        {/* Scroll hint */}
        <div className="text-[11px] text-white/30 shrink-0">
          Scroll to explore
        </div>
      </div>

      {showPlayground && (
        <Suspense fallback={null}>
          <LazyPlaygroundOverlay
            quality={perfMode === "high" ? "desktop" : "mobile"}
            onClose={() => setShowPlayground(false)}
          />
        </Suspense>
      )}

      {activeTrackPageId && (
        <Suspense fallback={null}>
          <LazyTrackPage
            trackId={activeTrackPageId}
            onClose={() => setActiveTrackPageId(null)}
            onReadArticle={(articleId) => {
              setReaderArticleId(articleId);
            }}
          />
        </Suspense>
      )}

      {activeComponentPortal && (
        <Suspense fallback={null}>
          <LazyComponentPortal
            componentId={activeComponentPortal}
            onClose={() => {
              setActiveComponentPortal(null);
              setSelectedBlock(null);
            }}
            onReadArticle={(articleId) => {
              setReaderArticleId(articleId);
            }}
          />
        </Suspense>
      )}

      {(() => {
        if (!readerArticleId) return null;
        const article = getArticle(readerArticleId);
        if (!article) return null;
        return (
          <Suspense fallback={null}>
            <LazyArticleReader article={article} onClose={() => setReaderArticleId(null)} onNavigate={(id) => setReaderArticleId(id)} />
          </Suspense>
        );
      })()}

      {/* ── Global Search Palette ──────────────────────────────────────────── */}
      {isSearchOpen && (
        <Suspense fallback={null}>
          <LazySearchPalette
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onSelectArticle={(id) => setReaderArticleId(id)}
            onSelectTrack={(id) => setActiveTrackPageId(id)}
          />
        </Suspense>
      )}

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
