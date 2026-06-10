# Bits'nBrews — Claude Code Handoff Brief

> **What this document is:** A complete, self-contained prompt to feed to Claude Code. It contains the full project identity, the current codebase architecture, every content asset, and precise requirements for the next phase of work. Read everything before writing a single line.

---

## 1. PROJECT IDENTITY

### What Bits'nBrews Is

Bits'nBrews is a **technical writing and content project** focused on computer architecture, VLSI, digital design, and the semiconductor industry. It is NOT a tutorial site, not a course, not a blog. It sits in a gap nobody has cleanly filled: content that takes hardware seriously at a genuine technical level without writing for academic audiences or beginners.

Written by an undergrad at IIT Bombay who has built a synthesizable SIMT GPU from scratch in SystemVerilog and is actively targeting top-tier architecture venues (ISCA, MICRO, HPCA). The credential is the work, not a title.

**The goal** is not to explain what textbooks already explain. The goal is to add the layer textbooks deliberately omit — *why* a design choice exists, what problem the designer was actually solving, what alternatives lost and why, and what this means for what is happening in industry and research right now.

### The Moat

The moat is **taste** — knowing which creative choice makes a concept land harder versus which one is just noise. Creativity is downstream of genuine domain depth. Someone who has actually built a scoreboard in RTL has different instincts about how to explain out-of-order execution than someone who read about it. Every piece should reflect that depth visibly — in the precision of the analogy, in the specific detail chosen, in the framing that connects hardware decisions to broader consequences.

The creative energy is **front-loaded** at moments of highest leverage — the hook, the framing, the analogy that introduces a hard concept — and the technical substance is then allowed to breathe without being constantly interrupted by cleverness.

### Design Aesthetic

- **Name:** bitnbrews. Casual without being cringe, domain-specific without being exclusionary. The `n` in the name is a subtle hardware nod — a don't-care bit stylistically.
- **Color palette:** Dark-themed. `#030407` / `#08090e` backgrounds. **Amber `#e8a23a`** as the primary accent. Terminal meets technical zine.
- **Typography:** Monospace for brand and code elements (JetBrains Mono), serif for body prose, sans-serif (Inter) for UI labels.
- **Tone:** Precise, opinionated, occasionally sharp. No surface-level explanations. No hedging. Written for people who either already work in the domain or are seriously working their way into it.
- **NOT:** A corporate dev blog. Not a startup landing page with generic gradients. Something that looks like it was designed by someone who actually works in the domain.

---

## 2. THE 9 CONTENT TRACKS

Each track is a distinct content series with its own format. They share the same voice and creative philosophy but differ in structure and angle.

### 01 — Silicon Explained
Textbook architecture concepts reimagined. The differentiator is not simplification — it's adding the layer the textbook omits: design intent, historical alternatives, geopolitical and industry consequences. A piece on branch prediction connects to why prediction accuracy became a security surface. A piece on cache coherence connects to why distributed manufacturing has the same fundamental constraints. Cultural references and humor are used when they genuinely illuminate — not as decoration.

### 02 — Die Chronicles
Dieshot analysis one level deeper than identifying functional blocks. The question each piece answers: given what the die layout shows — block proportions, cache sizing relative to compute, memory interface width, interconnect structure — what does this tell you about the design philosophy and the tradeoffs the team made?

### 03 — Chip Lore
Company stories with a technical spine. Intel, NVIDIA, AMD, TSMC, Qualcomm, Samsung — their decisions, pivots, dependencies, and tactics. The interesting question is never just *what* happened but what technical constraint or market misread forced the decision.

### 04 — Code → Core
The most original track. Take a DSA problem — naive vs optimized solution. Don't just analyze time complexity. Analyze what actually happens in hardware: what the naive O(n²) does to L1 cache, what the access pattern looks like to the prefetcher, what the branch predictor sees, how loop unrolling changes the ILP the OoO engine can exploit. Show compiled assembly. Annotate the critical path. Map instructions to pipeline stages.

### 05 — Paper Lab
Research paper breakdowns for the architecture literature. Explain why the evaluation methodology is set up the way it is, what the paper's implicit assumptions are, where the result is fragile, what it means for follow-on work. Monthly cadence. Covers ISCA, MICRO, HPCA, ASPLOS, ISPASS.

### 06 — The Tradeoff
Versus series. Every piece answers three questions: what exactly is the tradeoff, who does each side favor, and under what real-world conditions does the "losing" choice actually win. In-order vs OoO. CISC vs RISC. Monolithic vs chiplet. SRAM vs DRAM for cache. Systolic vs SIMT.

### 07 — Post Mortem
Architecture's most instructive failures. Itanium, Bulldozer, Larrabee. Each piece is built around an assumption that seemed reasonable and wasn't. Most instructive format in engineering.

### 08 — RTL to Silicon
The full design stack written by someone who has done it. RTL changes → synthesis → critical path → timing closure → area report → place-and-route in OpenROAD. Written from real results using Verilator, Yosys, and OpenROAD, not hypotheticals.

### 09 — The Hard Question
Interview questions used as a lens, not as prep material. Format: the question, what it is actually probing beneath the surface, what a textbook answer looks like, what a genuinely deep answer looks like, and what the best candidates add that most people miss. The pieces read like investigations, not answer keys.

---

## 3. EXISTING ARTICLE CONTENT

There is **one completed article** so far. It belongs to **Track 01 — Silicon Explained** and should be the first visible piece of content on the platform. Here is the full text:

### "Global Miss Rate vs Local Miss Rate — Why Your Cache's Local Miss Rate is a Lie"
**Author:** Preetam · **Date:** May 23, 2026

> If you spend enough time reading CPU architecture manuals or running gem5 simulations, you'll eventually stumble across a metric that makes absolutely no sense: the L2 cache miss rate.
>
> Look at a state-of-the-art processor like an Intel Golden Cove or an AMD Zen 4 core, and you'll see the L1 cache sitting pretty with a miss rate around 5%. But go one level deeper and the L2 is casually reporting 20%, 30%, or worse.
>
> If you're new to reading these numbers, you might conclude the L2 design team was asleep at the wheel. How could a massive 1 MB SRAM array perform so much worse than the smaller L1?
>
> We have to understand how hardware architects actually evaluate performance, and why splitting cache metrics into Global and Local views is the only way to fairly attribute performance to a specific level of the hierarchy and know exactly which design decision to pull on when a chip underperforms.

**Key sections:**
1. **Textbook Definitions** — Local Miss Rate vs Global Miss Rate formal definitions
2. **How This Maps to AMAT** — Both algebraic forms of the AMAT equation
3. **The CPU's Cockpit: The Global View** — 1000-request walkthrough example (900 L1 hits, 80 L2 hits, 20 DRAM)
4. **The Golden Child: The L1 as a High-Pass Filter** — L1 eats all the easy sequential traffic; L2 gets the "leftovers" (pointer chains, hash table probes, sparse graph traversals, cold lookups)
5. **The Architect's Dilemma: Hardware Decoupling** — Why global metrics mask individual cache quality; brilliant L1 prefetcher hides mediocre L2
6. **The Takeaway** — Global for AMAT/system performance, Local for evaluating specific silicon footprint

**4 Whiteboard Challenges embedded:**
1. What metric does `perf stat` actually report — global or local?
2. Inclusive L3 back-invalidating L1 — can you ever isolate a "local" miss rate?
3. Alder Lake P-core vs E-core sharing L2 — which scenario gives higher local miss rate?
4. Aggressive 50%-accurate prefetcher: does L2 local miss rate go up, down, or same?

---

## 4. CURRENT CODEBASE ARCHITECTURE

The project is a **React 19 + Three.js + Tailwind CSS v4 + Vite 7** single-page web application that ships as a single HTML file via `vite-plugin-singlefile`.

### Tech Stack
| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19.2.6 |
| Language | TypeScript | 5.9.3 |
| Bundler | Vite | 7.3.2 |
| 3D Engine | Three.js | 0.184.0 |
| 3D React | React Three Fiber | 9.6.1 |
| 3D Helpers | Drei | 10.7.7 |
| Post-processing | @react-three/postprocessing | 3.0.4 |
| CSS | Tailwind CSS v4 | 4.1.17 |
| Build | vite-plugin-singlefile | 2.3.0 |

### Current Page Structure (After Recent Cleanup)

The app has **4 chapters** accessed by scroll navigation:

| Chapter | Level | Title | What Shows |
|---|---|---|---|
| 01 | 1 | The Machine | Hero landing. Laptop casing. Rainbow data streams. Circuit SVG background. |
| 02 | 2 | The Package | MCM substrate close-up. "⚡ EXPERIENCE FULL DIE" button opens Playground. |
| 03 | 3 | Silicon Die | Full die floorplan overview. Architecture labels. Technical Tracks menu (left). Click blocks for detail panel (right). |
| 04 | 4 | The Hub | Full directory page: all 9 tracks listed, team info, newsletter subscribe. Dark overlay covers 3D scene. |

### Key Source Files

```
src/
├── main.tsx              → React entry point
├── RootApp.tsx           → Root layout wrapper
├── DesktopApp.tsx        → Desktop entry → <AppUI sceneComponent={Scene} />
├── AppUI.tsx             → ★ MAIN ORCHESTRATOR (all HUD, navigation, overlays, ~900 lines)
├── chapters.ts           → 4 chapter definitions (level, id, title, description)
├── chapterArticles.tsx   → Markdown content for block articles
├── trackArticles.tsx     → 9 track definitions with long summaries
├── ArticlePage.tsx       → Full-page article reader (EXISTS but currently NOT imported/used)
├── theme.ts              → ThemeContext with amber/dark color tokens
├── index.css             → CSS tokens, Tailwind, custom animations
├── utils/cn.ts           → clsx + twMerge utility
└── soc/                  → ★ 3D RENDERING ENGINE
    ├── data.ts           → 17 block definitions (geometry, position, color, utilization matrix)
    ├── Scene.tsx          → Main 3D scene (camera, lights, blocks, die)
    ├── SocBlock.tsx       → Individual 3D block component (emissive glow, lift, wobble)
    ├── Details.tsx        → Surface detail geometry (ribs, bumps, wells)
    ├── levelManager.ts    → Camera path system (4 zoom levels, spherical interpolation)
    ├── ProceduralModels.tsx → ComputerCasing, PackageSubstrate, PipelineSimulation
    ├── Traffic.tsx         → Animated data-flow tubes between blocks
    ├── shaders.ts         → ThermalShader, PowerRailShader, TransistorFlowShader (GLSL)
    ├── quality.ts         → QualityContext ("desktop" | "mobile")
    ├── BlockArticle.tsx    → Co-spatial HTML article cards in 3D
    ├── PlaygroundScene.tsx → Free-roam scene (OrbitControls)
    ├── PlaygroundBlock.tsx → Playground block variant
    ├── PlaygroundDetails.tsx → Richer surface details for playground
    └── PlaygroundOverlay.tsx → Full-screen playground modal with HUD
```

### 3D Die Model — 17 Silicon Blocks

The die is 22×18 units (1 unit ≈ 0.5mm real-world). Each block has:
- `id`, `name`, `fn` (function description)
- `cx`, `cz` (center position on die)
- `w`, `d`, `h` (width, depth, height)
- `color`, `base`, `metalness`, `roughness` (material)
- `lift` (explode animation height)
- `detail` (surface detail type: cpuBig, gpu, npu, modem, isp, slc, memctrl, pmu, lpddr, ioring, etc.)

**Block inventory:** cpu-big, cpu-eff, gpu, npu, modem, isp, dsp, video, slc, memctrl, pmu, lpddr0-3, io-top, io-bot

### Performance System
- Auto-detects weak hardware (≤4GB RAM, integrated GPU) and low FPS (<45) → switches to "Potato Mode"
- Potato Mode: no shadows, DPR=1, no AA, quality="mobile" (disables bloom/vignette, reduces geometry)
- Frame-skip on mobile, settled-state early returns, instanced meshes for vias/pins

---

## 5. WHAT I WANT BUILT — DETAILED REQUIREMENTS

### Requirement A: Die Model Optimization & Realism

The 3D die model needs to look and feel like an **actual silicon die**, not a collection of colored boxes. Priorities:

1. **Optimize mesh count** — Use instanced meshes wherever possible. Merge static geometries. Reduce draw calls. The model should run at 60fps on mid-range hardware.
2. **Surface texture realism** — The die surface should have subtle texture variations: metal interconnect patterns, via grids, subtle height differences between functional blocks. Think electron microscopy imagery of real die shots — not smooth plastic boxes.
3. **Material quality** — Each block type should have visually distinct material properties that hint at its function:
   - CPU cores: dense, layered, structured (think SRAM cell arrays)
   - GPU: repeating shader unit grid patterns
   - NPU: regular systolic array texture
   - Memory controllers: minimal, infrastructure-like
   - LPDDR interfaces: bump array patterns (BGA/C4 bumps)
   - I/O rings: thin perimeter traces
4. **Lighting** — The die should feel like it's under a microscope light. Warm key light (microscope lamp feel), cool fill, amber rim for dramatic edge catch. The lighting should make the die feel like an actual physical object being examined.
5. **Keep it optimized** — All of the above must be performance-conscious. Use LOD where appropriate. Don't add visual complexity that kills frame rate.

### Requirement B: Article Integration with Die Blocks

Each of the 7 main functional blocks on the die maps to a content concept / article:

| Die Block | Article/Concept Connection |
|---|---|
| CPU Performance (cpu-big) | Execution pipeline, OoO, branch prediction |
| GPU | Parallel compute, shader pipelines, SIMT |
| NPU | Systolic arrays, MAC operations, AI inference |
| Memory Controller (memctrl) | Cache hierarchy, miss rates, AMAT |
| SLC (System Cache) | Cache coherence, inclusion policies |
| Modem | RF isolation, baseband processing |
| ISP | Media pipeline, signal processing |

The **first article** ("Global Miss Rate vs Local Miss Rate") connects to the **Memory Controller / Cache Hierarchy** concept.

### Requirement C: Page 4 — Article Gallery (THE MAIN NEW FEATURE)

After Page 3 (Silicon Die), instead of going directly to the Hub, there should be a new **Page 4** that serves as an **article showcase connected to the die model**.

**Layout concept:**
- The 3D die model is still visible (or a simplified/stylized version of it)
- All 7 main functional blocks are shown with their labels
- Each block acts as an entry point to its associated article/concept
- The first article ("Global Miss Rate vs Local Miss Rate") should be **prominently featured and fully readable** on this page — it's the flagship content piece
- Other blocks should show "Coming Soon" or a teaser state
- The design should make it clear this is a **content platform** — the die is the navigation metaphor, not just a 3D demo

**Design requirements for Page 4:**
- Should feel like a premium, startup-grade product page
- The die serves as an interactive table of contents — click a block, read its article
- Clean typography for article reading (serif body text, generous line height, proper measure width)
- Article content should be beautifully formatted with proper heading hierarchy, code blocks, math notation support
- The Whiteboard Challenges in the article should have distinct visual treatment (cards, callout boxes, something that makes them feel interactive)
- Mobile-friendly article reading experience

### Requirement D: Transition from Page 3 → Page 4

The transition from the Silicon Die overview (Page 3) to the Article Gallery (Page 4) should be **cinematically smooth**:

- Camera should pull back or shift to a vantage point that shows the whole die with article entry points
- The die blocks could subtly pulse or have connection lines to their article cards
- The transition should feel like zooming out from "engineering inspection mode" to "knowledge map mode"
- No jarring cuts — everything should interpolate smoothly via the existing spherical camera system

### Requirement E: Frontend Polish — Startup Grade

The overall frontend needs to feel like a **funded technical startup's product**, not a student project:

1. **Typography system** — Proper type scale. Serif for article body (consider a font like Source Serif Pro, Literata, or similar). Monospace (JetBrains Mono) for code and brand elements. Sans-serif (Inter) for UI chrome.
2. **Micro-interactions** — Hover states on all interactive elements. Smooth transitions everywhere. Loading states. Scroll progress indicators.
3. **Responsive** — Must work on mobile, even if the 3D is simplified. Article reading is the primary mobile use case.
4. **Dark mode done right** — Not just "white text on black." Proper contrast ratios. Subtle surface elevation with different shades of near-black. Amber accent used sparingly for emphasis.
5. **Navigation** — The scroll-based chapter navigation should feel effortless. Clear indication of where you are and what's next.
6. **Newsletter subscribe** — Should actually look trustworthy and professional. Not a placeholder.

### Requirement F: Keep What Already Works

- **Pages 1-3** (The Machine, The Package, Silicon Die) — keep the existing experience, just polish
- **Playground Mode** — keep the "⚡ EXPERIENCE FULL DIE" button and the free-roam playground overlay
- **Chapter 3 block selection** — keep the ability to click blocks and see detail panels on the right
- **Technical Tracks menu** on Chapter 3 — keep it
- **Performance auto-scaling** — keep the High/Potato mode system
- **The Hub** (now Page 5 after inserting the new Article Gallery as Page 4) — keep it but update numbering

---

## 6. CONTENT TO EMBED — FULL ARTICLE TEXT

The following is the complete article that must be rendered on Page 4 when the user clicks the Memory/Cache block. Render it with full formatting, proper heading hierarchy, math notation, and styled Whiteboard Challenge callouts.

---

**Title:** Global Miss Rate vs Local Miss Rate  
**Subtitle:** Why Your Cache's Local Miss Rate is a Lie  
**Author:** Preetam  
**Date:** May 23, 2026  
**Track:** 01 — Silicon Explained

---

If you spend enough time reading CPU architecture manuals or running gem5 simulations, you'll eventually stumble across a metric that makes absolutely no sense: the L2 cache miss rate.

Look at a state-of-the-art processor like an Intel Golden Cove or an AMD Zen 4 core, and you'll see the L1 cache sitting pretty with a miss rate around 5%. But go one level deeper and the L2 is casually reporting 20%, 30%, or worse.

If you're new to reading these numbers, you might conclude the L2 design team was asleep at the wheel. How could a massive 1 MB SRAM array perform so much worse than the smaller L1?

We have to understand how hardware architects actually evaluate performance, and why splitting cache metrics into Global and Local views is the only way to fairly attribute performance to a specific level of the hierarchy and know exactly which design decision to pull on when a chip underperforms.

### Textbook Definitions

Before we build the intuition, here are the two formal definitions you'll see in Patterson & Hennessy:

**Local Miss Rate:** Misses in a specific cache divided by accesses that actually reached that cache.

**Global Miss Rate:** Misses in a specific cache divided by all memory requests generated by the CPU core.

Both tell you the truth. Just different truths about different things.

> **Whiteboard Challenge #1**  
> Before we move on, think about your own software tooling. Next time you run `perf stat` or profile your C++ code to optimize memory accesses, take a hard look at the cache metrics it spits out. When it says `LLC-load-misses` (Last Level Cache), is the tool reporting the Global Miss Rate to make your code look efficient, or the Local Miss Rate to show you how badly you are thrashing the silicon? If you don't know which one your profiler is using, how can you actually trust your own software optimizations?

### How This Maps to AMAT

The nested Average Memory Access Time equation can be written from either perspective, and both are mathematically equivalent.

Using local miss rates:

```
AMAT = AT_L1 + MR_L1 × (AT_L2 + Local_MR_L2 × Miss_Penalty_L2)
```

Using global miss rates:

```
AMAT = AT_L1 + MR_L1 × AT_L2 + Global_MR_L2 × Miss_Penalty_L2
```

- `AT_L1` = L1 access time. The mandatory cycle cost to check L1 on every request.
- `AT_L2` = L2 access time. Paid only when a request reaches L2.
- `MR_L1` = L1 miss rate, equivalent to the local miss rate of L1.
- `Local MR_L2` = Fraction of requests that reached L2 which also missed L2.
- `Global MR_L2` = Fraction of all CPU requests that missed both L1 and L2. Equal to `MR_L1 × Local_MR_L2`.
- `Miss_Penalty_L2` = Cycles lost going to the next level (L3 or DRAM).

Notice: when you use the global miss rate, you do not multiply again by the L1 miss rate, because the L1 miss probability is already baked into the global number. Two algebraically identical forms of the same equation.

If the math is equivalent, why do architecture papers obsess over the distinction? Because the math is used for different purposes by different people.

### The CPU's Cockpit: The Global View

The CPU execution engine is a hyperactive, data-starved beast. It fires off thousands of memory requests per millisecond and only cares about one thing: Did I get my data quickly, or did I have to stall my pipeline for 200 cycles waiting for DRAM?

If we measure the system from this cockpit, we get the global miss rate.

Concretely: the CPU issues 1,000 memory requests.
- 900 hit the L1 cache immediately.
- 80 miss L1 but are found in L2.
- 20 fail completely and go all the way to DRAM.

```
Global L2 Miss Rate = 20 / 1000 = 2%
```

Marketing teams love this number. A 2% failure rate looks incredible on a spec sheet. AMAT is low, IPC stays high, everyone is happy.

But if you walk down to the engineering floor and hand that 2% to the architect who designed the L2 cache block, they will throw it back at you. That number is useless for evaluating their work, because the 2% is almost entirely driven by the L1's heroic filtering performance, not by anything the L2 team did.

### The Golden Child: The L1 as a High-Pass Filter

To understand why the L2 looks so bad internally, you have to understand what reaches it in the first place.

The L1 cache sits directly next to the execution units. It gets first pick at the buffet. When a program loops through a contiguous array, it exhibits perfect spatial locality: stride-1 access, cache line after cache line. The L1 swallows all of this effortlessly. Clean sequential strides, tight for loops, hot stack variables: fresh, structured, easy to digest. The L1 acts as a massive high-pass filter, handling 90% of all traffic.

So what actually reaches the L2? **Leftovers.** Pointer chains where every next address is buried inside the current data. Randomised hash table probes scattered across gigabytes of address space. Sparse graph traversals with no spatial pattern to exploit. Cold database lookups that haven't been touched in milliseconds.

The L2 isn't eating badly because it's incompetent. It's eating badly because it only ever gets the leftovers.

```
Local L2 Miss Rate = 20 / 100 = 20%
```

Missing 20% of the time sounds terrible, until you realise the L2 is playing on hard mode.

> **Whiteboard Challenge #2**  
> Assume the architect designs the L3 cache to be strictly inclusive of the L1. This means if a data block lives in L1, a copy must also exist in L3. Now, the L3 cache gets full and evicts a block. Because of the strict inclusion rule, the hardware must silently reach up and rip that exact same block out of the L1 cache too — even if the CPU was actively using it!  
> Think about the metrics: By changing the L3 replacement policy, you just artificially caused the L1 miss rate to spike. In an inclusive hierarchy, can you ever truly isolate a "Local" miss rate? Or is every cache secretly sabotaging the others?

### The Architect's Dilemma: Hardware Decoupling

So why not just always use the global miss rate? Because global metrics can completely mask the quality of individual cache designs.

Consider: the L1 design team invents a brilliant new next-line prefetcher. The L1 miss rate drops from 10% to 5%. Because the L1 is now catching nearly everything, very few requests leak through to the L2. The global L2 miss rate drops beautifully — even though you didn't touch a single transistor inside the L2 cache.

If you were only tracking global metrics, you'd pop champagne celebrating how much better your L2 got. But the L2 didn't get better. You just made its older sibling stronger.

This is **hardware decoupling**: the idea that the local miss rate strips away the L1's filtering effect to expose the naked truth about the L2's own SRAM density and replacement policy quality. It lets an architect ask: *Is this specific silicon block pulling its weight, independent of everything upstream?*

> **Whiteboard Challenge #3**  
> Consider Intel's Alder Lake: a P-core with a large, aggressive L1 and an E-core with a smaller, weaker L1, both sharing the same L2 cache. Run a memory-intensive, pointer-chasing workload exclusively on the E-core. The E-core's weak L1 lets through a flood of requests with relatively normal miss patterns. Now swap: move the same workload to the P-core. The P-core's stronger L1 filters aggressively, so only truly irregular traffic leaks to L2.  
> Question: In which scenario is the L2's local miss rate higher — P-core or E-core — and does a higher local miss rate here mean the L2 is performing worse, or just that it's receiving harder inputs?

### The Takeaway

Modern processors are not a single monolithic memory block. They are a cascade of specialised filters, each one handing off its failures to the next level down.

- **Use the global miss rate** when you want to compute AMAT and understand overall system performance.
- **Use the local miss rate** when you need to know whether a specific cache level's silicon footprint is actually earning its area.
- Marketing needs the global view to sell the chip. The architect needs the local view to know which engineering team needs to go back to the drawing board.

> **Whiteboard Challenge #4**  
> Suppose the L1 design team adds an aggressive hardware prefetcher that fetches the next cache line speculatively into L2 on every L1 miss. The prefetcher is only 50% accurate — half of everything it fetches into L2 is never actually used.  
> Question: does the L2's local miss rate go up, go down, or stay the same — and does it still tell you the truth about L2's quality?

---

## 7. TECHNICAL CONSTRAINTS

1. **Single-file build** — The production build must remain a single HTML file via `vite-plugin-singlefile`.
2. **No backend** — Everything is client-side. Newsletter subscribe can be simulated or use a mailto/Substack link.
3. **Performance budget** — Must hit 60fps on a mid-range laptop (integrated Intel Iris, 8GB RAM). Use the existing quality context system to degrade gracefully.
4. **No new dependencies without justification** — The stack is already heavy. Don't add libraries for things that can be done with existing Three.js + Drei + CSS.
5. **Preserve existing scroll navigation** — The wheel/keyboard chapter snap system works well. Extend it, don't replace it.
6. **Keep the amber accent** — `#e8a23a` is the brand color. All new UI elements should use the existing color system.

---

## 8. SUMMARY — PRIORITY ORDER

1. **Die model optimization** — Make it look like real silicon, not colored boxes. Keep it performant.
2. **Page 4: Article Gallery** — Die-as-navigation with the first article fully readable. This is the flagship feature.
3. **Transition Page 3 → Page 4** — Cinematic, smooth, leveraging the existing camera interpolation system.
4. **Article typography & formatting** — The article must read beautifully. Whiteboard Challenges get distinct treatment.
5. **Frontend polish** — Startup-grade. Every hover, transition, and spacing decision should feel intentional.
6. **Keep everything that works** — Pages 1-3, Playground, performance scaling, Hub directory.
