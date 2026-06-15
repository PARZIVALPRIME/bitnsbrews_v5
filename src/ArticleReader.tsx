import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Article, ArticleSegment } from "./articles";
import { SiteFooter } from "./components/SiteFooter";

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

function Segment({ seg }: { seg: ArticleSegment }) {
  switch (seg.kind) {
    case "p":
      return (
        <p className="article-serif text-[17px] leading-[1.85] text-white/70 mb-7">
          {renderInline(seg.text)}
        </p>
      );

    case "h2": {
      const id = seg.text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      return (
        <h2
          id={id}
          className="article-serif text-[26px] font-semibold tracking-[-0.01em] text-white/95 mt-14 mb-6 scroll-mt-24"
        >
          {seg.text}
        </h2>
      );
    }

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

import { ARTICLES } from "./articles";

export function ArticleReader({ article, onClose, onNavigate }: { article: Article; onClose: () => void; onNavigate?: (id: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [entered, setEntered] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [resumeTop, setResumeTop] = useState<number | null>(null);

  // Find the next article in the same track
  const currentIdx = ARTICLES.findIndex(a => a.id === article.id);
  const nextArticle = currentIdx >= 0 ? ARTICLES.find((a, i) => i > currentIdx && a.track === article.track) : undefined;

  const headings = article.segments
    .filter((seg) => seg.kind === "h2")
    .map((seg) => ({
      text: seg.text,
      id: seg.text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    }));

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

  // Load bookmark on mount
  useEffect(() => {
    const saved = localStorage.getItem(`bnb-progress-${article.id}`);
    if (saved && Number(saved) > 300) {
      setResumeTop(Number(saved));
    }
  }, [article.id]);

  // Periodically save progress to localStorage
  useEffect(() => {
    const handle = setInterval(() => {
      if (scrollRef.current && scrollRef.current.scrollTop > 100) {
        localStorage.setItem(`bnb-progress-${article.id}`, scrollRef.current.scrollTop.toString());
      }
    }, 1500);
    return () => clearInterval(handle);
  }, [article.id]);

  // Scrollspy observer using IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return;

    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((e) => e.isIntersecting);
          if (visible.length > 0) {
            setActiveId(visible[0].target.id);
          }
        },
        {
          root: scrollRef.current,
          rootMargin: "-90px 0px -75% 0px",
          threshold: 0,
        }
      );

      headings.forEach((h) => {
        const el = document.getElementById(h.id);
        if (el) observer.observe(el);
      });

      return () => {
        headings.forEach((h) => {
          const el = document.getElementById(h.id);
          if (el) observer.unobserve(el);
        });
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [headings, entered]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-[#0b0d12]"
      style={{
        opacity: entered ? 1 : 0,
        transition: "opacity 400ms ease",
      }}
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

      {/* Resume Reading Button */}
      {resumeTop && (
        <button
          onClick={() => {
            scrollRef.current?.scrollTo({ top: resumeTop, behavior: 'smooth' });
            setResumeTop(null);
          }}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-[#8aa9ff]/15 text-[#8aa9ff] border border-[#8aa9ff]/30 text-sm hover:bg-[#8aa9ff]/25 transition-colors shadow-lg backdrop-blur-md"
        >
          Resume Reading ↓
        </button>
      )}

      {/* Scrollable article */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto scrollbar-thin overscroll-contain"
        onScroll={(e) => {
          const el = e.currentTarget;
          const max = el.scrollHeight - el.clientHeight;
          setProgress(max > 0 ? el.scrollTop / max : 0);
          if (el.scrollTop < 150) {
            setActiveId("");
          }
        }}
      >
        <div
          className="max-w-[1020px] mx-auto px-6 sm:px-8 pt-28 pb-32 flex gap-12 items-start justify-center relative"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 600ms ease 100ms, transform 600ms ease 100ms",
          }}
        >
          {/* Table of contents sidebar */}
          <aside className="sticky top-28 w-[180px] shrink-0 xl:block hidden text-left font-sans select-none self-start">
            <h4 className="text-[10px] font-mono tracking-[0.12em] uppercase text-white/35 mb-4">
              Contents
            </h4>
            <ul className="flex flex-col gap-3.5 border-l border-white/5 pl-0">
              {headings.map((h) => {
                const isActive = h.id === activeId;
                return (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(h.id);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }}
                      className={`block text-[12.5px] leading-[1.4] transition-all duration-300 pl-4 border-l -ml-[1px] ${
                        isActive
                          ? "text-[#8aa9ff] font-medium border-[#8aa9ff]"
                          : "text-white/45 hover:text-white/80 border-transparent hover:border-white/15"
                      }`}
                      style={{
                        textShadow: isActive ? "0 0 12px rgba(138, 169, 255, 0.25)" : "none",
                      }}
                    >
                      {h.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </aside>

          <article className="max-w-[700px] flex-grow">
            {/* Header */}
            <header className="mb-14">
              <div className="flex items-center gap-3 mb-7">
                <span className="text-[11px] font-medium tracking-[0.08em] text-[#8aa9ff] uppercase">
                  {article.track} · No. {article.trackNo}
                </span>
              </div>
              <h1 className="article-serif text-[38px] sm:text-[46px] font-bold leading-[1.12] tracking-[-0.02em] text-white/95 mb-5">
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
                  <span className="text-[11.5px] text-white/40">
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
                <span className="w-10 h-px bg-white/12" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                <span className="w-10 h-px bg-white/12" />
              </div>
              
              {nextArticle && onNavigate ? (
                <div className="flex flex-col items-center mb-10">
                  <span className="text-[12px] font-medium tracking-widest text-[#8aa9ff] uppercase mb-4">
                    Up Next in {article.track}
                  </span>
                  <button
                    onClick={() => {
                      scrollRef.current?.scrollTo({ top: 0 });
                      onNavigate(nextArticle.id);
                    }}
                    className="group w-full text-left panel p-6 sm:p-8 rounded-2xl hover:border-[#8aa9ff]/40 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#8aa9ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <h3 className="relative z-10 text-[20px] font-semibold text-white/95 group-hover:text-white transition-colors mb-2">
                      {nextArticle.title}
                    </h3>
                    <p className="relative z-10 text-[14px] text-white/60 mb-5">
                      {nextArticle.subtitle}
                    </p>
                    <div className="relative z-10 flex items-center text-[13px] text-[#8aa9ff] font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                      Continue Reading &rarr;
                    </div>
                  </button>
                </div>
              ) : (
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
              )}
            </footer>
          </article>
        </div>
        
        {/* Shared site footer at the bottom of the scroll container */}
        <SiteFooter />
      </div>
    </div>
  );
}
