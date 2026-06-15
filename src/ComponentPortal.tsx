import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getComponent, getArticle, getArticleSlug } from "./articles";
import { DOMAIN_ACCENTS } from "./soc/data";

interface ComponentPortalProps {
  componentId: string;
  onClose: () => void;
  onReadArticle: (articleId: string) => void;
}

// Per-component accent — same domain colors the 3D die uses.
const ACCENTS: Record<string, string> = {
  "cpu-big": DOMAIN_ACCENTS.cpuBig,
  "cpu-eff": DOMAIN_ACCENTS.cpuEff,
  gpu: DOMAIN_ACCENTS.gpu,
  npu: DOMAIN_ACCENTS.npu,
  modem: DOMAIN_ACCENTS.modem,
  isp: DOMAIN_ACCENTS.isp,
  dsp: DOMAIN_ACCENTS.dsp,
  slc: DOMAIN_ACCENTS.slc,
  memctrl: DOMAIN_ACCENTS.memctrl,
};

// Minimal line icons (24×24, stroke 1.5) — one consistent family, no emoji.
const ICON_PATHS: Record<string, ReactNode> = {
  "cpu-big": (
    <>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
      <rect x="10" y="10" width="4" height="4" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    </>
  ),
  "cpu-eff": (
    <>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
      <path d="M12 9v3l2 2" />
    </>
  ),
  gpu: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="1.5" />
      <path d="M8 6v12M12 6v12M16 6v12M4 10h16M4 14h16" />
    </>
  ),
  npu: (
    <>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M7.6 7.6 9.9 9.9M16.4 7.6 14.1 9.9M7.6 16.4 9.9 14.1M16.4 16.4 14.1 14.1" />
    </>
  ),
  modem: (
    <>
      <path d="M12 18v3" />
      <circle cx="12" cy="17" r="1.2" />
      <path d="M8.5 13.5a5 5 0 0 1 7 0M5.6 10.6a9 9 0 0 1 12.8 0M2.8 7.8a13 13 0 0 1 18.4 0" />
    </>
  ),
  isp: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 4v4.5M19.2 8.4l-4 2.2M16.8 18.9 14 15.2M7.2 18.9 10 15.2M4.8 8.4l4 2.2" />
    </>
  ),
  dsp: (
    <>
      <path d="M3 12h3l2-6 4 12 2-6h2" />
      <path d="M18 12h3" />
    </>
  ),
  slc: (
    <>
      <path d="M12 3 4 7l8 4 8-4-8-4Z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 17l8 4 8-4" />
    </>
  ),
  memctrl: (
    <>
      <rect x="3" y="8" width="18" height="8" rx="1.5" />
      <path d="M7 8v8M11 8v8M15 8v8M19 8v8" opacity="0.6" />
      <path d="M6 16v3M10 16v3M14 16v3M18 16v3" />
    </>
  ),
};

function ComponentIcon({ id, color }: { id: string; color: string }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICON_PATHS[id] ?? ICON_PATHS["cpu-big"]}
    </svg>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-white/6 last:border-b-0">
      <span className="text-[12px] text-white/45">{label}</span>
      <span className="text-[12.5px] font-mono text-white/85 text-right">{value}</span>
    </div>
  );
}

export function ComponentPortal({ componentId, onClose, onReadArticle }: ComponentPortalProps) {
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const comp = getComponent(componentId);
  const router = useRouter();

  useEffect(() => {
    // A slightly longer timeout guarantees the browser registers the mounting state
    // before applying the CSS transition.
    const timer = setTimeout(() => setEntered(true), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 240);
  };

  if (!comp) return null;

  const basicArticle = getArticle(comp.basicArticleId);
  const advancedArticle = getArticle(comp.advancedArticleId);
  const accent = ACCENTS[comp.id] ?? "#8aa9ff";

  // A migrated article opens its real /articles/<slug> page; everything else
  // still uses the in-experience overlay reader.
  const handleRead = (id: string) => {
    const slug = getArticleSlug(id);
    if (slug) router.push(`/articles/${slug}`);
    else onReadArticle(id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-transparent pointer-events-auto"
      onClick={handleClose}
    >
      {/* Right Sidebar Panel */}
      <div
        className="relative w-full max-w-[420px] h-full overflow-y-auto border-l border-white/10 bg-[#0c0d12]/96 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col gap-6 scrollbar-none pointer-events-auto"
        style={{
          opacity: entered && !closing ? 1 : 0,
          transform: entered && !closing
            ? "translate3d(0, 0, 0)"
            : "translate3d(40px, 0, 0) scale(0.98)",
          transitionProperty: "opacity, transform",
          transitionDuration: closing ? "240ms" : "400ms",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3.5">
            <span
              className="flex items-center justify-center w-11 h-11 rounded-xl border shrink-0"
              style={{ borderColor: `${accent}40`, background: `${accent}14` }}
            >
              <ComponentIcon id={comp.id} color={accent} />
            </span>
            <div className="text-left">
              <span className="text-[9.5px] font-mono tracking-[0.12em] uppercase" style={{ color: accent }}>
                {comp.tag}
              </span>
              <h1 className="text-[20px] font-semibold tracking-tight text-white/90">
                {comp.name}
              </h1>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:text-white/90 hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Short description */}
        <p className="text-[12.5px] leading-relaxed text-white/60 -mt-1.5 text-left">
          {comp.shortDesc}
        </p>

        <hr className="border-white/8 -my-1.5" />

        <div className="flex flex-col gap-6 text-left">
          {/* Specs */}
          <div className="rounded-xl border border-white/8 bg-[#0e1118]/80 p-4">
            <h3 className="text-[10px] font-mono tracking-[0.1em] text-white/45 uppercase pb-2 border-b border-white/8 mb-1.5">
              Specifications
            </h3>
            <SpecRow label="Die area" value={comp.area} />
            <SpecRow label="Clock frequency" value={comp.clockSpeed} />
            <SpecRow label="Lithography" value={comp.process} />
            <SpecRow label="Power profile" value={comp.powerFocus} />
          </div>

          {/* What textbooks omit */}
          <div className="rounded-xl border border-white/8 bg-[#0e1118]/80 p-4">
            <h3 className="text-[10px] font-mono tracking-[0.1em] text-white/45 uppercase mb-2">
              What textbooks omit
            </h3>
            <p className="text-[12px] leading-[1.65] text-white/60">
              {comp.textbookOmission}
            </p>
          </div>

          {/* Learning path */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[10px] font-mono tracking-[0.1em] text-white/45 uppercase">
              Learning path
            </h3>

            {/* Step 1 — basics */}
            {basicArticle ? (
              <button
                onClick={() => handleRead(basicArticle.id)}
                onMouseEnter={() => setHoveredStep(1)}
                onMouseLeave={() => setHoveredStep(null)}
                className="group rounded-xl border p-4 cursor-pointer flex flex-col gap-2.5 text-left transition-all duration-300"
                style={{
                  borderColor: hoveredStep === 1 ? `${accent}50` : "rgba(255,255,255,0.08)",
                  background: hoveredStep === 1 ? `${accent}0a` : "#0e1118",
                  transform: hoveredStep === 1 ? "translate3d(0, -1px, 0)" : "translate3d(0, 0, 0)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-mono font-medium" style={{ color: accent }}>
                    Step 1 · Fundamentals
                  </span>
                  <span className="text-[9.5px] font-mono text-white/35">
                    {basicArticle.readTime}
                  </span>
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-white/90 leading-tight">
                    {basicArticle.title}
                  </h4>
                  <p className="text-[11.5px] leading-relaxed text-white/50 mt-1">
                    {basicArticle.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1 pt-2 border-t border-white/5">
                  <div className="w-5.5 h-5.5 rounded-full bg-white/8 border border-white/12 flex items-center justify-center text-[9px] font-medium text-white/70">
                    {basicArticle.author[0]}
                  </div>
                  <span className="text-[11px] text-white/45">{basicArticle.author}</span>
                  <span className="text-[11px] text-white/35 ml-auto group-hover:text-white/70 group-hover:translate-x-0.5 transition-all duration-200">
                    Read &rarr;
                  </span>
                </div>
              </button>
            ) : null}

            {/* Step 2 — advanced track */}
            {advancedArticle ? (
              <button
                onClick={() => handleRead(advancedArticle.id)}
                onMouseEnter={() => setHoveredStep(2)}
                onMouseLeave={() => setHoveredStep(null)}
                className="group rounded-xl border p-4 cursor-pointer flex flex-col gap-2.5 text-left transition-all duration-300"
                style={{
                  borderColor: hoveredStep === 2 ? `${accent}50` : "rgba(255,255,255,0.08)",
                  background: hoveredStep === 2 ? `${accent}0a` : "#0e1118",
                  transform: hoveredStep === 2 ? "translate3d(0, -1px, 0)" : "translate3d(0, 0, 0)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-mono font-medium text-white/55">
                    Step 2 · {comp.advancedTrackName}
                  </span>
                  <span className="text-[9.5px] font-mono text-white/35">
                    {advancedArticle.readTime}
                  </span>
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-white/90 leading-tight">
                    {advancedArticle.title}
                  </h4>
                  <p className="text-[11.5px] leading-relaxed text-white/50 mt-1">
                    {advancedArticle.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1 pt-2 border-t border-white/5">
                  <div className="w-5.5 h-5.5 rounded-full bg-white/8 border border-white/12 flex items-center justify-center text-[9px] font-medium text-white/70">
                    {advancedArticle.author[0]}
                  </div>
                  <span className="text-[11px] text-white/45">{advancedArticle.author}</span>
                  <span className="text-[11px] text-white/35 ml-auto group-hover:text-white/70 group-hover:translate-x-0.5 transition-all duration-200">
                    Read &rarr;
                  </span>
                </div>
              </button>
            ) : (
              <div className="rounded-xl border border-dashed border-white/12 bg-[#0e1118]/30 p-4 text-center flex flex-col items-center justify-center gap-1 h-[80px] select-none">
                <span className="text-[9.5px] font-mono text-white/45">
                  Step 2 · {comp.advancedTrackName}
                </span>
                <span className="text-[12px] font-medium text-white/60">In progress</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

