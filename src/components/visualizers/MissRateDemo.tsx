"use client";

import { useState } from "react";

// Example interactive visualizer — proves that client-interactive components
// render inside server-rendered MDX. It illustrates the article's core idea:
// a level's *local* miss rate is misses/accesses at that level, while the
// *global* miss rate is the product down the hierarchy (fraction of ALL CPU
// references that miss every level). Numbers here are illustrative, not measured.
export function MissRateDemo() {
  const [l1KB, setL1KB] = useState(32);
  const l2LocalMiss = 35; // held fixed in this toy model (%)

  // Bigger L1 → fewer L1 misses (smooth decay toward a floor).
  const l1LocalMiss = Math.max(3, Math.round(70 * Math.exp(-l1KB / 40)));
  const globalMiss = +((l1LocalMiss / 100) * (l2LocalMiss / 100) * 100).toFixed(1);

  const Bar = ({ label, value }: { label: string; value: number }) => (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-medium tracking-[0.06em] text-white/55 uppercase">
          {label}
        </span>
        <span className="font-mono text-[13px] text-[#aec3ff]">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#5b7cfa] transition-[width] duration-200"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="my-10 rounded-2xl border border-white/8 bg-white/[0.02] p-6 sm:p-7">
      <div className="text-[11px] font-medium tracking-[0.1em] text-[#8aa9ff] uppercase mb-5">
        Interactive · L1 cache size vs miss rates
      </div>

      <label className="block mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[13px] text-white/70">L1 data cache size</span>
          <span className="font-mono text-[13px] text-white/85">{l1KB} KB</span>
        </div>
        <input
          type="range"
          min={8}
          max={128}
          step={4}
          value={l1KB}
          onChange={(e) => setL1KB(Number(e.target.value))}
          className="soc-slider w-full"
        />
      </label>

      <div className="flex flex-col gap-4">
        <Bar label="L1 local miss rate" value={l1LocalMiss} />
        <Bar label="L2 local miss rate (fixed)" value={l2LocalMiss} />
        <div className="h-px bg-white/8 my-1" />
        <Bar label="Global miss rate (L1 × L2)" value={globalMiss} />
      </div>

      <p className="mt-5 text-[13px] leading-[1.7] text-white/50">
        Growing L1 slashes its <em className="italic text-white/70">local</em> miss rate, but
        the <em className="italic text-white/70">global</em> miss rate — what actually reaches
        main memory — is the product down the hierarchy. That is why a single level&apos;s miss
        rate can mislead you.
      </p>
    </div>
  );
}
