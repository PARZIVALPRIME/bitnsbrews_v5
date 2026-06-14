"use client";

import dynamic from "next/dynamic";

// RootApp mounts the React Three Fiber canvas. WebGL has no meaning on the
// server, so we load the entire experience client-side only (ssr: false).
// This keeps the rest of the site (article pages) free to server-render.
const RootApp = dynamic(() => import("@/RootApp"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 grid place-items-center bg-[#0b0d12]">
      <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
        Loading experience…
      </span>
    </div>
  ),
});

export function ExperienceLoader() {
  return <RootApp />;
}
