"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/articles", label: "Articles" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

// Shared top nav for content pages (not the immersive landing). Highlights the
// active route.
export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-gradient-to-b from-[#0b0d12] via-[#0b0d12]/85 to-transparent">
      <nav className="max-w-[1020px] mx-auto h-full px-6 sm:px-8 flex items-center justify-between">
        <Link
          href="/"
          className="text-[13px] font-semibold tracking-[0.04em] text-white/90 hover:text-white transition-colors"
        >
          Bits&apos;nBrews
        </Link>
        <div className="flex items-center gap-5 sm:gap-7">
          {LINKS.slice(1).map((l) => {
            const active =
              l.href === "/articles"
                ? pathname.startsWith("/articles") || pathname.startsWith("/tracks")
                : pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-[12px] font-medium tracking-wide transition-colors ${
                  active ? "text-[#8aa9ff]" : "text-white/55 hover:text-white/90"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
