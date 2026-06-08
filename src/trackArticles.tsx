// import React from "react";

export interface Track {
  id: string;
  name: string;
  icon: string;
  desc: string;
  longSummary: string;
}

export const TRACKS: Track[] = [
  {
    id: "silicon-explained",
    name: "Silicon Explained",
    icon: "🔬",
    desc: "Textbook architecture concepts reimagined.",
    longSummary: "Textbook architecture concepts reimagined. The differentiator is not simplification — it's adding the layer the textbook omits: design intent, historical alternatives, geopolitical and industry consequences. A piece on branch prediction connects to why prediction accuracy became a security surface. A piece on cache coherence connects to why distributed manufacturing has the same fundamental constraints. Cultural references and humor are used when they genuinely illuminate — not as decoration."
  },
  {
    id: "die-chronicles",
    name: "Die Chronicles",
    icon: "🖼️",
    desc: "Dieshot analysis one level deeper.",
    longSummary: "Dieshot analysis one level deeper than identifying functional blocks. The question each piece answers: given what the die layout shows — block proportions, cache sizing relative to compute, memory interface width, interconnect structure — what does this tell you about the design philosophy and the tradeoffs the team made? Written by someone who can reason about what a large LLC relative to compute implies about target workloads, not just label rectangles."
  },
  {
    id: "chip-lore",
    name: "Chip Lore",
    icon: "📖",
    desc: "Company stories with a technical spine.",
    longSummary: "Company stories with a technical spine. Intel, NVIDIA, AMD, TSMC, Qualcomm, Samsung — their decisions, pivots, dependencies, and tactics from founding era to present. The interesting question is never just what happened but what technical constraint or market misread forced the decision. Intel's foundry collapse is a story about what happens when process node leadership evaporates and you have no organizational muscle for either role independently. NVIDIA's ML dominance is a story about a bet on general-purpose parallel compute made before the target was obvious. Each piece builds toward a technical thesis, not just a timeline."
  },
  {
    id: "code-to-core",
    name: "Code → Core",
    icon: "💻",
    desc: "DSA complexity mapped to microarchitectural execution.",
    longSummary: "The most original track. Take a DSA problem — naive solution and optimized solution. Don't just analyze time complexity. Analyze what actually happens in hardware: what the naive O(n²) solution does to the L1 cache, what the access pattern looks like to the prefetcher, what the branch predictor sees in both cases, how loop unrolling changes the ILP the OoO engine can exploit. Show the compiled assembly for both. Annotate the critical path. Map instructions to pipeline stages. Compare the hardware behavior of the naive and optimized paths with precision. Nobody does this consistently in high-quality form. Format invented here — it defines the genre for this track."
  },
  {
    id: "paper-lab",
    name: "Paper Lab",
    icon: "🧪",
    desc: "Honest architecture research paper breakdowns.",
    longSummary: "Research paper breakdowns for the architecture literature. The format goes beyond summary: explain why the evaluation methodology is set up the way it is, what the paper's implicit assumptions are, where the result is fragile, what it means for follow-on work. An honest take on papers — including their limitations — is more valuable than a summary. Monthly cadence. Depth over frequency. Covers both landmark older papers and recent work from ISCA, MICRO, HPCA, ASPLOS, ISPASS."
  },
  {
    id: "the-tradeoff",
    name: "The Tradeoff",
    icon: "⚖️",
    desc: "Structured versus series mapping architectural tradeoffs.",
    longSummary: "Versus series. Every piece answers three questions: what exactly is the tradeoff, who does each side favor, and under what real-world conditions does the \"losing\" choice actually win. In-order vs OoO. CISC vs RISC. Monolithic vs chiplet. SRAM vs DRAM for cache. Systolic vs SIMT. The format is structured: state the tradeoff, present both sides with actual numbers where possible, then give the real-world conditions that determine which side wins. Architecture is fundamentally about tradeoffs — this track makes that reasoning explicit and teachable."
  },
  {
    id: "post-mortem",
    name: "Post Mortem",
    icon: "💀",
    desc: "Analysis of computer architecture's most instructive failures.",
    longSummary: "Architecture's most instructive failures. Itanium: a legitimate architectural idea (compilerdirected ILP) that failed because compiler technology couldn't deliver what the ISA demanded, and x86 compatibility mattered more than anyone expected. Bulldozer: a core-sharing model that made sense for throughput workloads and collapsed against gaming workloads because the shared FPU became the bottleneck. Larrabee: a bet that scalar x86 cores plus wide SIMD would match a purpose-built GPU architecture — the assumption was wrong in ways that weren't obvious until implementation. Each piece is built around an assumption that seemed reasonable and wasn't. Most instructive format in engineering."
  },
  {
    id: "rtl-to-silicon",
    name: "RTL to Silicon",
    icon: "🔌",
    desc: "Walkthrough of the full silicon design stack.",
    longSummary: "The full design stack written by someone who has done it. Start from a concrete RTL idea, walk through what it actually requires: the RTL changes, what synthesis does to the critical path, where timing closes and where it doesn't, what the area report implies about whether the design is worth the cost, what a place-and-route run in OpenROAD shows that simulation doesn't. Content that effectively doesn't exist in readable form — most RTL-to-GDSII documentation is either a vendor tool tutorial or a graduate course with no personality. Written from real results using Verilator, Yosys, and OpenROAD, not hypotheticals."
  },
  {
    id: "the-hard-question",
    name: "The Hard Question",
    icon: "❓",
    desc: "Hardware interview questions used as conceptual lenses.",
    longSummary: "Interview questions used as a lens, not as prep material. A well-designed interview question is a compressed version of a real engineering judgment call. The interesting thing about \"explain metastability and how you'd handle it\" isn't that it gets asked in interviews — it's that it forces reasoning about the boundary between the deterministic digital abstraction and the analog reality underneath it, which most digital designers ignore until it bites them in production. Format for each piece: the question, what it is actually probing beneath the surface, what a textbook answer looks like, what a genuinely deep answer looks like, and what the best candidates add that most people miss. The delta between a correct answer and a revealing one is where the content lives. Questions worth covering are the ones where the correct answer is a starting point, not an endpoint: what actually happens in a store buffer when a subsequent load hits an in-flight store, why write-invalidate coherence protocols exist and when write-update would have been better, what the hardware does when two cores simultaneously try to acquire the same cache line in modified state, how you'd design an arbiter for an AXI crossbar and what the priority tradeoffs are, what setup and hold violations actually mean at the transistor level and not just the timing diagram level. The pieces read like investigations, not answer keys. Someone who has no interview scheduled should find them just as worth reading as someone who does."
  }
];

export function getTrackArticle(trackId: string): string {
  const track = TRACKS.find(t => t.id === trackId);
  if (!track) return "";

  // Dynamic titles and summaries mapped to markdown
  return `# Track Info: ${track.name}
## Series Overview

${track.longSummary}

---

### Editorial Format
- **Voice & Tone**: High technical integrity, zero simplification, historically contextualized.
- **Focus Area**: Real engineering trade-offs and operational boundary conditions.
- **Audience**: Systems developers, ASIC designers, and compilers engineers.`;
}
