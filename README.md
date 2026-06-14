# Bits'nBrews Architecture Explorer

An interactive, immersive 3D semiconductor SoC (System-on-Chip) explorer. Walk through physical layers of hardware design—from the outer laptop chassis down to the microscopic pipeline stages of a CPU—with an automated spotlight narrative and an interactive co-spatial silicon journal.

---

## 🌟 Key Features

1. **10-Chapter Hardware Narrative**
   - Glides sequentially through a detailed narrative arc: from laptop casing, MCM organic substrate, bare silicon die floorplan, down to individual processing blocks (CPU, GPU, NPU, Modem, Media Pipeline, Memory/Fabric, and Instruction Pipelines).
2. **Dynamic Block Spotlight & Explode Animations**
   - Primary chip blocks lift up (`Y-axis` offset) and glow dynamically when they are the focus of a chapter, while neighboring blocks dim automatically.
3. **Automated Close-up Camera Paths**
   - Implements precision target coordinates above each block, offering a clear top-down perspective to easily read labels and articles.
4. **Interactive Co-Spatial 3D Silicon Journal**
   - Renders HTML elements inside the WebGL context using Drei's `<Html transform>`.
   - Offers **Read Mode** (with custom markdown parsing) and **Edit Mode** (allowing notes/text updates) that persist locally in browser storage.
5. **Responsive Premium UI**
   - Clean, modern HUD with glowing SVG circuit trace background animations, glassmorphic overlays, and indicators.

---

## 🛠️ Technology Stack

* **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
* **3D Library:** Three.js (via React Three Fiber & `@react-three/drei`), loaded client-only
* **Content:** MDX articles in `/content/articles` (frontmatter + embedded React visualizers)
* **Styling:** Tailwind CSS v4 (via `@tailwindcss/postcss`) + custom CSS variables

The immersive 3D experience is the landing page (`/`). Long-form articles are
**real, statically-generated, SEO-indexable pages** under `/articles/<slug>`.

---

## 📂 Project Structure

```
bitsnbrews/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout: fonts, global metadata
│   ├── page.tsx                  # Home → loads the 3D experience (client-only)
│   ├── globals.css               # Global styles + design tokens (Tailwind v4)
│   ├── articles/
│   │   ├── page.tsx              # Article index
│   │   └── [slug]/page.tsx       # SSG article page (renders MDX + metadata + JSON-LD)
│   ├── tracks/[track]/page.tsx   # Per-track landing pages
│   ├── sitemap.ts / robots.ts    # SEO
├── content/articles/*.mdx        # The articles themselves (prose + <Visualizers/>)
├── src/
│   ├── ExperienceLoader.tsx      # Dynamically imports the 3D app with ssr:false
│   ├── RootApp.tsx → AppUI.tsx   # The 3D experience UI (unchanged from the SPA)
│   ├── soc/                      # 3D scene system (Scene, blocks, shaders, data…)
│   ├── lib/articles.ts           # Reads MDX frontmatter + builds tables of contents
│   ├── lib/site.ts               # Site URL/name — set your domain here
│   └── components/
│       ├── mdx/                  # Styled MDX elements + editorial blocks (Callout, Challenge…)
│       ├── visualizers/          # Custom per-article interactive visualizers
│       └── article/              # Reading progress bar + scrollspy TOC
```

### Authoring a new article

1. Add `content/articles/<slug>.mdx` with frontmatter (`title`, `description`,
   `author`, `date`, `track`, `trackNo`, `readTime`, `published`).
2. Write the prose in Markdown. Use editorial blocks like `<Challenge n={1}>…</Challenge>`
   or `<Defs><Def term="…">…</Def></Defs>`.
3. For a custom visual, build a component in `src/components/visualizers/`, register
   it in `src/components/visualizers/index.ts`, then drop `<YourVisualizer />` into the MDX.

---

## 🚀 Getting Started

### Prerequisites
Node.js v18.18+ (v20+ recommended).

### Install & run
```bash
npm install
npm run dev        # http://localhost:3000
```

### Build for production
```bash
npm run build      # type-checks + statically generates all pages into .next/
npm run start      # serve the production build locally
```

Deploys cleanly to **Vercel** (recommended) or any Next.js host. Set your real
domain in `src/lib/site.ts` before going live.

---

## 📄 License
This project is open-source. Feel free to use, modify, and distribute it.
