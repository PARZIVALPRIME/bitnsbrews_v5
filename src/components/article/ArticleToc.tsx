"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/articles";

// Sticky table of contents with scrollspy. Heading ids are added by rehype-slug
// and match getToc()'s slugs, so anchors line up.
export function ArticleToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState("");

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -75% 0px", threshold: 0 }
    );
    items.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <aside className="sticky top-28 w-[180px] shrink-0 hidden xl:block self-start select-none">
      <h4 className="text-[10px] font-mono tracking-[0.12em] uppercase text-white/35 mb-4">
        Contents
      </h4>
      <ul className="flex flex-col gap-3.5">
        {items.map((h) => {
          const isActive = h.id === active;
          return (
            <li key={h.id} style={{ paddingLeft: h.level === 3 ? 12 : 0 }}>
              <a
                href={`#${h.id}`}
                className={`block text-[12.5px] leading-[1.4] transition-all duration-300 pl-4 border-l -ml-px ${
                  isActive
                    ? "text-[#8aa9ff] font-medium border-[#8aa9ff]"
                    : "text-white/45 hover:text-white/80 border-transparent hover:border-white/15"
                }`}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
