"use client";

import { useEffect, useState } from "react";

// Thin top progress bar tracking window scroll. Client-only; the article body
// itself stays server-rendered.
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? el.scrollTop / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-white/[0.06]">
      <div
        className="h-full bg-[#8aa9ff]"
        style={{ width: `${progress * 100}%`, transition: "width 80ms linear" }}
      />
    </div>
  );
}
