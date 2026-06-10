import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Article, ArticleSegment } from "./articles";

// ── Tiny inline formatter: **bold**, *italic*, `code` ───────────────────────
function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  // Split on **bold**, *italic*, `code` while keeping delimiters
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  tokens.forEach((tok, i) => {
    if (tok.startsWith("**") && tok.endsWith("**")) {
      out.push(
        <strong key={i} className="font-semibold text-white/95">
          {tok.slice(2, -2)}
        </strong>
      );
    } else if (tok.startsWith("`") && tok.endsWith("`")) {
      out.push(
        <code
          key={i}
          className="font-mono text-[0.85em] text-[#f0c478] bg-[#e8a23a]/8 border border-[#e8a23a]/15 rounded px-1.5 py-0.5 whitespace-nowrap"
        >
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith("*") && tok.endsWith("*") && tok.length > 2) {
      out.push(
        <em key={i} className="italic text-white/80">
          {tok.slice(1, -1)}
        </em>
      );
    } else if (tok) {
      out.push(tok);
    }
  });
  return out;
}

function Segment({ seg }: { seg: ArticleSegment }) {
  switch (seg.kind) {
    case "p":
      return (
        <p className="article-serif text-[17px] leading-[1.85] text-white/70 mb-7">
          {renderInline(seg.text)}
        </p>
      );

    case "h2":
      return (
        <h2 className="article-serif text-[26px] font-semibold tracking-[-0.01em] text-white/95 mt-14 mb-6 flex items-baseline gap-4">
          <span className="w-6 h-px bg-[#e8a23a]/60 shrink-0 translate-y-[-6px]" />
          {seg.text}
        </h2>
      );

    case "defs":
      return (
        <div className="grid sm:grid-cols-2 gap-4 my-8">
          {seg.items.map((item) => (
            <div
              key={item.term}
              className="rounded-xl border border-white/8 bg-white/[0.02] p-5 hover:border-[#e8a23a]/25 transition-colors duration-300"
            >
              <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#e8a23a] uppercase mb-2.5">
                {item.term}
              </div>
              <p className="article-serif text-[14.5px] leading-[1.7] text-white/65">
                {item.def}
              </p>
            </div>
          ))}
        </div>
      );

    case "code":
      return (
        <figure className="my-8">
          {seg.caption && (
            <figcaption className="text-[9px] font-mono font-bold tracking-[0.25em] text-white/35 uppercase mb-2">
              {seg.caption}
            </figcaption>
          )}
          <pre className="rounded-xl border border-white/8 border-l-2 border-l-[#e8a23a]/60 bg-[#0a0c12] px-5 py-4 overflow-x-auto scrollbar-thin">
            {seg.lines.map((line, i) => (
              <code key={i} className="block font-mono text-[13.5px] leading-[1.8] text-[#f0c478]">
                {line}
              </code>
            ))}
          </pre>
        </figure>
      );

    case "list":
      return (
        <ul className="my-7 flex flex-col gap-3">
          {seg.items.map((item, i) => (
            <li key={i} className="flex gap-4 items-baseline">
              <span className="w-1 h-1 rounded-full bg-[#e8a23a]/70 shrink-0 translate-y-[-3px]" />
              <span className="article-serif text-[16px] leading-[1.75] text-white/65">
                {renderInline(item)}
              </span>
            </li>
          ))}
        </ul>
      );

    case "challenge":
      return (
        <aside className="relative my-10 rounded-2xl border border-[#e8a23a]/20 bg-gradient-to-br from-[#e8a23a]/[0.06] to-transparent p-7 overflow-hidden challenge-card">
          {/* faint grid texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(232,162,58,1) 1px, transparent 1px), linear-gradient(90deg, rgba(232,162,58,1) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="relative flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-7 h-7 rounded-md border border-[#e8a23a]/45 bg-[#e8a23a]/10 font-mono font-bold text-[12px] text-[#e8a23a]">
              {seg.n}
            </span>
            <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-[#e8a23a] uppercase">
              Whiteboard Challenge
            </span>
            <span className="flex-1 h-px bg-[#e8a23a]/15" />
          </div>
          {seg.body.map((para, i) => (
            <p
              key={i}
              className="relative article-serif text-[15.5px] leading-[1.8] text-white/72 mb-3 last:mb-0"
            >
              {renderInline(para)}
            </p>
          ))}
        </aside>
      );

    default:
      return null;
  }
}

export function ArticleReader({ article, onClose }: { article: Article; onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [entered, setEntered] = useState(false);

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

  return (
    <div
      className="fixed inset-0 z-[60] bg-[#050609]/98 backdrop-blur-sm"
      style={{
        opacity: entered ? 1 : 0,
        transition: "opacity 400ms ease",
      }}
    >
      {/* Reading progress */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-10 bg-white/[0.05]">
        <div
          className="h-full bg-[#e8a23a] shadow-[0_0_8px_rgba(232,162,58,0.6)]"
          style={{ width: `${progress * 100}%`, transition: "width 80ms linear" }}
        />
      </div>

      {/* Top chrome */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 sm:px-10 h-16 bg-gradient-to-b from-[#050609] via-[#050609]/85 to-transparent pointer-events-none">
        <div className="text-[10px] font-mono font-semibold tracking-[0.35em] text-white/30 uppercase">
          Bits'nBrews
        </div>
        <button
          onClick={onClose}
          className="pointer-events-auto group flex items-center gap-2.5 text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-white/45 hover:text-[#e8a23a] border border-white/10 hover:border-[#e8a23a]/40 rounded-md px-4 py-2 transition-all duration-200 cursor-pointer bg-black/40 backdrop-blur-md"
        >
          <span className="inline-block transition-transform duration-200 group-hover:-translate-x-0.5">
            ←
          </span>
          <span>Back to die</span>
          <span className="text-white/20 group-hover:text-[#e8a23a]/40 normal-case tracking-normal">
            esc
          </span>
        </button>
      </div>

      {/* Scrollable article */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto scrollbar-thin overscroll-contain"
        onScroll={(e) => {
          const el = e.currentTarget;
          const max = el.scrollHeight - el.clientHeight;
          setProgress(max > 0 ? el.scrollTop / max : 0);
        }}
      >
        <article
          className="max-w-[700px] mx-auto px-6 sm:px-8 pt-28 pb-32"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 600ms ease 100ms, transform 600ms ease 100ms",
          }}
        >
          {/* Header */}
          <header className="mb-14">
            <div className="flex items-center gap-3 mb-7">
              <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-[#e8a23a] uppercase bg-[#e8a23a]/8 border border-[#e8a23a]/25 px-3 py-1.5 rounded-sm">
                Track {article.trackNo} — {article.track}
              </span>
            </div>
            <h1 className="article-serif text-[38px] sm:text-[46px] font-bold leading-[1.12] tracking-[-0.02em] text-white/95 mb-5">
              {article.title}
            </h1>
            <p className="article-serif italic text-[19px] leading-[1.5] text-white/50 mb-8">
              {article.subtitle}
            </p>
            <div className="flex items-center gap-4 pt-6 border-t border-white/8">
              <div className="w-9 h-9 rounded-full bg-[#e8a23a]/15 border border-[#e8a23a]/30 flex items-center justify-center font-mono font-bold text-[13px] text-[#e8a23a]">
                {article.author[0]}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-semibold text-white/85">{article.author}</span>
                <span className="text-[10px] font-mono tracking-wider text-white/35">
                  {article.date} · {article.readTime}
                </span>
              </div>
            </div>
          </header>

          {/* Body */}
          {article.segments.map((seg, i) => (
            <Segment key={i} seg={seg} />
          ))}

          {/* End mark + footer */}
          <footer className="mt-16">
            <div className="flex items-center gap-3 justify-center mb-12">
              <span className="w-10 h-px bg-white/10" />
              <span className="w-1.5 h-1.5 rotate-45 bg-[#e8a23a]/60" />
              <span className="w-10 h-px bg-white/10" />
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-7 text-center">
              <div className="text-[9px] font-mono font-bold tracking-[0.3em] text-[#e8a23a] uppercase mb-3">
                Track {article.trackNo} — {article.track}
              </div>
              <p className="article-serif text-[14px] leading-[1.7] text-white/55 max-w-md mx-auto mb-6">
                More pieces in this track are in fabrication. Subscribe from the Hub to get them
                the moment they tape out.
              </p>
              <button
                onClick={onClose}
                className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase text-[#e8a23a]/90 hover:text-white border border-[#e8a23a]/30 hover:border-white/60 px-6 py-2.5 rounded-md transition-all duration-200 cursor-pointer"
              >
                ← Back to the die
              </button>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
