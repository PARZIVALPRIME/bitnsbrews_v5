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
    desc: "Textbook concepts reimagined.",
    longSummary: "We take textbook architecture concepts and rebuild them for the real world. We don't simplify things, instead we add the missing layers like design intent, historical alternatives, and industry consequences. You'll see how branch prediction became a security surface, and how cache coherence explains distributed manufacturing."
  },
  {
    id: "die-chronicles",
    name: "Die Chronicles",
    icon: "🖼️",
    desc: "Deep analysis of silicon die shots.",
    longSummary: "We look at silicon die shots one level deeper than just labeling the boxes. By analyzing block proportions, cache sizing, and interconnect structures, we figure out the core design philosophy and the tough tradeoffs the engineering team had to make."
  },
  {
    id: "chip-lore",
    name: "Chip Lore",
    icon: "📖",
    desc: "Company stories driven by technical choices.",
    longSummary: "Discover the real stories behind giants like Intel, NVIDIA, and TSMC. We don't just give you a timeline. We focus on the underlying technical constraints and market bets that forced their biggest pivots and most famous failures."
  },
  {
    id: "code-to-core",
    name: "Code → Core",
    icon: "💻",
    desc: "Mapping software to silicon execution.",
    longSummary: "See exactly how your software complexity maps to microarchitectural execution. We take a problem and track its journey all the way down to the L1 cache, the prefetcher, and the branch predictor. We annotate the critical paths and show you the compiled assembly in action."
  },
  {
    id: "paper-lab",
    name: "Paper Lab",
    icon: "🧪",
    desc: "Honest breakdowns of research papers.",
    longSummary: "An honest look at the latest computer architecture research papers. Instead of just summarizing, we explain why the evaluation was set up that way, point out hidden assumptions, and highlight where the results might be fragile."
  },
  {
    id: "the-tradeoff",
    name: "The Tradeoff",
    icon: "⚖️",
    desc: "Structured breakdowns of engineering tradeoffs.",
    longSummary: "Architecture is fundamentally about tradeoffs. For every major debate like CISC vs RISC or SRAM vs DRAM, we break down both sides with real numbers and explain the exact real world conditions where the \"losing\" choice actually wins."
  },
  {
    id: "post-mortem",
    name: "Post Mortem",
    icon: "💀",
    desc: "Analysis of famous architectural failures.",
    longSummary: "Learn from computer architecture's most instructive failures. We look at famous disasters like Itanium and Bulldozer to understand why a seemingly reasonable architectural idea collapsed when it met the reality of software compilers and changing workloads."
  },
  {
    id: "rtl-to-silicon",
    name: "RTL to Silicon",
    icon: "🔌",
    desc: "A full walkthrough of the silicon design stack.",
    longSummary: "Walk through the entire silicon design stack from a concrete RTL idea to synthesis and timing closure. Written by engineers who have actually done it, this track gives you a realistic look at area reports and place and route runs without reading like a dry textbook."
  },
  {
    id: "the-hard-question",
    name: "The Hard Question",
    icon: "❓",
    desc: "Hardware interview questions explored deeply.",
    longSummary: "We use classic hardware interview questions as a lens to explore the boundary between the digital abstraction and analog reality. It's not prep material, but a deep dive into the engineering judgment calls you have to make in production."
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
