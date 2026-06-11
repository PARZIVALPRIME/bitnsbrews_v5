# Bits'nBrews — Complete Project Knowledge Base

> **Purpose**: This document captures every detail of the project for context handoff to a new AI session. Every file has been read line-by-line. No detail is omitted.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack & Dependencies](#tech-stack--dependencies)
3. [Build & Config Files](#build--config-files)
4. [Directory Structure](#directory-structure)
5. [Application Entry & Routing](#application-entry--routing)
6. [Design System & Theming](#design-system--theming)
7. [Content Data Layer](#content-data-layer)
8. [3D Scene System (src/soc/)](#3d-scene-system-srcsoc)
9. [UI Components](#ui-components)
10. [Performance System](#performance-system)
11. [User Flow & Navigation](#user-flow--navigation)
12. [Known Design Issues (Audit)](#known-design-issues-audit)
13. [File-by-File Reference](#file-by-file-reference)

---

## Project Overview

**Bits'nBrews** is an interactive 3D web-based "digital engineering museum" that teaches computer architecture concepts through a spatial die-shot navigator. Users scroll through 5 "chapters" that zoom from a laptop casing down to the silicon die level, where clickable functional blocks (CPU, GPU, NPU, etc.) open component portals with technical articles.

**Core Concept**: A 3nm SoC die shot is used as a navigable table of contents. Each of the 9 main functional blocks on the die maps to a set of technical articles — a "basics" article explaining the component, and an "advanced" article linking to one of 9 editorial tracks.

**Key Features**:
- 5-level scroll-driven zoom journey (Casing → Package → Die → Library → Hub)
- 17 3D silicon blocks with per-block micro-architecture surface detail
- Interactive SoC playground with exploded view, utilization modes, and traffic visualization
- Full article reader with rich typography (segments: paragraphs, headings, code blocks, definitions, challenges, lists)
- Component portal with specs, textbook omissions, and learning path
- Performance auto-detection and "Potato Mode" for low-end devices
- Newsletter subscription UI
- 9 editorial tracks with long-form summaries

---

## Tech Stack & Dependencies

### Runtime Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19.2.6 | UI framework |
| `react-dom` | 19.2.6 | DOM rendering |
| `three` | ^0.184.0 | 3D rendering engine |
| `@react-three/fiber` | ^9.6.1 | React renderer for Three.js |
| `@react-three/drei` | ^10.7.7 | Helpers: OrbitControls, Environment, Lightformer, Edges, ContactShadows, Html, Line |
| `@react-three/postprocessing` | ^3.0.4 | Post-processing: Bloom, Vignette, SMAA |
| `postprocessing` | ^6.39.1 | Core postprocessing library |
| `clsx` | 2.1.1 | Conditional className utility |
| `tailwind-merge` | 3.4.0 | Tailwind class conflict resolution |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | 7.3.2 | Build tool & dev server |
| `@vitejs/plugin-react` | 5.1.1 | React Fast Refresh |
| `tailwindcss` | 4.1.17 | Utility-first CSS (v4) |
| `@tailwindcss/vite` | 4.1.17 | Tailwind Vite plugin |
| `typescript` | 5.9.3 | Type checking |
| `vite-plugin-singlefile` | 2.3.0 | Bundles everything into a single HTML file |

### Fonts (loaded via Google Fonts in `index.html`)
- **Inter** (300–700): UI sans-serif body text
- **JetBrains Mono** (300–700, italic 400): Monospaced labels, code, technical metadata
- **Source Serif 4** (300–700, italic 300–600): Serif for long-form article reading

---

## Build & Config Files

### `vite.config.ts`
```typescript
plugins: [react(), tailwindcss(), viteSingleFile()]
resolve.alias: { "@": "src/" }
```
- Uses `viteSingleFile()` to produce a single self-contained HTML for distribution.
- Path alias `@/` maps to `src/`.

### `tsconfig.json`
- Target: ES2020, JSX: react-jsx
- Strict mode enabled with `noUnusedLocals`, `noUnusedParameters`
- Module resolution: `bundler`
- Path mapping: `@/*` → `src/*`

### `index.html`
- Title: "Bits'nBrews — Architecture Explorer"
- Preconnects to Google Fonts
- Loads Inter, JetBrains Mono, Source Serif 4
- Single `<div id="root">` mount point

---

## Directory Structure

```
d:\final mark\fm\
├── index.html                    # HTML entry point
├── package.json                  # Dependencies & scripts
├── vite.config.ts                # Vite + Tailwind + SingleFile config
├── tsconfig.json                 # TypeScript configuration
├── design_audit.md               # Design audit document (14 issues identified)
├── project_knowledge_base.md     # THIS FILE
│
├── public/                       # Static assets (empty or favicon)
│
└── src/
    ├── main.tsx                   # React DOM entry → renders <RootApp>
    ├── RootApp.tsx                # Root wrapper → renders <DesktopApp>
    ├── DesktopApp.tsx             # Desktop entry → <AppUI sceneComponent={Scene}>
    ├── MobileApp.tsx              # Mobile entry → <AppUI sceneComponent={Scene} quality="mobile">
    │
    ├── index.css                  # Global CSS: tokens, animations, cyber-card, scrollbar
    ├── theme.ts                   # ThemeContext with defaultTheme colors (NOT actively used in components)
    ├── vite-env.d.ts              # Vite type declarations
    │
    ├── AppUI.tsx                  # ★ MAIN UI ORCHESTRATOR (1004 lines)
    ├── ArticleReader.tsx          # Full-screen article reader overlay (272 lines)
    ├── ComponentPortal.tsx        # Component detail modal (275 lines)
    ├── chapters.ts                # 5 chapter definitions (level, id, title, description)
    ├── chapterArticles.tsx        # Per-level article content + parseMarkdown()
    ├── trackArticles.tsx          # 9 editorial track definitions + getTrackArticle()
    ├── articles.ts                # ★ MAIN DATA FILE (684 lines): components, articles, helpers
    │
    ├── utils/
    │   └── cn.ts                  # clsx + twMerge utility
    │
    └── soc/                       # 3D Scene System
        ├── data.ts                # ★ Block geometry, utilization, traffic paths (413 lines)
        ├── Scene.tsx              # ★ Main 3D scene for chapter view (743 lines)
        ├── SocBlock.tsx           # Block component for main scene (363 lines)
        ├── PlaygroundScene.tsx    # Playground-specific scene (205 lines)
        ├── PlaygroundBlock.tsx    # Block component for playground (301 lines)
        ├── PlaygroundOverlay.tsx  # Playground full-screen UI (331 lines)
        ├── PlaygroundDetails.tsx  # Playground block surface detail (678 lines)
        ├── Details.tsx            # Main scene block surface detail (585 lines)
        ├── ProceduralModels.tsx   # Casing, PCB, Package, Pipeline, Transistor (504 lines)
        ├── BlockArticle.tsx       # In-3D floating article card (183 lines)
        ├── Traffic.tsx            # FlowTube shader + TrafficNetwork (211 lines)
        ├── levelManager.ts        # Camera positions per level + spherical interpolation (149 lines)
        ├── quality.ts             # QualityContext: "desktop" | "mobile" (10 lines)
        └── shaders.ts             # GLSL shaders: Thermal, PowerRail, TransistorFlow (149 lines)
```

---

## Application Entry & Routing

### Boot Sequence
```
index.html → main.tsx → <RootApp> → <DesktopApp> → <AppUI sceneComponent={Scene}>
```

### `main.tsx` (11 lines)
- Renders `<RootApp>` into `#root` with `StrictMode`.

### `RootApp.tsx` (10 lines)
- Wraps `<DesktopApp>` in a full-screen container with `bg-[#08090e]`.
- No mobile routing currently — `MobileApp.tsx` exists but is not used.

### `DesktopApp.tsx` (7 lines)
- Passes `Scene` (from `soc/Scene.tsx`) as `sceneComponent` prop to `AppUI`.

### `MobileApp.tsx` (7 lines)
- Same as Desktop but passes `quality="mobile"` to `AppUI`.
- **Currently unused** — `RootApp` always renders `DesktopApp`.

---

## Design System & Theming

### CSS Custom Properties (`index.css` :root)
```css
--bg: #030407;
--accent: #e8a23a;          /* THE amber/gold accent used everywhere */
--text-primary: #ffffff;
--text-muted: rgba(255,255,255,0.7);
--panel-bg: rgba(3,4,7,0.85);
--panel-border: rgba(255,255,255,0.05);
```

### `theme.ts` (24 lines)
Defines a `ThemeContext` with `defaultTheme`:
```typescript
background: "#030407"
accent: "#e8a23a"
textPrimary: "#ffffff"
textMuted: "rgba(255,255,255,0.7)"
panelBackground: "rgba(3,4,7,0.85)"
panelBorder: "rgba(255,255,255,0.05)"
```
> **NOTE**: This context exists but is NOT consumed by any component. All color values are hardcoded directly in Tailwind classes and inline styles throughout the codebase.

### Typography Classes
- `.font-mono` → JetBrains Mono
- `.article-serif` → Source Serif 4 (for long-form reading)
- Default body → Inter

### Custom CSS Classes (`index.css`)
| Class | Purpose |
|-------|---------|
| `.soc-slider` | Styled range input for explode control |
| `.scrollbar-thin` | 4px custom scrollbar with amber hover |
| `.cyber-card` | Glass card with corner bracket hover effect |
| `.cyber-button` | Button with sweep highlight animation |
| `.tech-grid-bg` | Subtle 20px grid pattern overlay |
| `.card-glowing-border` | Pulsating amber border animation |
| `.text-glow-gold` | Amber text shadow glow |
| `.challenge-card` | Ambient shimmer for challenge boxes |
| `.track-card` | Fade-in-up animation for track cards |
| `.boot-bar` | Sweep animation for loading screen |
| `.neon-text-glow` | Stronger amber text glow |
| `.animate-checkmark` | SVG checkmark draw animation |
| `.animate-pulse-glow` | Pulsing circle scale animation |
| `.animate-fade-in` | fadeInUp 0.5s animation |

### Keyframe Animations
- `checkmarkDraw` — stroke-dashoffset animation
- `circlePulse` — scale 0.95 → 1.35 with fade
- `borderGlowLoop` — border-color oscillation (5s)
- `challengeShimmer` — subtle box-shadow pulse (6s)
- `fadeInUp` — opacity 0→1, translateY 10px→0
- `bootSweep` — translateX -100% → 540% (1.1s)
- `circuitDash` — stroke-dashoffset -160 (10s)
- `dashOffsetSub` — stroke-dashoffset -40 (3s)

---

## Content Data Layer

### `chapters.ts` — 5 Chapter Definitions

```typescript
export const CHAPTERS = [
  { level: 1, id: "the-machine",   chapter: "01", tag: "HARDWARE FOUNDATIONS", title: "The Machine",   subtitle: "System Casing & Enclosure" },
  { level: 2, id: "the-package",   chapter: "02", tag: "PACKAGING",           title: "The Package",   subtitle: "MCM Silicon Substrate" },
  { level: 3, id: "silicon-die",   chapter: "03", tag: "SEMICONDUCTORS",      title: "Silicon Die",   subtitle: "3nm SoC Floorplan Layout" },
  { level: 4, id: "the-library",   chapter: "04", tag: "KNOWLEDGE MAP",       title: "The Library",   subtitle: "The Die as a Table of Contents" },
  { level: 5, id: "hub",           chapter: "05", tag: "INDEX & DIRECTORY",   title: "The Hub",       subtitle: "Technical Index & Team Directory" },
];
export const TOTAL = 5;
```

### `trackArticles.tsx` — 9 Editorial Tracks

Each track has: `id`, `name`, `icon`, `desc` (short), `longSummary` (detailed editorial overview).

| # | Track ID | Track Name | Icon |
|---|----------|-----------|------|
| 1 | silicon-explained | Silicon Explained | 🔬 |
| 2 | die-chronicles | Die Chronicles | 🖼️ |
| 3 | chip-lore | Chip Lore | 📖 |
| 4 | code-to-core | Code → Core | 💻 |
| 5 | paper-lab | Paper Lab | 🧪 |
| 6 | the-tradeoff | The Tradeoff | ⚖️ |
| 7 | post-mortem | Post Mortem | 💀 |
| 8 | rtl-to-silicon | RTL to Silicon | 🔌 |
| 9 | the-hard-question | The Hard Question | ❓ |

`getTrackArticle(trackId)` returns a markdown string with the track's `longSummary`.

### `articles.ts` — Core Data (684 lines)

#### Types
```typescript
ArticleSegment = { kind: "p" | "h2" | "defs" | "code" | "list" | "challenge", ... }
Article = { id, track, trackNo, title, subtitle, author, date, readTime, segments[] }
ComponentMetadata = { id, name, tag, shortDesc, area, clockSpeed, process, powerFocus, textbookOmission, basicArticleId, advancedArticleId, advancedTrackNo, advancedTrackName }
BlockTrack = { blockId, trackNo, trackName, hook, status, articleId? }
```

#### 9 Components (`COMPONENTS[]`)
Each component has metadata linking it to articles:

| ID | Name | Tag | Basic Article | Advanced Track |
|----|------|-----|--------------|---------------|
| cpu-big | CPU Performance Core | PROCESSING POWER | cpu-big-basics | 04 Code → Core |
| cpu-eff | CPU Efficiency Core | EFFICIENCY & BACKGROUND | cpu-eff-basics | 06 The Tradeoff |
| gpu | Graphics Processor (GPU) | PARALLEL COMPUTATION | gpu-basics | 02 Die Chronicles |
| npu | Neural Accelerator (NPU) | AI INFERENCE ENGINE | npu-basics | 05 Paper Lab |
| modem | 5G Baseband Modem | WIRELESS COMMUNICATIONS | modem-basics | 03 Chip Lore |
| isp | Image Signal Processor (ISP) | MEDIA PROCESSING | isp-basics | 07 Post Mortem |
| dsp | Digital Signal Processor (DSP) | MATHEMATICAL ACCELERATION | dsp-basics | 08 RTL to Silicon |
| slc | System Level Cache (SLC) | COHERENCE & STORAGE | slc-basics | 09 The Hard Question |
| memctrl | Memory Controller | EXTERNAL RAM INTERFACE | memctrl-basics | 01 Silicon Explained |

Each component has:
- `area` (e.g., "2.40 mm²")
- `clockSpeed` (e.g., "3.30 - 4.60 GHz")
- `process` (e.g., "3nm GAA EUV")
- `powerFocus` (e.g., "High Performance (Turbo-capable)")
- `textbookOmission` — paragraph explaining what textbooks miss

#### 10 Articles (`ARTICLES[]`)
1. **"miss-rate"** — "Global Miss Rate vs Local Miss Rate" (Track 01: Silicon Explained, by Preetam, 9 min) — The only published advanced article. Contains: paragraphs, h2s, defs, code blocks, challenge boxes, lists.
2. **"cpu-big-basics"** — "How CPU Cores Cheat Time: Out-of-Order Execution" (Basics)
3. **"cpu-eff-basics"** — "Understanding the CPU Efficiency Core" (Basics)
4. **"gpu-basics"** — "Why GPUs Have Thousands of Cores but Can't Run Windows" (Basics)
5. **"npu-basics"** — "Systolic Arrays: Making AI Math Run at Low Power" (Basics)
6. **"modem-basics"** — "The Radio-to-Silicon Gateway" (Basics)
7. **"isp-basics"** — "The Digital Camera's Darkroom" (Basics)
8. **"dsp-basics"** — "Why Audio Processing Needs VLIW Architectures" (Basics)
9. **"slc-basics"** — "The Network-on-Chip: Routing Traffic Inside a Chip" (Basics)
10. **"memctrl-basics"** — "Memory Controllers: Dynamic Row Scheduling" (Basics)

#### Helper Functions
- `getComponent(id)` — finds component by ID
- `getArticle(id)` — finds article by ID
- `getTrackForBlock(blockId)` — returns `BlockTrack` with track info; only `memctrl` has `status: "published"` with `articleId: "miss-rate"`, all others are `"coming-soon"`.
- `ARTICLE_BLOCK_IDS` — Set of the 9 main component IDs

### `chapterArticles.tsx` — Per-Level Content

`getArticleForLevel(level)` returns markdown content for levels 4–10 (CPU, GPU, NPU, Modem, ISP/Media, Memory, Execution Pipeline). Below level 4 or unknown levels return a generic placeholder.

`parseMarkdown(text)` — crude markdown renderer that converts `#`, `##`, `###`, `- `, and blank lines into React elements with hardcoded Tailwind classes.

---

## 3D Scene System (`src/soc/`)

### `data.ts` — Block Geometry & Simulation Data (413 lines)

#### Types
```typescript
DetailKind = "cpuBig" | "cpuEff" | "gpu" | "npu" | "modem" | "isp" | "dsp" | "video" | "slc" | "memctrl" | "pmu" | "lpddr" | "ioring"
SocMode = "Idle" | "Gaming" | "AI" | "Camera" | "Web" | "Video"
Block = { id, name, fn, description, specs[], detail, cx, cz, w, d, h, lift, color, base, roughness, metalness, showLabel, labelDir? }
TrafficPath = { from, to, bandwidth, modes[] }
```

#### Die Dimensions
```typescript
DIE_W = 22;  // X range: [-11, +11]
DIE_D = 18;  // Z range: [-9, +9]
// Y=0 is die surface, blocks extrude UP
// 1 unit = 0.5mm real-world
// Gap between adjacent blocks: 0.08u
```

#### 17 Blocks (`BLOCKS[]`)
| # | ID | Name | Position (cx, cz) | Size (w × d × h) | Lift | Color |
|---|-----|------|-----------|---------|------|-------|
| 1 | cpu-big | CPU Performance Cores | (-2.50, -4.55) | 4.80 × 5.30 × 3.20 | 11.5 | #0a1d3c |
| 2 | cpu-eff | CPU Efficiency Cores | (-2.50, 0.32) | 4.80 × 4.50 × 2.20 | 9.0 | #061830 |
| 3 | gpu | GPU | (3.44, -2.33) | 7.20 × 9.75 × 3.00 | 10.0 | #140a26 |
| 4 | npu | NPU / AI Engine | (-6.90, -4.41) | 4.00 × 5.60 × 2.80 | 9.5 | #2a0a12 |
| 5 | modem | 5G Modem | (-6.90, 0.47) | 4.00 × 4.20 × 2.40 | 8.0 | #281508 |
| 6 | isp | ISP | (9.02, -4.87) | 4.00 × 4.70 × 2.00 | 7.0 | #051a14 |
| 7 | dsp | DSP | (9.02, -1.29) | 4.00 × 2.50 × 1.80 | 6.0 | #0a2418 |
| 8 | video | Video Codec | (9.02, 1.26) | 4.00 × 2.60 × 1.50 | 5.0 | #072018 |
| 9 | slc | System Level Cache | (1.06, 3.76) | 19.90 × 2.40 × 1.50 | 6.0 | #061528 |
| 10 | memctrl | Memory Controller | (1.06, 5.95) | 19.90 × 1.90 × 1.00 | 4.5 | #04101c |
| 11 | pmu | PMU + I/O | (-9.94, 0.00) | 2.12 × 14.10 × 1.20 | 11.0 | #0a0a06 |
| 12 | lpddr0 | LPDDR5x CH 0 | (-7.52, -8.10) | 6.97 × 1.80 × 0.80 | 3.5 | #060c18 |
| 13 | lpddr1 | LPDDR5x CH 1 | (7.15, -8.10) | 7.70 × 1.80 × 0.80 | 3.5 | #060c18 |
| 14 | io-top | I/O Top Ring | (-0.37, -8.10) | 7.33 × 1.80 × 0.50 | 2.5 | #0a0a06 |
| 15 | lpddr2 | LPDDR5x CH 2 | (-7.52, 7.96) | 6.97 × 2.09 × 0.80 | 3.5 | #060c18 |
| 16 | lpddr3 | LPDDR5x CH 3 | (7.15, 7.96) | 7.70 × 2.09 × 0.80 | 3.5 | #060c18 |
| 17 | io-bot | I/O Bottom Ring | (-0.37, 7.96) | 7.33 × 2.09 × 0.50 | 2.5 | #0a0a06 |

#### Utilization Table (`UTILIZATION`)
Maps each block ID to its utilization (0–1) across 6 SoC modes (Idle, Gaming, AI, Camera, Web, Video). Drives emissive glow intensity.

#### Traffic Paths (`TRAFFIC_PATHS[]`)
13 data paths between blocks, each active in specific modes. Used by the `TrafficNetwork` component to draw animated flow tubes.

### `levelManager.ts` — Camera System (149 lines)

#### 5 Zoom Levels
| Level | Name | Camera Position | Target | FOV |
|-------|------|----------------|--------|-----|
| 1 | System Casing | [0, 80, 100] | [0, 0, 0] | 30 |
| 2 | MCM Package | [0, 32, 38] | [0, -1, 0] | 28 |
| 3 | Silicon Die | [28, 22, 30] | [0.3, 1.5, 0] | 25 |
| 4 | The Library | [2, 19, 28] | [0, 3.4, 0] | 32 |
| 5 | The Hub | [0, 50, 60] | [0, -2, 0] | 32 |

#### Key Functions
- `getCameraParamsForLevel(level, selectedBlockCoords)` — returns position/target/fov for a given integer level
- `getCameraParamsInterpolated(levelFloat, selectedBlockCoords)` — smoothly interpolates between levels using **spherical interpolation** for camera position + a **cinematic flyover arc** (sin curve proportional to distance between levels)

### `quality.ts` — Quality Context (10 lines)
```typescript
type Quality = "desktop" | "mobile";
const QualityContext = createContext<Quality>("desktop");
function useQuality(): Quality;
```

### `shaders.ts` — Custom GLSL Shaders (149 lines)

#### 1. ThermalShader
- Vertex: passes position and normal
- Fragment: maps `uUtilization` to a 4-stop gradient (cool indigo → amber → orange-red → white-yellow) with position-based noise and rim lighting

#### 2. PowerRailShader
- Draws animated grid lines on the die surface
- Pulses travel along X/Z with sin/cos modulation

#### 3. TransistorFlowShader
- Visualizes electron wave packets flowing through GAA nanosheet channels
- `uActivity` controls intensity, `uTime` drives animation

### `Scene.tsx` — Main 3D Scene (743 lines)

**This is the primary scene used in the chapter-based navigation.**

#### Sub-components:
- **MicroViaGrid** — Instanced gold cylinders on the die surface (single draw call)
- **InstancedBuses** — Instanced box meshes for data buses (horizontal, vertical, diagonal, local)
- **DieInterconnects** — Combines buses + via grid; reduces buses on mobile
- **DieIOPins** — Gull-wing I/O pins around die perimeter (instanced, ~250 pins)
- **RainbowDatastreams** — Animated colored spheres following CatmullRom curves flowing into the die (visible only at level ≤ 1.8); 36 streams on desktop, 16 on mobile
- **Die** — Die substrate slab + recessed inlay + scribe-line amber border + power rail shader mode
- **CameraController** — Smooth camera lerp with micro-breathing drift
- **Lights** — Ambient + hemisphere + spotlight (ch1 only) + directional key/fill/rim/overhead
- **Scene (main export)** — Orchestrates everything:
  - `levelFloat` state with easing animation toward `targetLevel`
  - Fog distance scales with camera distance
  - `ComputerCasing` (level 1 only)
  - `PackageSubstrate` + `Die` + all `MemoSocBlock` instances
  - Gallery mode: auto-raises blocks in center-out ripple at level 4
  - `ContactShadows` (desktop only, baked once with `frames={1}`)
  - `EffectComposer`: Bloom + Vignette + SMAA (desktop only)
  - `OrbitControls` disabled (camera is script-driven)

#### Block Stagger Function
`getStaggeredT(blockId, manualT)` — creates center-out ripple by delaying each block's animation based on distance from die center. Uses smoothstep: `t² × (3 - 2t)`.

### `SocBlock.tsx` — Main Scene Block (363 lines)

**Per-block 3D component for the chapter-based scene.**

Props: `block, t, showLabels, selected, onSelect, dimmed, modeUtilization, visMode, opacity, focused, level, galleryPulse, liftScale`

Key behaviors:
- Smooth lerp for lift position, utilization, hover, selection (all animated via `useFrame`)
- Snaps to target values when within 0.001 to prevent infinite animation loops
- `settled` flag: when all values converge, skips matrix/material writes (major perf optimization)
- Mobile: updates materials every other frame; keeps dimmed blocks more visible
- **Body mesh**: box with `MeshStandardMaterial`, amber emissive glow driven by utilization + hover + selection
- **Cap mesh**: slightly different material on top face
- **Edge outlines**: desktop uses `<Edges>`, mobile uses `<lineSegments>` with pre-built geometry (1 draw call)
- **Support rod**: gold cylinder connecting block to die surface when lifted
- **BlockDetail**: micro-architecture surface detail (from `PlaygroundDetails.tsx`)
- **Labels**: HTML overlays via `<Html>` from drei, with amber leader lines + anchor spheres. Only visible for 9 main blocks on level ≤ 4, plus selected block.
- **Gallery pulse**: breathing emissive animation on level 4 for article blocks

### `PlaygroundScene.tsx` — Playground 3D Scene (205 lines)

Simpler scene for the playground overlay:
- No camera controller (uses `OrbitControls` with damping)
- Higher-resolution shadows (2048×2048)
- No level transitions
- Includes `TrafficNetwork` for animated data flow
- Full `EffectComposer` (Bloom + Vignette + SMAA)

### `PlaygroundBlock.tsx` — Playground Block (301 lines)

Similar to `SocBlock.tsx` but simpler:
- No `visMode`, `opacity`, `focused`, `level`, `galleryPulse`, `liftScale` props
- Includes plinth base (desktop only)
- Same lift/utilization/hover/selection animation system
- Labels show for all blocks with `showLabel` on desktop

### `PlaygroundOverlay.tsx` — Playground UI (331 lines)

Full-screen overlay with:
- Separate `<Canvas>` instance
- Mode switcher: Idle, Gaming, AI, Camera, Web, Video
- View toggle: Assembled / Exploded
- Left panel: domain color legend
- Right panel: selected block diagnostics (name, fn, utilization bar, description, specs grid)
- Bottom-left: explode slider + architecture labels toggle + reset view
- Bottom-right: zoom +/−/reset
- Fade-in/out animation on mount/unmount

### `PlaygroundDetails.tsx` — Block Surface Detail (678 lines)

**Micro-architecture 3D detail rendered on top of each block.**

Each `DetailKind` has unique geometry:

| Kind | Visual | Method |
|------|--------|--------|
| cpuBig | 3 compute cells + 3 L2 cache blocks + groove | SectionPad + groove mesh |
| cpuEff | 2×2 panel grid + groove | PanelGrid |
| gpu | 4×2 shader grid + GPU L2 cache band + bevel | PanelGrid + SectionPad |
| npu | Horizontal rib field + base + dividing groove + amber hairline | RibField + meshes |
| modem | Recessed pad + 2×2 RF tiles + amber perimeter ring | SectionPad + PanelGrid + ring |
| isp | 3 pipeline bands + horizontal rib overlay | 3× SectionPad + RibField |
| dsp | 3×1 panel grid | PanelGrid |
| video | Recessed pad + vertical rib field | SectionPad + RibField |
| slc | Recessed pad + horizontal ribs ("highway") + amber centerline | SectionPad + RibField |
| memctrl | Base + 4 channel stripes | mesh + 4× SectionPad |
| pmu | Base + amber vertical spine + concentric torus rings at 5 stations | meshes + tori |
| lpddr | Base + bump field (C4 bump grid) | BumpField (instanced cylinders) |
| ioring | Base + amber hairline | 2 meshes |

Helper components:
- `SectionPad` — raised box with optional edge outline + recessed inner well
- `PanelGrid` — grid of SectionPads
- `RibField` — instanced parallel ribs along X or Z axis
- `BumpField` — instanced cylinders in a grid

### `Details.tsx` — Main Scene Block Detail (585 lines)

Same as `PlaygroundDetails.tsx` but with additional recessed wells (more expensive mesh per pad). Includes material caching via `WELL_MAT_CACHE`.

### `ProceduralModels.tsx` — Procedural 3D Models (504 lines)

#### ComputerCasing (Level 1)
- Laptop bottom shell (44×1.2×38 box)
- Keyboard well outline
- Trackpad outline
- Fades out and slides down as `levelFloat` increases past 1.0

#### MotherboardPCB (Level 2) — **Exists but NOT used in any scene**
- Main PCB board with trace pattern lines
- Capacitors and VRM inductor blocks

#### PackageSubstrate (Level 2-3)
- Organic substrate core (26×0.35×22)
- Gold border rings (2 concentric)
- 8 diagonal gold circuit traces
- 12 SMD capacitors (instanced: 2 draw calls)
- ~200 solder micro-balls (instanced: 1 draw call)

#### PipelineSimulation (Level 7) — **Exists but NOT used in any scene**
- 8 pipeline stages (Fetch→Commit)
- 3 animated instruction packet cubes sliding through stages

#### GaaTransistorModel (Level 8) — **Exists but NOT used in any scene**
- Source/Drain blocks
- 3 GAA nanosheet channels with `TransistorFlowShader`
- Gate collar with high-k oxide inner collar

### `BlockArticle.tsx` — In-3D Article Card (183 lines)

Floating holographic card attached to a block in 3D space:
- Uses `<Html transform>` for text content
- Read/Edit toggle (content stored in localStorage)
- Glass backing plane
- Guide line from block cap to card
- **Currently not visibly used** in any scene (was for earlier levels)

### `Traffic.tsx` — Data Flow Visualization (211 lines)

#### FlowTube
- Quadratic Bezier curve between two blocks
- Custom GLSL shader: flowing gradient with 3 crisp pulses
- Leading pulse head (sphere) traveling along curve
- Desktop extras: halo sphere, endpoint rings, bandwidth label chip
- Mobile: fewer tube segments, no extras

#### TrafficNetwork
- Filters `TRAFFIC_PATHS` by current mode
- Creates `FlowTube` for each active path
- Y positions scale with explode amount

---

## UI Components

### `AppUI.tsx` — Main UI Orchestrator (1004 lines)

**This is the heart of the application.**

#### State Variables
| State | Type | Default | Purpose |
|-------|------|---------|---------|
| targetLevel | number | 1 | Current chapter (1–5) |
| chapterVisible | boolean | true | Text fade state |
| t | number | 0.0 | Explode amount (0=assembled, 1=exploded) |
| visMode | string | "physical" | Visualization mode (physical/thermal/logical/power) |
| selectedTrack | string\|null | null | Currently selected editorial track |
| selectedBlock | string\|null | null | Currently selected die block |
| email | string | "" | Newsletter email input |
| subscribed | boolean | false | Newsletter subscription state |
| submitting | boolean | false | Newsletter submit loading |
| hubAtBottom | boolean | false | Whether hub scroll reached bottom |
| readerArticleId | string\|null | null | Open article reader |
| activeComponentPortal | string\|null | null | Open component portal |
| showPlayground | boolean | false | Playground overlay open |
| perfMode | "high"\|"low" | "high" | Performance quality mode |
| autoDowngraded | boolean | false | Whether auto-detected low hardware |
| booted | boolean | false | Boot screen dismissed |
| dynamicDpr | number | 1.5 | Dynamic pixel ratio |

#### CircuitBackground Component (lines 29–118)
- SVG overlay with animated circuit traces, solder nodes, grid pattern, and ambient glow
- Only active on level 1
- Uses CSS animation `circuitDash` for flowing traces
- Performance concern: SVG with multiple animated elements

#### Major UI Sections

**1. Boot Screen** (lines 978–1000)
- Full-screen branded loading cover
- "Bits'nBrews Architecture Explorer" + amber sweep bar
- Auto-dismisses after 1400ms
- Covers shader compilation jank

**2. Film Grain Overlay** (lines 370–379)
- SVG fractal noise at 3.5% opacity with overlay blend mode
- Zero GPU cost (static image)

**3. Vignette Layers** (lines 382–397)
- Level 1: strong left-to-right gradient (text readability)
- Level 2+: radial center-transparent vignette
- Cross-fades between them

**4. Chapter 1 Hero** (lines 446–491)
- Full left-half editorial layout
- "Where Silicon Meets Intent." headline with gradient text
- Technical metadata badges (3nm GAA EUV PROCESS, EDITION 2026)
- "Explore the Architecture" CTA button
- Fades with `translateY` animation

**5. Chapters 2–3 Panel** (lines 494–529)
- Compact bottom-left card with chapter tag, number, title, subtitle, description
- Level 2: "EXPERIENCE FULL DIE" button opens playground

**6. Chapter 3 Tracks Menu** (lines 631–680)
- Left panel showing 9 editorial tracks
- Numbered list with selection highlighting
- Clicking a track shows its detail in the right panel

**7. Chapter 3 Right Detail Panel** (lines 532–586)
- Shows selected track or block article content via `parseMarkdown()`

**8. Chapter Navigation Dots** (lines 589–628)
- Right-side dot navigation for levels 1–5
- Active dot: amber with glow; others: white/22%
- Label shows on hover
- Hidden on levels 4+

**9. Level 4 (Library)** — handled by 3D scene (blocks auto-raise, clicking opens component portal)

**10. Level 5 Hub** (lines 682–920)
- Full dark backdrop overlay (opacity 0.82, fades to 0.22 at bottom)
- Scrollable hub container with:
  - Header: "Bits'nBrews" + "Technical Publication Catalog & Hub"
  - About & Team card (Dhruv: Architectural Dev, Gemini Partner: AI Programmer, Parzival Prime: Graphics Director)
  - Section divider
  - 9 track cards with numbers, names, long summaries
  - Newsletter subscription section with:
    - Animated SVG circuit background
    - Email input + submit button
    - Success state with animated checkmark
    - Social proof: "Join 14,200+ hardware practitioners from AMD, NVIDIA, INTEL, APPLE"

**11. Progress Bar** (lines 922–949)
- Bottom of screen: gradient progress bar + chapter counter + scroll hint
- Hidden on level 5

#### Scroll Navigation System
- **Wheel**: accumulates deltaY, fires chapter advance at threshold (120px), 400ms cooldown
- **Keyboard**: ArrowDown/PageDown = next, ArrowUp/PageUp = prev
- **Level 5 special handling**: wheel scrolls the hub container normally; only navigates back when at top + scrolling up
- **Article reader override**: all navigation disabled when reader is open

#### Performance Detection (lines 158–210)
1. **Hardware specs check** (mount): checks `navigator.deviceMemory ≤ 4` and WebGL renderer for low-end GPU keywords (intel, uhd, mali, adreno, etc.)
2. **FPS benchmark** (first 2s): counts frames, auto-downgrades if FPS < 45

### `ComponentPortal.tsx` — Component Detail Modal (275 lines)

Full-screen modal triggered when clicking a block on Level 4 (The Library):
- Glass panel with 3-column grid layout
- **Header**: emoji icon + tag + component name + short description
- **Left column** (5/12):
  - Specs card: Die Area, Clock Freq, Lithography, Power Target + animated SVG telemetry wave + sweep scan bar
  - Textbook gap card: what textbooks omit
- **Right column** (7/12):
  - Step 1: Basics article card (clickable → opens ArticleReader)
  - Step 2: Advanced track article card (clickable → opens ArticleReader)
  - If no advanced article: "In Fabrication" placeholder
- Escape key closes
- Scale-up + fade-in animation

### `ArticleReader.tsx` — Full Article Reader (272 lines)

Full-screen article reading experience:
- Reading progress bar (top, amber)
- Top chrome: "Bits'nBrews" wordmark + "← Back to die [esc]" button
- Article layout:
  - Track badge
  - Title (38–46px serif)
  - Subtitle (italic serif)
  - Author avatar + name + date + read time
  - Body segments rendered by `Segment` component
  - Footer: end mark + "more pieces in fabrication" card + "← Back to the die" button

#### Segment Renderer
Each segment type has custom styling:
- `p` — 17px serif, 1.85 line height, white/70
- `h2` — 26px serif with amber dash prefix
- `defs` — 2-column grid of definition cards with amber term labels
- `code` — dark code block with amber left border, monospace, amber text
- `list` — amber bullet dots + 16px serif
- `challenge` — aside with amber border, grid texture, numbered badge, "Whiteboard Challenge" header

Inline formatting: `**bold**` → `<strong>`, `*italic*` → `<em>`, `` `code` `` → `<code>` with amber styling.

---

## Performance System

### Quality Tiers
| Mode | Canvas | Shadows | DPR | Bloom | SMAA | Edges | Environment | ContactShadows | Material Updates |
|------|--------|---------|-----|-------|------|-------|-------------|---------------|-----------------|
| High ("desktop") | shadows=true | Yes, 1024×1024 | Dynamic 1.0–1.5 | mipmapBlur | Yes | `<Edges>` | Yes (128 res) | Yes (frames=1) | Every frame |
| Low ("mobile") | shadows=false | No | 1.0 | Simple | No | `<lineSegments>` (pre-built) | No | No | Every other frame |

### Auto-Detection
1. **deviceMemory API**: ≤ 4GB → potato mode
2. **WebGL GPU probe**: Intel/UHD/HD Graphics/Iris/Mali/Adreno/Microsoft Basic → potato mode
3. **FPS benchmark**: First 2s, if < 45 FPS → potato mode

### Dynamic Resolution
`PerformanceMonitor` from drei tunes `dynamicDpr`:
- bounds: [48, 60] FPS
- onIncline: DPR += 0.25 (max 1.5)
- onDecline: DPR -= 0.25 (min 1.0)
- onFallback: DPR = 1.0
- flipflops: 4

### Block-Level Optimizations
- `MemoSocBlock`: `React.memo()` wrapper prevents re-renders when quantized props don't change
- Block `settled` flag: stops all matrix/material writes when animation converges (biggest CPU saving)
- Frame skipping on mobile: materials updated every other frame
- Snap-to-target: when within 0.001 of target value, snap instead of infinite lerp
- Instanced meshes throughout: buses, vias, pins, solder balls, capacitors, ribs, bumps
- `ContactShadows frames={1}`: bake once instead of per-frame
- No shadow casting on mobile

---

## User Flow & Navigation

```
BOOT SCREEN (1.4s)
    ↓
LEVEL 1: "The Machine" — Hero landing with laptop casing + rainbow datastreams
    ↓ scroll
LEVEL 2: "The Package" — Package substrate, "EXPERIENCE FULL DIE" button → Playground
    ↓ scroll
LEVEL 3: "Silicon Die" — Exploded view with labels, 9 tracks menu on left, detail panel on right
    ↓ scroll
LEVEL 4: "The Library" — Blocks auto-raise in center-out ripple, click block → ComponentPortal
    ↓ (in ComponentPortal)
    → Click "Step 1 Basics" → ArticleReader
    → Click "Step 2 Advanced" → ArticleReader (only "miss-rate" published)
    ↓ scroll
LEVEL 5: "The Hub" — Full catalog with all 9 tracks + newsletter + team
```

---

## Known Design Issues (Audit)

From `design_audit.md` — 14 identified issues:

1. **Amber (#e8a23a) monoculture**: Every accent, glow, border, and badge uses the same amber. Creates a generic "AI-generated" cyberpunk look.
2. **Glassmorphism overload**: `backdrop-blur-xl/2xl` on almost every panel. Expensive and homogeneous.
3. **Circuit trace SVG**: Animated dashes feel like a screensaver, not a professional design element.
4. **Film grain overlay**: Adds grittiness that conflicts with clean technical aesthetic.
5. **Cyber-card brackets**: Corner pseudo-element brackets on hover are a cyberpunk cliché.
6. **Text glow effects**: `text-shadow` amber glow on headings looks cheap.
7. **Boot screen**: "Compiling silicon…" loading is pretentious for a website.
8. **Font hierarchy unclear**: Three font families but inconsistent application.
9. **Monospace overuse**: Everything uses monospace tracking-widest, making it hard to read.
10. **Color palette too narrow**: Nearly all block colors are variations of very dark navy/charcoal.
11. **Emissive glow uniformity**: All blocks glow the same amber color regardless of their domain.
12. **Newsletter section design**: "Join 14,200+ practitioners" feels like growth-hacking, not premium.
13. **"Potato Mode" labeling**: Emoji label "🥔 POTATO MODE" undermines professionalism.
14. **Sweep/scan animations**: CSS animations (sweep bar, dashOffset, circlePulse) feel like HUD decorations.

---

## File-by-File Reference

| File | Lines | Bytes | Role |
|------|-------|-------|------|
| `index.html` | 16 | 714 | HTML entry, font loading |
| `package.json` | 34 | 804 | Dependencies |
| `vite.config.ts` | 20 | 538 | Build config |
| `tsconfig.json` | 32 | 681 | TypeScript config |
| `src/main.tsx` | 11 | 242 | React DOM mount |
| `src/RootApp.tsx` | 10 | 215 | Root wrapper |
| `src/DesktopApp.tsx` | 7 | 155 | Desktop entry |
| `src/MobileApp.tsx` | 7 | 171 | Mobile entry (unused) |
| `src/index.css` | 265 | 5699 | Global styles + animations |
| `src/theme.ts` | 24 | 582 | Theme context (unused) |
| `src/utils/cn.ts` | 7 | 169 | clsx + twMerge |
| `src/chapters.ts` | 58 | 2129 | 5 chapter definitions |
| `src/chapterArticles.tsx` | 121 | 4216 | Per-level article content |
| `src/trackArticles.tsx` | 94 | 8429 | 9 track definitions |
| `src/articles.ts` | 684 | 32750 | Components + articles data |
| `src/AppUI.tsx` | 1004 | 46920 | Main UI orchestrator |
| `src/ArticleReader.tsx` | 272 | 10838 | Article reader overlay |
| `src/ComponentPortal.tsx` | 275 | 13771 | Component detail modal |
| `src/soc/data.ts` | 413 | 16437 | Block geometry + simulation |
| `src/soc/Scene.tsx` | 743 | 26035 | Main 3D scene |
| `src/soc/SocBlock.tsx` | 363 | 14614 | Main scene block |
| `src/soc/PlaygroundScene.tsx` | 205 | 6689 | Playground scene |
| `src/soc/PlaygroundBlock.tsx` | 301 | 11200 | Playground block |
| `src/soc/PlaygroundOverlay.tsx` | 331 | 14255 | Playground UI |
| `src/soc/PlaygroundDetails.tsx` | 678 | 18975 | Playground block details |
| `src/soc/Details.tsx` | 585 | 14215 | Main scene block details |
| `src/soc/ProceduralModels.tsx` | 504 | 17450 | Casing, PCB, Package, etc. |
| `src/soc/BlockArticle.tsx` | 183 | 6085 | In-3D floating article |
| `src/soc/Traffic.tsx` | 211 | 6484 | Data flow visualization |
| `src/soc/levelManager.ts` | 149 | 5329 | Camera levels + interpolation |
| `src/soc/quality.ts` | 10 | 242 | Quality context |
| `src/soc/shaders.ts` | 149 | 4677 | GLSL shaders |
| **TOTAL** | **~7,000** | **~285,000** | |

---

## Key Constants Reference

```
AMBER = "#e8a23a"
BG = "#030407" / "#08090e"
DIE_W = 22, DIE_D = 18
TOTAL_CHAPTERS = 5
TOTAL_BLOCKS = 17
TOTAL_COMPONENTS = 9
TOTAL_TRACKS = 9
TOTAL_ARTICLES = 10
BOOT_DELAY = 1400ms
SCROLL_THRESHOLD = 120px
SCROLL_COOLDOWN = 400ms
FPS_BENCHMARK_DURATION = 2000ms
FPS_THRESHOLD = 45
LOW_RAM_THRESHOLD = 4GB
```
