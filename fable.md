# Prompt for Fable / Mythos 5 (Claude)

Copy and paste the entire block below into your Claude chat to execute the frontend redesign:

```markdown
You are an expert frontend engineer and creative developer. We are going to execute a full frontend visual redesign for our System-on-Chip 3D explorer project: **bitnsbrews**.

Our target aesthetic is an **Engineering CAD Blueprint / Technical Datasheet**. We want to pivot away from generic "AI-ish/cyberpunk" dark landing pages (with neon glowing box-shadows, glassmorphic blur overlays, and cheap corner brackets) toward a highly precise, clean technical drawing look.

Here is the design mockup we are implementing:
- Background: A deep blueprint-blue/slate grid pattern with coordinate markers and thin architectural margins.
- Panels: Minimalist boxes styled as flat blueprint grid containers with thin white/light-gray borders (no glassmorphism blurs).
- Typography: Crisp, high-contrast text using `Inter` for headers, `JetBrains Mono` for all metrics/tables/counters, and `Source Serif 4` for clean editorial reading.
- No neon glows, text shadows, or generic cyberpunk corner brackets.

---

### ⚠️ IMPORTANT CONSTRAINTS — DO NOT CHANGE

1. **Keep the 3D SoC Model Intact:** The 3D coordinates, block sizes, positions, domain colors (purple GPU, red NPU, etc.), glow animations, and data traffic curves MUST REMAIN EXACTLY AS THEY ARE currently implemented in `src/soc/` and specified in `bitnbrews-3d-model-brief.md`.
2. **Keep the Content Intact:** Do not modify the existing tracks, metadata, or articles inside `src/articles.ts`, `src/chapters.ts`, `src/chapterArticles.tsx`, and `src/trackArticles.tsx`. All writing copy should remain exactly the same.
3. **No Structural 3D Changes:** We are ONLY redesigning the surrounding React HTML HUD overlays (headers, sidebars, metrics, catalog list, buttons, loading cover) and how overlays transition.

---

### Redesign Guidelines & Deliverables

#### 1. Blueprint Grid & CSS Styles (`src/index.css`)
- Replace the translucent panel blurs and glowing animations with flat, solid panels (`background: #0f1524`, border: `1px solid rgba(255, 255, 255, 0.1)`) matching the CAD blueprint mockup.
- Add an elegant blueprint grid background to the UI wrapper (e.g. using CSS background SVG grids or repeating line drawings).
- Refine the custom scrollbar and sliders to be ultra-thin and technical (no thick ambers or neon indicators).

#### 2. High-Performance Motion (`framer-motion`)
- Install and integrate `framer-motion` (or `motion` for React).
- Convert standard CSS transitions for the sidebars (tracks list, track details, bottom control bar, catalog cards) into `<motion.div>` structures.
- Use spring-based animations (`type: "spring", stiffness: 280, damping: 28`) for tactile panel entrances, drawer slide-outs, and list staggers.

#### 3. Dedicated Full-Page Article Reader Layout (`src/ArticleReader.tsx` & `src/AppUI.tsx`)
- When an article is opened, do not display it as a generic popup on top of the 3D canvas.
- Transitions should fade the article container in to occupy the **entire screen**, hiding the WebGL Canvas underneath (which saves GPU cycles while reading).
- Structure the reader like a premium editorial page with wide margins, clean borders, high-contrast serif paragraphs (`Source Serif 4`), and a prominent "← Back to die" exit button.
- Cleanly connect the reader to the AppUI routing state so transitions are seamless.

#### 4. Clean up HUD Overlays (`src/AppUI.tsx` & `src/ComponentPortal.tsx`)
- Replace all emoji icons with minimal SVG icons (already defined in `ComponentPortal.tsx` and tracks).
- Remove fake numbers and subscriber counts; keep labels structured like a professional engineering catalog.
- Clean up any old cyber-shimmer gradients, brackets, or decorative scanning sweep loops.
- Re-align the single-column catalog grid in Chapter 5 to look like a clean blueprint inventory index.
- Setup a simple, elegant text fade cover for the loading boot screen.

---

### Step-by-Step Execution Plan

1. **Install Dependencies:** `npm install framer-motion` (or verify package.json).
2. **Design Tokens & Grid Background:** Update `index.css` to define the blueprint colors and grid parameters.
3. **Redesign AppUI HUD & Sidebars:** Re-arrange the HTML overlay grids in `AppUI.tsx` to match the blueprint structure, replacing static animations with Framer Motion spring wrappers.
4. **Implement Full-Page Article transitions:** Modify `ArticleReader.tsx` and the mounting container in `AppUI.tsx` to handle full-page overlays cleanly.
5. **Polishing & Verification:** Run `npm run dev` and `npm run build` to confirm everything is responsive and compiles perfectly.
```
