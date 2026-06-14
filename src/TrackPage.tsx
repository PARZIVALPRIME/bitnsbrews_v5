import { useEffect, useState, useMemo } from "react";
import { TRACKS, type Track } from "./trackArticles";
import { ARTICLES, type Article } from "./articles";
import { Footer } from "./components/Footer";
import { TrackIcon } from "./components/TrackIcon";

// Helper to filter and sort articles by date in chronological order (oldest first)
function getArticlesForTrack(track: Track): Article[] {
  // Find associated components or track names
  // Matches when the article track name matches the track name or component name that maps to it
  return ARTICLES.filter((article) => {
    if (article.track.toLowerCase() === track.name.toLowerCase()) return true;
    
    // Fallbacks for basic articles which have the component name as track
    if (track.id === "code-to-core" && article.track === "CPU Performance Core") return true;
    if (track.id === "the-tradeoff" && article.track === "CPU Efficiency Core") return true;
    if (track.id === "die-chronicles" && article.track === "Graphics Processor") return true;
    if (track.id === "paper-lab" && article.track === "Neural Accelerator") return true;
    if (track.id === "chip-lore" && article.track === "5G Baseband Modem") return true;
    if (track.id === "post-mortem" && article.track === "Image Signal Processor") return true;
    if (track.id === "rtl-to-silicon" && article.track === "Digital Signal Processor") return true;
    if (track.id === "the-hard-question" && article.track === "System Level Cache") return true;
    if (track.id === "silicon-explained" && article.track === "Memory Controller") return true;

    return false;
  }).sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

interface TrackPageProps {
  trackId: string;
  onClose: () => void;
  onReadArticle: (articleId: string) => void;
}

export function TrackPage({ trackId, onClose, onReadArticle }: TrackPageProps) {
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const track = TRACKS.find((t) => t.id === trackId);

  const handleClose = () => {
    setClosing(true);
    setEntered(false);
    setTimeout(() => {
      onClose();
    }, 450); // Matches transition duration
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!track) return null;

  const trackArticles = useMemo(() => getArticlesForTrack(track), [track]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0b0d12] overflow-y-auto scrollbar-thin select-none flex flex-col"
      style={{
        opacity: entered && !closing ? 1 : 0,
        transition: "opacity 400ms ease",
      }}
    >
      {/* Top Navigation Chrome */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 sm:px-10 h-16 bg-gradient-to-b from-[#0b0d12] via-[#0b0d12]/85 to-transparent pointer-events-none">
        <div className="text-[13px] font-semibold tracking-[-0.01em] text-white/50">
          Bits&apos;nBrews
        </div>
        <button
          onClick={handleClose}
          className="pointer-events-auto group flex items-center gap-2 text-[12px] font-medium text-white/55 hover:text-white/90 border border-white/12 hover:border-white/25 rounded-lg px-4 py-2 transition-colors duration-200 cursor-pointer bg-[#12151d]"
        >
          <span className="inline-block transition-transform duration-200 group-hover:-translate-x-0.5">
            ←
          </span>
          <span>Close Track</span>
          <kbd className="text-[10px] text-white/30 font-mono">esc</kbd>
        </button>
      </div>

      {/* Main Container */}
      <div
        className="max-w-[760px] mx-auto px-6 sm:px-8 pt-28 pb-32 flex-grow w-full flex flex-col gap-12 text-left"
        style={{
          opacity: entered && !closing ? 1 : 0,
          transform: entered && !closing ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 600ms ease 100ms, transform 600ms ease 100ms",
        }}
      >
        {/* Track Header */}
        <header className="border-b border-white/8 pb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#8aa9ff]">
              <TrackIcon id={track.id} className="w-8.5 h-8.5" color="#8aa9ff" />
            </span>
            <span className="text-[11px] font-mono tracking-[0.12em] text-[#8aa9ff] uppercase font-bold">
              Active Track
            </span>
          </div>
          <h1 className="article-serif text-[36px] sm:text-[44px] font-bold leading-[1.15] tracking-tight text-white/95 mb-4">
            {track.name}
          </h1>
          <p className="text-[14px] leading-[1.7] text-white/60 font-sans max-w-2xl">
            {track.longSummary}
          </p>
        </header>

        {/* Articles List Section */}
        <section className="flex flex-col gap-6">
          <h2 className="text-[11px] font-mono tracking-[0.12em] uppercase text-white/45 mb-2">
            Articles in this Series ({trackArticles.length})
          </h2>

          {trackArticles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/8 bg-white/[0.01] p-10 text-center">
              <p className="text-[13px] text-white/40 mb-1">
                More pieces in this track are currently in production.
              </p>
              <p className="text-[12px] text-white/30">
                Subscribe to the newsletter below to get notified of new releases.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {trackArticles.map((article, index) => {
                const stepNo = String(index + 1).padStart(2, "0");
                return (
                  <div
                    key={article.id}
                    onClick={() => onReadArticle(article.id)}
                    className="panel hover:border-white/16 hover:bg-white/[0.03] transition-all duration-200 p-6 rounded-xl flex gap-6 group cursor-pointer"
                  >
                    <div className="text-[14px] font-mono text-[#8aa9ff] leading-[1.5] shrink-0 w-8">
                      {stepNo}
                    </div>
                    <div className="flex flex-col flex-grow text-left">
                      <h3 className="text-[16px] font-semibold text-white/90 group-hover:text-[#aec3ff] transition-colors leading-snug">
                        {article.title}
                      </h3>
                      <p className="text-[12.5px] italic text-white/50 mt-1 leading-snug">
                        {article.subtitle}
                      </p>
                      <div className="flex items-center gap-3 mt-4 text-[11px] text-white/35">
                        <span>{article.author}</span>
                        <span>•</span>
                        <span>{article.date}</span>
                        <span>•</span>
                        <span>{article.readTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center shrink-0 self-center">
                      <div className="w-8 h-8 rounded-full border border-white/8 group-hover:border-white/20 flex items-center justify-center text-white/40 group-hover:text-white/80 transition-colors bg-white/[0.01]">
                        →
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
