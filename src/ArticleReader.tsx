import { useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
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
          className="font-mono text-[0.85em] text-[#aec3ff] bg-[#8aa9ff]/10 border border-[#8aa9ff]/15 rounded px-1.5 py-0.5 whitespace-nowrap"
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

function Segment({ seg, dropCap = false }: { seg: ArticleSegment; dropCap?: boolean }) {
  switch (seg.kind) {
    case "p":
      return (
        <p className={`article-serif text-[17px] leading-[1.85] text-white/70 mb-7 ${dropCap ? "drop-cap" : ""}`}>
          {renderInline(seg.text)}
        </p>
      );

    case "h2":
      return (
        <h2 className="article-serif text-[26px] font-semibold tracking-[-0.01em] text-white/95 mt-14 mb-6">
          {seg.text}
        </h2>
      );

    case "defs":
      return (
        <div className="grid sm:grid-cols-2 gap-4 my-8">
          {seg.items.map((item) => (
            <div
              key={item.term}
              className="rounded-xl border border-white/8 bg-white/[0.02] p-5"
            >
              <div className="text-[11px] font-medium tracking-[0.08em] text-[#8aa9ff] uppercase mb-2.5">
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
            <figcaption className="text-[11px] font-medium text-white/40 mb-2">
              {seg.caption}
            </figcaption>
          )}
          <pre className="rounded-xl border border-white/8 bg-[#0e1118] px-5 py-4 overflow-x-auto scrollbar-thin">
            {seg.lines.map((line, i) => (
              <code key={i} className="block font-mono text-[13.5px] leading-[1.8] text-[#cdd9f2]">
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
              <span className="w-1 h-1 rounded-full bg-white/40 shrink-0 translate-y-[-3px]" />
              <span className="article-serif text-[16px] leading-[1.75] text-white/65">
                {renderInline(item)}
              </span>
            </li>
          ))}
        </ul>
      );

    case "challenge":
      return (
        <aside className="relative my-10 rounded-xl border border-white/8 border-l-2 border-l-[#8aa9ff]/70 bg-white/[0.025] p-7">
          <div className="relative flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-[#8aa9ff]/12 font-mono text-[12px] text-[#8aa9ff]">
              {seg.n}
            </span>
            <span className="text-[11px] font-medium tracking-[0.1em] text-[#8aa9ff] uppercase">
              Whiteboard challenge
            </span>
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

// Escape handling lives in AppUI so stacked overlays close top-down.
export function ArticleReader({ article, onClose }: { article: Article; onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  return (
    <motion.div
      className="fixed inset-0 z-[60] bg-[#0b0d12]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.35, ease: "easeOut" } }}
      exit={{ opacity: 0, transition: { duration: 0.25, ease: "easeIn" } }}
    >
      {/* Reading progress */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-10 bg-white/[0.06]">
        <div
          className="h-full bg-[#8aa9ff]"
          style={{ width: `${progress * 100}%`, transition: "width 80ms linear" }}
        />
      </div>

      {/* Top chrome */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 sm:px-10 h-16 bg-gradient-to-b from-[#0b0d12] via-[#0b0d12]/85 to-transparent pointer-events-none">
        <div className="text-[13px] font-semibold tracking-[-0.01em] text-white/50">
          Bits&apos;nBrews
        </div>
        <button
          onClick={onClose}
          className="pointer-events-auto group flex items-center gap-2 text-[12px] font-medium text-white/55 hover:text-white/90 border border-white/12 hover:border-white/25 rounded-lg px-4 py-2 transition-colors duration-200 cursor-pointer bg-[#12151d]"
        >
          <span className="inline-block transition-transform duration-200 group-hover:-translate-x-0.5">
            ←
          </span>
          <span>Back to the die</span>
          <kbd className="text-[10px] text-white/30 font-mono">esc</kbd>
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
        <motion.article
          className="max-w-[700px] mx-auto px-6 sm:px-8 pt-28 pb-32"
          initial={{ opacity: 0, y: 24 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 280, damping: 28, delay: 0.08 },
          }}
        >
          {/* Header */}
          <header className="mb-14">
            <div className="flex items-center gap-3 mb-7">
              <span className="h-px w-8 bg-[#8aa9ff]/60" aria-hidden />
              <span className="font-mono text-[10.5px] tracking-[0.1em] text-[#8aa9ff] uppercase">
                {article.track} · No. {article.trackNo}
              </span>
            </div>
            <h1
              className="article-serif font-bold leading-[1.12] tracking-[-0.02em] text-white/95 mb-5"
              style={{ fontSize: "clamp(36px, 4.5vw, 50px)" }}
            >
              {article.title}
            </h1>
            <p className="article-serif italic text-[19px] leading-[1.5] text-white/50 mb-8">
              {article.subtitle}
            </p>
            <div className="flex items-center gap-4 pt-6 border-t border-white/8">
              <div className="w-9 h-9 rounded-full bg-white/8 border border-white/15 flex items-center justify-center font-medium text-[13px] text-white/80">
                {article.author[0]}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[12.5px] font-medium text-white/85">{article.author}</span>
                <span className="font-mono text-[10.5px] tracking-[0.06em] uppercase text-white/40">
                  {article.date} · {article.readTime}
                </span>
              </div>
            </div>
          </header>

          {/* Body — opening paragraph gets the editorial drop cap */}
          {(() => {
            const firstP = article.segments.findIndex((s) => s.kind === "p");
            return article.segments.map((seg, i) => (
              <Segment key={i} seg={seg} dropCap={i === firstP} />
            ));
          })()}

          {/* End mark + footer */}
          <footer className="mt-16">
            <div className="flex items-center gap-3 justify-center mb-12">
              <span className="w-10 h-px bg-white/12" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <span className="w-10 h-px bg-white/12" />
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-7 text-center">
              <div className="text-[11px] font-medium tracking-[0.08em] text-[#8aa9ff] uppercase mb-3">
                {article.track}
              </div>
              <p className="text-[13.5px] leading-[1.7] text-white/55 max-w-md mx-auto mb-6">
                More pieces in this track are on the way. Subscribe from the Hub to get
                them as they publish.
              </p>
              <button
                onClick={onClose}
                className="text-[12px] font-medium text-white/70 hover:text-white border border-white/15 hover:border-white/35 px-6 py-2.5 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                ← Back to the die
              </button>
            </div>
          </footer>
        </motion.article>
      </div>
    </motion.div>
  );
}
