import { useState, useEffect, useRef } from "react";
import { ARTICLES } from "../articles";
import { TRACKS } from "../trackArticles";

export function SearchPalette({
  isOpen,
  onClose,
  onSelectArticle,
  onSelectTrack,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (id: string) => void;
  onSelectTrack: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      // Focus after render
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const lowerQuery = query.toLowerCase();

  const matchedArticles = ARTICLES.filter(
    (a) => a.title.toLowerCase().includes(lowerQuery) || a.track.toLowerCase().includes(lowerQuery)
  );
  const matchedTracks = TRACKS.filter(
    (t) => t.name.toLowerCase().includes(lowerQuery) || t.desc.toLowerCase().includes(lowerQuery)
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-md bg-black/40">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        <div className="flex items-center px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <svg
            className="w-5 h-5 text-[#8aa9ff]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-white px-4 text-[17px] placeholder-white/30"
            placeholder="Search articles and tracks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:inline-block border border-white/20 rounded-md px-2 py-0.5 text-[11px] font-mono text-white/40">
            ESC
          </kbd>
        </div>

        <div className="overflow-y-auto scrollbar-thin p-3">
          {query.trim() === "" ? (
            <div className="p-8 text-center text-white/40 text-[14px]">
              Type to search the global library...
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {matchedArticles.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[11px] font-bold tracking-widest text-white/30 uppercase">
                    Articles
                  </div>
                  {matchedArticles.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        onSelectArticle(a.id);
                        onClose();
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                      <h4 className="text-[15px] font-medium text-white/90 group-hover:text-[#8aa9ff] transition-colors mb-0.5">
                        {a.title}
                      </h4>
                      <p className="text-[12px] text-white/50">{a.track}</p>
                    </button>
                  ))}
                </div>
              )}

              {matchedTracks.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[11px] font-bold tracking-widest text-white/30 uppercase">
                    Tracks
                  </div>
                  {matchedTracks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelectTrack(t.id);
                        onClose();
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group flex items-center gap-4"
                    >
                      <span className="text-xl">{t.icon}</span>
                      <div>
                        <h4 className="text-[15px] font-medium text-white/90 group-hover:text-[#8aa9ff] transition-colors mb-0.5">
                          {t.name}
                        </h4>
                        <p className="text-[12px] text-white/50">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {matchedArticles.length === 0 && matchedTracks.length === 0 && (
                <div className="p-8 text-center text-white/40 text-[14px]">
                  No results found for "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
