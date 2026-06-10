import { useEffect, useState } from "react";
import { getComponent, getArticle, type ComponentMetadata } from "./articles";

interface ComponentPortalProps {
  componentId: string;
  onClose: () => void;
  onReadArticle: (articleId: string) => void;
}

const ICONS: Record<string, string> = {
  "cpu-big": "⚡",
  "cpu-eff": "🍃",
  gpu: "🎮",
  npu: "🧠",
  modem: "📡",
  isp: "📷",
  dsp: "🔊",
  slc: "🕸️",
  memctrl: "💾",
};

export function ComponentPortal({ componentId, onClose, onReadArticle }: ComponentPortalProps) {
  const [entered, setEntered] = useState(false);
  const comp = getComponent(componentId);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!comp) return null;

  const basicArticle = getArticle(comp.basicArticleId);
  const advancedArticle = getArticle(comp.advancedArticleId);
  const icon = ICONS[comp.id] || "🔬";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050609]/95 backdrop-blur-md transition-opacity duration-300 p-4 sm:p-8"
      style={{ opacity: entered ? 1 : 0 }}
    >
      {/* Outer ambient decorative glowing grid lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#e8a23a]/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#e8a23a]/3 blur-[100px]" />
      </div>

      {/* Main Glass Panel Container */}
      <div
        className="relative w-full max-w-[1000px] max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#06080d]/85 backdrop-blur-2xl p-6 sm:p-10 shadow-[0_0_60px_rgba(232,162,58,0.12)] flex flex-col gap-8 scrollbar-thin z-10 transition-transform duration-500 ease-out tech-grid-bg"
        style={{ transform: entered ? "scale(1) translateY(0)" : "scale(0.95) translateY(10px)" }}
      >
        {/* Header Block */}
        <div className="flex items-start justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl flex items-center justify-center p-3 rounded-2xl bg-[#e8a23a]/10 border border-[#e8a23a]/25 shadow-[0_0_15px_rgba(232,162,58,0.2)]">
              {icon}
            </span>
            <div className="text-left">
              <span className="text-[9px] font-mono font-bold tracking-[0.3em] text-[#e8a23a] uppercase">
                {comp.tag}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
                {comp.name}
              </h1>
              <p className="text-xs text-white/50 font-light mt-1 max-w-[600px]">
                {comp.shortDesc}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="cyber-button text-[10px] font-mono font-bold tracking-[0.25em] uppercase rounded-lg px-4 py-2 transition-all duration-200 cursor-pointer"
          >
            <span>[CLOSE]</span>
            <span className="text-white/20 normal-case tracking-normal ml-1">esc</span>
          </button>
        </div>

        {/* Content Section: Specs (Left) & Articles (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
          
          {/* Left Column (5/12 cols) - Specs & Textbook Omission */}
          <div className="md:col-span-5 flex flex-col gap-6">
            
            {/* Technical Specifications Card with live animated telemetry */}
            <div className="cyber-card p-6 shadow-2xl relative overflow-hidden tech-grid-bg">
              {/* Decorative target crosshairs */}
              <div className="absolute top-2 right-2 font-mono text-[7px] text-[#e8a23a]/30">[SEC_SYS_09]</div>
              
              <h3 className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#e8a23a] uppercase border-b border-white/5 pb-2.5 mb-4 flex items-center justify-between">
                <span>📟 Telemetry &amp; Specs</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[7px] text-emerald-500 font-bold uppercase tracking-widest">Online</span>
                </span>
              </h3>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                <div>
                  <div className="text-[7.5px] font-mono text-white/30 uppercase tracking-widest">Die Area</div>
                  <div className="text-sm font-semibold text-white/85 font-mono mt-0.5">{comp.area}</div>
                </div>
                <div>
                  <div className="text-[7.5px] font-mono text-white/30 uppercase tracking-widest">Clock Freq</div>
                  <div className="text-sm font-semibold text-white/85 font-mono mt-0.5">{comp.clockSpeed}</div>
                </div>
                <div>
                  <div className="text-[7.5px] font-mono text-white/30 uppercase tracking-widest">Lithography</div>
                  <div className="text-sm font-semibold text-white/85 font-mono mt-0.5">{comp.process}</div>
                </div>
                <div>
                  <div className="text-[7.5px] font-mono text-white/30 uppercase tracking-widest">Power Target</div>
                  <div className="text-sm font-semibold text-[#e8a23a]/80 font-mono mt-0.5 truncate">{comp.powerFocus}</div>
                </div>
              </div>

              {/* Animated Telemetry Graph Wave */}
              <div className="mt-6 border-t border-white/5 pt-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[7.5px] font-mono text-white/25">
                  <span>REAL-TIME UTILIZATION SIGNAL</span>
                  <span className="animate-pulse">SWEEPING...</span>
                </div>
                <div className="h-10 w-full bg-black/40 rounded-lg overflow-hidden border border-white/5 relative">
                  <svg className="w-full h-full opacity-60" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path
                      d="M 0 10 Q 12.5 2, 25 10 T 50 10 T 75 10 T 100 10"
                      fill="none"
                      stroke="#e8a23a"
                      strokeWidth="0.75"
                    >
                      <animate
                        attributeName="d"
                        values="M 0 10 Q 12.5 2, 25 10 T 50 10 T 75 10 T 100 10;
                                M 0 10 Q 12.5 18, 25 10 T 50 10 T 75 10 T 100 10;
                                M 0 10 Q 12.5 2, 25 10 T 50 10 T 75 10 T 100 10"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </path>
                    <path
                      d="M 0 10 Q 12.5 15, 25 10 T 50 10 T 75 10 T 100 10"
                      fill="none"
                      stroke="rgba(232, 162, 58, 0.25)"
                      strokeWidth="0.5"
                    >
                      <animate
                        attributeName="d"
                        values="M 0 10 Q 12.5 15, 25 10 T 50 10 T 75 10 T 100 10;
                                M 0 10 Q 12.5 5, 25 10 T 50 10 T 75 10 T 100 10;
                                M 0 10 Q 12.5 15, 25 10 T 50 10 T 75 10 T 100 10"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </svg>
                  {/* Sweep scan bar overlay */}
                  <div className="absolute top-0 bottom-0 w-px bg-[#e8a23a]/50 shadow-[0_0_8px_#e8a23a] animate-sweep" style={{ left: "0%" }} />
                </div>
              </div>
            </div>

            {/* The Textbook Gap Card with Cyber brackets */}
            <div className="border border-white/5 bg-white/[0.012] rounded-2xl p-5 shadow-xl shadow-black/10 relative overflow-hidden group hover:border-[#e8a23a]/20 transition-all duration-300">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#e8a23a]/50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#e8a23a]/50" />
              
              <h3 className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#e8a23a] uppercase mb-2 flex items-center gap-1.5">
                📝 What Textbooks Omit
              </h3>
              <p className="text-[11.5px] leading-[1.65] text-white/60 font-light">
                {comp.textbookOmission}
              </p>
            </div>
          </div>

          {/* Right Column (7/12 cols) - Curated Articles Set */}
          <div className="md:col-span-7 flex flex-col gap-5">
            <h3 className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#e8a23a] uppercase mb-1">
              📚 Component Learning Path
            </h3>

            {/* Card 1: The Basics (Concept Fundamentals) */}
            {basicArticle ? (
              <div
                onClick={() => onReadArticle(basicArticle.id)}
                className="cyber-card p-5 cursor-pointer flex flex-col gap-3 shadow-md hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-mono font-bold tracking-[0.25em] text-[#e8a23a] uppercase bg-[#e8a23a]/10 border border-[#e8a23a]/20 px-2 py-0.5 rounded-sm">
                    Step 1 — Concept Fundamentals
                  </span>
                  <span className="text-[9px] font-mono text-white/30 tracking-wider">
                    {basicArticle.readTime}
                  </span>
                </div>
                <div>
                  <h4 className="text-[14.5px] font-bold text-white/90 group-hover:text-[#e8a23a] transition-colors">
                    {basicArticle.title}
                  </h4>
                  <p className="text-[11px] leading-relaxed text-white/50 font-light mt-1">
                    {basicArticle.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-5 h-5 rounded-full bg-[#e8a23a]/10 border border-[#e8a23a]/20 flex items-center justify-center font-mono font-bold text-[9px] text-[#e8a23a]">
                    {basicArticle.author[0]}
                  </div>
                  <span className="text-[10px] text-white/40">{basicArticle.author}</span>
                  <span className="text-white/20 font-light text-[9px] ml-auto group-hover:translate-x-1 transition-transform">
                    Start Basics &rarr;
                  </span>
                </div>
              </div>
            ) : null}

            {/* Card 2: Advanced Track Deep-Dive */}
            {advancedArticle ? (
              <div
                onClick={() => onReadArticle(advancedArticle.id)}
                className="cyber-card p-5 cursor-pointer flex flex-col gap-3 shadow-md hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-mono font-bold tracking-[0.25em] text-amber-300/80 uppercase bg-amber-400/5 border border-amber-400/10 px-2 py-0.5 rounded-sm">
                    Step 2 — Track {comp.advancedTrackNo}: {comp.advancedTrackName}
                  </span>
                  <span className="text-[9px] font-mono text-white/30 tracking-wider">
                    {advancedArticle.readTime}
                  </span>
                </div>
                <div>
                  <h4 className="text-[14.5px] font-bold text-white/90 group-hover:text-[#e8a23a] transition-colors">
                    {advancedArticle.title}
                  </h4>
                  <p className="text-[11px] leading-relaxed text-white/50 font-light mt-1">
                    {advancedArticle.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-5 h-5 rounded-full bg-[#e8a23a]/10 border border-[#e8a23a]/20 flex items-center justify-center font-mono font-bold text-[9px] text-[#e8a23a]">
                    {advancedArticle.author[0]}
                  </div>
                  <span className="text-[10px] text-white/40">{advancedArticle.author}</span>
                  <span className="text-white/20 font-light text-[9px] ml-auto group-hover:translate-x-1 transition-transform">
                    Read Deep Dive &rarr;
                  </span>
                </div>
              </div>
            ) : (
              <div className="cyber-card p-5 text-center flex flex-col items-center justify-center gap-1.5 h-[120px] select-none opacity-40">
                <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#e8a23a]/60 uppercase">
                  Track {comp.advancedTrackNo} — {comp.advancedTrackName}
                </span>
                <span className="text-xs font-bold text-white/60">Advanced Analysis In Fabrication</span>
                <span className="text-[9px] text-white/35 font-light">Weekly updates in the publication newsletter.</span>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
