# Visual Quality Optimization Audit

Date: 2026-06-14

Branch created for this work: `perf-visual-quality-optimization`

Base branch inspected: `feature/ui-enhancements`

No performance implementation changes were made in this pass. This file is the audit and proposed implementation plan only.

## Current Stack Summary

- App shell: React 19.2.6 with Vite 7.3.2 and TypeScript 5.9.3.
- Styling: Tailwind CSS 4 through `@tailwindcss/vite`, plus `src/index.css` design tokens and global animation utilities.
- 3D runtime: `three` 0.184.0, `@react-three/fiber` 9.6.1, `@react-three/drei` 10.7.7, `@react-three/postprocessing` 3.0.4, `postprocessing` 6.39.1.
- Main route: `src/main.tsx` -> `src/RootApp.tsx` -> `src/DesktopApp.tsx` -> `src/AppUI.tsx` + `src/soc/Scene.tsx`.
- 3D assets: primarily procedural meshes, shaders, particles, instanced details, bloom/vignette/SMAA, environment lightformers, contact shadows. No GLTF model files were found.
- Build packaging: `vite-plugin-singlefile` is enabled in `vite.config.ts`, so the existing `dist/index.html` inlines the app bundle into one HTML file.
- Public image assets:
  - `public/images/preetam.png`: 787,550 bytes, actually JPEG data despite `.png` extension, 1024x1024.
  - `public/images/articles/image1.png`: 847,641 bytes, PNG, 602x533.
  - `public/images/articles/image2.png`: 394,779 bytes, PNG, 555x408.
  - `public/images/articles/image3.png`: 51,793 bytes, PNG, 562x433.
  - `public/images/articles/image4.png`: 42,327 bytes, PNG, 602x291.
- Existing `dist/index.html`: 1,585,928 bytes raw, about 470,643 bytes gzip.

## Commands Run And Results

- `git status --short --branch`
  - Before branching: `feature/ui-enhancements` with pre-existing local changes: modified `vite.config.ts`, untracked `serve.mjs`.
  - After branching: `perf-visual-quality-optimization` with the same pre-existing changes, plus this audit file.
- `git branch --all --sort=-committerdate`
  - Local branches found: `feature/ui-enhancements`, `perf-visual-quality-optimization`.
  - Remote branch found: `origin/feature/ui-enhancements`.
- `git log --all --decorate --oneline --max-count=20`
  - Latest commit: `5edfbdb style: modernize UI, implement scroll-synced transitions and GPU particles`.
- `git switch -c perf/visual-quality-optimization`
  - Failed with a git ref creation error in this sandbox.
- `git switch -c perf-visual-quality-optimization`
  - Succeeded after elevated permission to write the git ref.
- `npm install`
  - Failed: `/bin/bash: line 1: npm: command not found`.
- `command -v node`, `command -v npm`, `command -v npx`, `command -v pnpm`, `command -v yarn`, `command -v bun`
  - All unavailable in this shell.
- `./node_modules/.bin/vite build`
  - Failed: `/usr/bin/env: 'node': No such file or directory`.
- `./node_modules/.bin/tsc --noEmit`
  - Failed: `/usr/bin/env: 'node': No such file or directory`.
- Lint
  - No `lint` script exists in `package.json`.
- Bundle/asset inspection commands:
  - `find dist -maxdepth 3 -type f -printf '%p %k KB\n'`
  - `wc -c dist/index.html public/images/...`
  - `gzip -c dist/index.html | wc -c`
  - `file public/images/... dist/index.html`
  - `rg --files`, `rg` for imports, render loops, Drei `Html`, image usage, and Three/R3F hot paths.

Build, lint, and typecheck are not verified yet because this environment has no Node runtime on PATH. The current source may still have typecheck issues once Node is available.

## Suspected Bottlenecks

### High Impact

1. Scene transition loop never stops after settling.
   - Evidence: `src/soc/Scene.tsx:631-642` schedules `requestAnimationFrame(ease)` unconditionally. Even when `setLevelFloat` snaps to `targetLevel`, the loop continues forever.
   - Cost: persistent React state updater calls and scene re-render pressure, especially bad while the rest of R3F is already doing continuous frame work.
   - Visual-safe fix: stop scheduling when the difference is below the snap threshold, or move `levelFloat` easing into R3F refs and only commit React state when a quantized visual boundary changes.

2. Camera controller allocates new vectors every frame.
   - Evidence: `src/soc/Scene.tsx:500-502` clones `targetParams.position` and allocates a fresh `THREE.Vector3` inside `useFrame`.
   - Cost: avoidable garbage collection in the hottest frame loop.
   - Visual-safe fix: use stable `useRef` temp vectors and `.copy().add()` without new allocations.

3. `Particles` keeps its frame callback registered even when it returns `null`.
   - Evidence: `src/soc/Particles.tsx:108-119` updates uniforms in `useFrame` before the component returns `null` when opacity is zero.
   - Cost: unnecessary per-frame work on the Hub level where particles are fully faded.
   - Visual-safe fix: either mount `<Particles>` only while visible from `Scene`, or guard the `useFrame` body when opacity is zero.

4. Eager import of the interactive playground.
   - Evidence: `src/AppUI.tsx:18` imports `PlaygroundOverlay` eagerly. `PlaygroundOverlay` then imports a second Canvas scene, `PlaygroundScene`, traffic tubes, labels, postprocessing, and detailed blocks.
   - Cost: likely increases initial parse/evaluate and main bundle size even though the playground opens only after user action.
   - Visual-safe fix: `React.lazy`/dynamic import for `PlaygroundOverlay`, plus lazy portals/readers where appropriate. This has the biggest network impact if the deployment can stop using mandatory single-file bundling.

5. Traffic tubes rebuild expensive geometry when vector prop identity changes.
   - Evidence: `src/soc/Traffic.tsx:193-200` creates fresh `Vector3` objects in render and passes them to `FlowTube`; `FlowTube` memoizes `TubeGeometry` on `[from, to, isMobile]` at `src/soc/Traffic.tsx:61-71`.
   - Cost: parent re-renders with equivalent numeric positions can still invalidate tube geometry.
   - Visual-safe fix: memoize path specs by primitive values or pass primitive coordinates, then build geometry only when actual endpoints change.

6. Playground ContactShadows likely renders continuously.
   - Evidence: `src/soc/PlaygroundScene.tsx:176-184` uses `ContactShadows` without `frames={1}` or a controlled invalidation strategy. The main scene already uses `frames={1}` at `src/soc/Scene.tsx:747-756`.
   - Cost: hidden repeated shadow work while the playground is open.
   - Visual-safe fix: update contact shadows during explode/camera interaction and settle them afterward. Do not freeze them blindly if it causes visible mismatch during interaction.

### Medium Impact

1. Rainbow datastreams allocate during frame/render.
   - Evidence: `src/soc/Scene.tsx:305` calls `curve.getPointAt(tVal)` without an optional target vector; `src/soc/Scene.tsx:319-323` builds a new `Float32Array` from `flatMap` inside render.
   - Cost: avoidable allocation during the hero visual and during transition renders.
   - Visual-safe fix: precompute path position arrays in `useMemo` and use reusable per-packet vectors for `getPointAt`.

2. Many `useFrame` callbacks are registered even after internal early-outs.
   - Evidence: each `SocBlock` has a `useFrame` loop at `src/soc/SocBlock.tsx:88-135`. The code has a good settled early-return, but the callback still runs once per block per frame.
   - Cost: low per callback, but multiplied across 17 blocks and a second playground scene.
   - Visual-safe fix: keep the current visual behavior, but consider centralizing some shared animation state or using invalidation only for block systems after the main always-animated effects are isolated.

3. Drei `Html` overlays are controlled, but still expensive.
   - Evidence: block labels are mounted via `Html` at `src/soc/SocBlock.tsx:304-355`; traffic bandwidth labels use `Html` at `src/soc/Traffic.tsx:139-154`.
   - Cost: DOM overlay projection and style work, especially in playground label-heavy views.
   - Current good news: labels are gated to major blocks/selected state and `BlockArticle` is not imported anywhere.
   - Visual-safe fix: keep labels visually identical, but memoize label content, avoid remount churn, and confirm only visible labels mount.

4. App UI writes DOM styles every frame through the camera loop.
   - Evidence: `src/AppUI.tsx:96-145` updates opacity, transform, and pointer events on multiple refs; `src/soc/Scene.tsx:515-517` calls that on every frame.
   - Cost: mostly composited transforms/opacity, but still a main-thread style mutation path.
   - Visual-safe fix: skip writes when rounded values have not changed, or batch through a single `requestAnimationFrame` owned by the UI layer.

5. Search and article overlays do synchronous list filtering/rendering.
   - Evidence: `src/components/SearchPalette.tsx` filters `ARTICLES` and `TRACKS` on each query render; `ArticleReader` updates scroll progress state on every scroll event.
   - Cost: not a main landing bottleneck, but can affect overlay smoothness.
   - Visual-safe fix: memoize search results by query, and throttle scroll progress updates with a local RAF.

6. Duplicate or dead code should be measured before removal.
   - Evidence: `src/App.tsx`, `src/ArticlePage.tsx`, `src/soc/SceneMobile.tsx`, `src/soc/BlockArticle.tsx`, and `src/soc/Details.tsx` do not appear in the active import graph.
   - Cost: likely tree-shaken, but if single-file output includes them due side effects or conservative bundling, they increase parse size.
   - Visual-safe fix: verify with a real bundle analyzer before deleting. Removal is a cleanup, not the first optimization.

### Low Impact

1. Two mousemove listeners track similar normalized pointer values.
   - Evidence: `src/AppUI.tsx:87-94` and `src/soc/Scene.tsx:469-476`.
   - Visual-safe fix: share pointer data through one listener or R3F pointer state.

2. Existing `console.log` in the first FPS benchmark.
   - Evidence: `src/AppUI.tsx:204`.
   - Visual-safe fix: remove or gate in dev only.

3. Public images can be delivered more efficiently without quality loss.
   - Evidence: public images total about 2.1 MB. `preetam.png` is actually JPEG data with a `.png` extension.
   - Visual-safe fix: use correct extensions/MIME, add responsive variants and modern encodings while keeping original quality available. Do not overwrite originals with lossy compression.

## Safe Optimizations That Preserve Visual Quality

- Stop the `Scene` RAF easing loop once `levelFloat` has settled.
- Keep all camera motion, drift, parallax, bloom, environment lighting, shadows, particles, labels, glass/panel styling, and shader effects intact.
- Replace per-frame allocations with reusable refs:
  - camera temp vectors
  - `Traffic` pulse positions
  - `RainbowDatastreams` packet positions
  - precomputed Float32Array path buffers
- Lazy-load closed overlays:
  - `PlaygroundOverlay`
  - `ArticleReader`
  - `ComponentPortal`
  - `TrackPage`
  - `SearchPalette`
- Add an environment switch for single-file vs split production builds if deployment allows it:
  - keep single-file for the use case that needs a self-contained HTML artifact
  - use normal hashed chunks for web deployment so Three/Drei/postprocessing can cache and load in parallel
- Memoize or stabilize primitive props for traffic tubes so identical endpoints do not regenerate `TubeGeometry`.
- Mount particle systems only while visually contributing, or guard their frame callback.
- Throttle DOM scroll progress updates in article/hub overlays with RAF.
- Preserve image quality by adding alternate delivery formats and `srcset`/`sizes`, not by downsampling or recompressing originals destructively.
- Add build/typecheck scripts once Node is available:
  - `typecheck`: `tsc --noEmit`
  - optional `lint` only after choosing an ESLint setup

## Risky Optimizations To Avoid For Now

- Do not lower texture quality, geometry segment counts, particle counts, shader precision, material quality, environment quality, bloom quality, lighting quality, or camera animation quality as a first pass.
- Do not remove bloom, vignette, SMAA, environment lightformers, contact shadows, labels, glass/panel polish, glow, or hover/selection animations.
- Do not force permanent low DPR or mobile quality for all users.
- Do not switch the main Canvas to `frameloop="demand"` until continuous effects are explicitly separated or invalidated; camera drift, particles, bloom, and material pulses currently expect continuous frames.
- Do not replace Drei `Html` labels with sprites or canvas text until pixel-matched screenshots prove the premium label treatment is preserved.
- Do not delete apparently unused files until a successful production build and bundle analysis confirms they are not shipped.
- Do not destructively recompress images. Add variants alongside originals.
- Do not remove React StrictMode as a performance fix; it mainly affects development behavior, not production runtime.

## Recommended Implementation Order

1. Establish a working verification baseline.
   - Install or expose Node/npm in the environment.
   - Run `npm install`, `npm run build`, and `npx tsc --noEmit`.
   - Add a typecheck script if approved.
   - Capture desktop and mobile screenshots before each visual-sensitive change.
   - Expected impact: high confidence, not runtime impact.

2. Fix non-visual hot-loop waste first.
   - Stop the `Scene` RAF loop when settled.
   - Guard or conditionally mount `Particles` when fully transparent.
   - Remove per-frame vector allocations in `CameraController`.
   - Expected impact: high.

3. Stabilize traffic and datastream allocations.
   - Precompute RainbowDatastream line buffers.
   - Reuse `getPointAt` target vectors.
   - Stabilize `TrafficNetwork` endpoints so tube geometry rebuilds only when numeric endpoints change.
   - Expected impact: medium to high, especially when playground traffic is active.

4. Lazy-load heavy overlays.
   - Start with `PlaygroundOverlay`, because it pulls in the second 3D scene.
   - Then lazy-load reader/search/portal overlays.
   - If single-file output remains mandatory, measure whether lazy imports still reduce parse/eval cost. If split builds are allowed, this becomes a high-impact load-speed win.
   - Expected impact: high for split deployment, medium/low for strict single-file deployment.

5. Tune playground-only costs without changing appearance.
   - Audit `ContactShadows` update strategy while preserving interactive shadow correctness.
   - Reuse geometry/material patterns already used in the main scene.
   - Expected impact: medium.

6. UI overlay smoothness.
   - RAF-throttle article scroll progress.
   - Memoize search results.
   - Skip redundant DOM style writes when values have not changed enough to matter visually.
   - Expected impact: low to medium.

7. Production delivery improvements.
   - Make single-file output optional if the website can deploy regular hashed assets.
   - Add manual chunking only after measuring the bundle.
   - Add responsive image variants with no destructive quality loss.
   - Expected impact: medium to high for first load, depending on deployment constraints.

8. Final verification.
   - Run build/typecheck.
   - Compare screenshots for desktop/mobile and key states:
     - chapter 1 hero
     - chapter 3 labels/detail panel
     - chapter 4 raised library blocks
     - hub overlay
     - playground open/close, assembled/exploded, labels on/off, traffic modes
   - Use browser performance profiles to confirm frame time and GC improvements.
   - Expected impact: quality assurance.

## Expected Impact Summary

| Opportunity | Impact | Risk |
| --- | --- | --- |
| Stop settled `Scene` RAF loop | High | Low |
| Reuse camera/temp vectors in frame loops | High | Low |
| Guard/conditional-mount invisible particles | High | Low |
| Lazy-load `PlaygroundOverlay` and modal surfaces | High if split builds are allowed; medium/low with strict single-file | Low |
| Stabilize `TrafficNetwork` geometry creation | Medium to high in playground | Low |
| Precompute RainbowDatastream buffers and reuse vectors | Medium | Low |
| Tune playground `ContactShadows` updates | Medium | Medium, requires visual verification |
| RAF-throttle article/hub UI scroll state | Low to medium | Low |
| Responsive image variants and correct image extension/MIME | Low to medium | Low |
| Remove unused source files | Low until bundle analyzer proves they ship | Medium |

## Notes Before Implementation

- The branch was created successfully as `perf-visual-quality-optimization`.
- `vite.config.ts` and `serve.mjs` were already dirty/untracked before this audit; they were not changed by this audit.
- The current Vite config has a pre-existing local edit adding `server.watch` options.
- TypeScript may report issues once Node is available. Examples to check include unused state in `AppUI` and the `SceneProps` type in `AppUI` not listing `uiTransitionRef` even though it is passed to `SceneEl`.
- The safest first code change is the settled RAF loop fix, because it preserves every visual parameter and only stops unnecessary work after the camera transition has reached its target.

## Pass 1 Changes Implemented

Date: 2026-06-14

Files changed in Pass 1:

- `src/soc/Scene.tsx`
- `src/soc/Particles.tsx`
- `src/soc/Traffic.tsx`
- `OPTIMIZATION_AUDIT.md`

What was optimized:

- Fixed the settled scene transition loop in `src/soc/Scene.tsx`.
  - The RAF loop now stops once the internal eased `levelFloat` reaches `targetLevel`.
  - The existing easing coefficient and quantized visual state are preserved.
  - The loop now keeps an internal precise value so quantization cannot stall before the target.
- Removed per-frame camera vector allocations in `CameraController`.
  - Reused stable `THREE.Vector3` refs for camera drift and final camera position.
  - Preserved the existing camera path, parallax, drift frequencies, easing factors, FOV easing, and `lookAt` behavior.
- Prevented invisible particles from doing uniform update work.
  - `Particles` now skips `useFrame` shader uniform writes when the same existing visibility threshold returns `null`.
  - Particle count, shader code, additive blending, size distribution, and visible behavior were not changed.
- Reduced datastream allocation waste.
  - Moved the hero datastream color table out of render.
  - Precomputed static line position buffers once per datastream path instead of rebuilding `Float32Array` buffers during render.
  - Reused a temp vector for moving packet positions instead of allocating through `curve.getPointAt`.
- Reduced traffic allocation waste.
  - Added a block lookup map instead of repeated `BLOCKS.find` calls per traffic render.
  - Passed primitive endpoint coordinates into `FlowTube` so tube geometry memoization depends on actual coordinates, not fresh `Vector3` object identity.
  - Reused a temp vector for traffic pulse-head positions instead of allocating through `curve.getPointAt`.

Visuals intentionally preserved:

- No change to model geometry detail, tube segment counts, particle count, material settings, shader code, bloom, vignette, SMAA, lighting, environment lightformers, contact shadows, DPR, camera choreography, label rendering, glass/panel styling, colors, glow intensity, traffic speeds, datastream speeds, or postprocessing.
- No lazy-loading changes were implemented in this pass.
- No Vite single-file behavior changes were implemented in this pass.
- No shadow, bloom, DPR, model-quality, texture, or image-quality tuning was implemented in this pass.

Verification command results:

- `git status --short --branch`
  - Confirmed branch: `perf-visual-quality-optimization`.
  - Pre-existing dirty files remained: modified `vite.config.ts`, untracked `serve.mjs`.
  - Pass 1 changed/added: `src/soc/Scene.tsx`, `src/soc/Particles.tsx`, `src/soc/Traffic.tsx`, `OPTIMIZATION_AUDIT.md`.
- `npm install`
  - Failed before code changes: `/bin/bash: line 1: npm: command not found`.
- `npm run build`
  - Failed before code changes: `/bin/bash: line 1: npm: command not found`.
  - Failed after code changes: `/bin/bash: line 1: npm: command not found`.
- `npx tsc --noEmit`
  - Failed before code changes: `/bin/bash: line 1: npx: command not found`.
  - Failed after code changes: `/bin/bash: line 1: npx: command not found`.
- `node --version`
  - Failed: `/bin/bash: line 1: node: command not found`.
- `npm --version`
  - Failed: `/bin/bash: line 1: npm: command not found`.
- `git diff --check`
  - Passed with no whitespace errors.

Manual visual verification still needed:

- Chapter transition 1 -> 2, 2 -> 3, 3 -> 4, and 4 -> 5 should be checked for identical camera feel plus proper final settle.
- Hero rainbow datastreams should be checked for unchanged paths, colors, line opacity, packet speed, and glow.
- Hub level should be checked to confirm particles disappear exactly as before, while no invisible particle uniform work continues.
- Playground traffic modes should be checked for unchanged tube paths, pulse-head motion, endpoint rings, bandwidth labels, and glow.
