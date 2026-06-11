import { useEffect, useState, type ReactNode } from "react";
import { getComponent, getArticle } from "./articles";
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
  const accent = ACCENTS[comp.id] ?? "#8aa9ff";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0d12]/85 backdrop-blur-sm transition-opacity duration-300 p-4 sm:p-8"
      style={{ opacity: entered ? 1 : 0 }}
      onClick={onClose}
    >
      {/* Main panel */}
      <div
        className="relative w-full max-w-[960px] max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#12151d] p-6 sm:p-10 shadow-[0_2px_6px_rgba(0,0,0,0.4),0_24px_64px_rgba(0,0,0,0.5)] flex flex-col gap-8 scrollbar-thin transition-transform duration-400 ease-out"
        style={{ transform: entered ? "scale(1) translateY(0)" : "scale(0.97) translateY(8px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/8 pb-6">
          <div className="flex items-center gap-4">
            <span
              className="flex items-center justify-center w-14 h-14 rounded-xl border shrink-0"
              style={{ borderColor: `${accent}40`, background: `${accent}14` }}
            >
              <ComponentIcon id={comp.id} color={accent} />
            </span>
            <div className="text-left">
              <span className="text-[11px] font-medium tracking-[0.1em] uppercase" style={{ color: accent }}>
                {comp.tag}
              </span>
              <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-white mt-1">
                {comp.name}
              </h1>
              <p className="text-[13px] text-white/55 mt-1 max-w-[560px] leading-relaxed">
                {comp.shortDesc}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close (Esc)"
            className="flex items-center gap-2 text-[12px] text-white/50 hover:text-white/90 border border-white/12 hover:border-white/25 rounded-lg px-3.5 py-2 transition-colors duration-200 cursor-pointer shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            <span>Close</span>
            <kbd className="text-[10px] text-white/30 font-mono">esc</kbd>
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">

          {/* Left column — specs + textbook gap */}
          <div className="md:col-span-5 flex flex-col gap-5">
            <div className="rounded-xl border border-white/8 bg-[#0e1118] p-5">
              <h3 className="text-[11px] font-medium tracking-[0.1em] text-white/45 uppercase pb-3 border-b border-white/8 mb-1">
                Specifications
              </h3>
              <SpecRow label="Die area" value={comp.area} />
              <SpecRow label="Clock frequency" value={comp.clockSpeed} />
              <SpecRow label="Lithography" value={comp.process} />
              <SpecRow label="Power profile" value={comp.powerFocus} />
            </div>

            <div className="rounded-xl border border-white/8 bg-[#0e1118] p-5">
              <h3 className="text-[11px] font-medium tracking-[0.1em] text-white/45 uppercase mb-3">
                What textbooks omit
              </h3>
              <p className="text-[13px] leading-[1.7] text-white/65">
                {comp.textbookOmission}
              </p>
            </div>
          </div>

          {/* Right column — learning path */}
          <div className="md:col-span-7 flex flex-col gap-4">
            <h3 className="text-[11px] font-medium tracking-[0.1em] text-white/45 uppercase">
              Learning path
            </h3>

            {/* Step 1 — basics */}
            {basicArticle ? (
              <button
                onClick={() => onReadArticle(basicArticle.id)}
                className="group rounded-xl border border-white/8 bg-[#0e1118] hover:border-white/20 hover:bg-[#11141d] p-5 cursor-pointer flex flex-col gap-3 text-left transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium" style={{ color: accent }}>
                    Step 1 · Fundamentals
                  </span>
                  <span className="text-[11px] font-mono text-white/35">
                    {basicArticle.readTime}
                  </span>
                </div>
                <div>
                  <h4 className="text-[15.5px] font-semibold text-white/90 leading-snug">
                    {basicArticle.title}
                  </h4>
                  <p className="text-[12.5px] leading-relaxed text-white/55 mt-1.5">
                    {basicArticle.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 mt-1">
                  <div className="w-6 h-6 rounded-full bg-white/8 border border-white/12 flex items-center justify-center text-[10px] font-medium text-white/70">
                    {basicArticle.author[0]}
                  </div>
                  <span className="text-[12px] text-white/50">{basicArticle.author}</span>
                  <span className="text-[12px] text-white/35 ml-auto group-hover:text-white/70 group-hover:translate-x-0.5 transition-all duration-200">
                    Read &rarr;
                  </span>
                </div>
              </button>
            ) : null}

            {/* Step 2 — advanced track */}
            {advancedArticle ? (
              <button
                onClick={() => onReadArticle(advancedArticle.id)}
                className="group rounded-xl border border-white/8 bg-[#0e1118] hover:border-white/20 hover:bg-[#11141d] p-5 cursor-pointer flex flex-col gap-3 text-left transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-white/55">
                    Step 2 · {comp.advancedTrackName}
                  </span>
                  <span className="text-[11px] font-mono text-white/35">
                    {advancedArticle.readTime}
                  </span>
                </div>
                <div>
                  <h4 className="text-[15.5px] font-semibold text-white/90 leading-snug">
                    {advancedArticle.title}
                  </h4>
                  <p className="text-[12.5px] leading-relaxed text-white/55 mt-1.5">
                    {advancedArticle.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 mt-1">
                  <div className="w-6 h-6 rounded-full bg-white/8 border border-white/12 flex items-center justify-center text-[10px] font-medium text-white/70">
                    {advancedArticle.author[0]}
                  </div>
                  <span className="text-[12px] text-white/50">{advancedArticle.author}</span>
                  <span className="text-[12px] text-white/35 ml-auto group-hover:text-white/70 group-hover:translate-x-0.5 transition-all duration-200">
                    Read &rarr;
                  </span>
                </div>
              </button>
            ) : (
              <div className="rounded-xl border border-dashed border-white/12 p-5 text-center flex flex-col items-center justify-center gap-1.5 h-[120px] select-none">
                <span className="text-[11px] font-medium text-white/45">
                  Step 2 · {comp.advancedTrackName}
                </span>
                <span className="text-[13px] font-medium text-white/65">In progress</span>
                <span className="text-[11.5px] text-white/40">This deep dive is being written — subscribe for updates.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
