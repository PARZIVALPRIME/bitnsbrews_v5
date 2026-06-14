# Performance Baseline

Repeatable performance baseline for the graphics-heavy R3F/Vite site.

Always measure the production build, not the Vite dev server.

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

Open the preview URL that Vite prints. If the app is running in a container or remote VS Code environment, forward the preview port and measure the forwarded local URL.

## Run Metadata

- Date/time measured: `2026-06-14 15:43 IST`
- Tester: Codex automated local run
- Branch name: `perf-visual-quality-optimization`
- Commit hash: `5edfbdb7008f5431536990de3bd409b1700d9885`
- Preview command: `npm run preview -- --host 0.0.0.0`
- Production preview URL: `http://localhost:4173/`
- Network preview URL: `http://192.168.0.105:4173/`
- Preview server status during baseline: running, HTTP 200 from `http://localhost:4173/`
- Measurement environment:
  - OS/session: local Linux workspace
  - Browser automation: Playwright `1.60.0`, headless Chromium
  - WebGL/GPU caveat: automated run used headless/software rendering behavior and logged WebGL GPU stall warnings. The app auto-selected `QUALITY: LITE`, so the automated FPS/frame numbers are useful as repeatable environment baselines, not as real premium-GPU visual-performance numbers.
- Working tree state: dirty
- Uncommitted files present during measurement:
  - `src/soc/Particles.tsx`
  - `src/soc/Scene.tsx`
  - `src/soc/Traffic.tsx`
  - `vite.config.ts`
  - `OPTIMIZATION_AUDIT.md`
  - `PERFORMANCE_BASELINE.md`
  - `serve.mjs`

## Build Output

- Build command: `npm run build`
- Build result: passed
- Modules transformed: `632`
- Vite output: `dist/index.html  1,586.37 kB | gzip: 471.63 kB`
- Build time observed:
  - `npm run build`: `5.26s`
  - Repeat production-mode build check: `5.64s`
- Build size:
  - `dist/index.html` raw: `1,586,370 bytes`
  - Total `dist/` raw: `3,722,748 bytes`
- Gzip size:
  - `dist/index.html` gzip via `gzip -c dist/index.html | wc -c`: `470,819 bytes`
- Notes:
  - `vite-plugin-singlefile` inlined `index-D0LhsSbB.js` and `style-DOJMTxo0.css`.

## Lighthouse Desktop

Lighthouse was not measured in this environment.

- Performance score: `Not measured`
- FCP: `Not measured`
- LCP: `Not measured`
- TBT: `Not measured`
- CLS: `Not measured`
- Speed Index: `Not measured`
- Reason: Lighthouse CLI is not installed globally and `lighthouse` is not present in local package dependencies. I did not install new tooling for this baseline.

## Automated Browser Metrics

Collected with Playwright/CDP against the production preview URL. Values are from headless Chromium in this environment. Page error count was `0` for every scenario.

| Scenario | Quality | Duration | FPS Estimate | Worst Frame | Long Tasks | Long Task Total | Max Long Task | JS Heap Before | JS Heap After | Heap Delta |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Hero idle | `QUALITY: LITE` -> `QUALITY: LITE` | `5,369.7 ms` | `1.30 fps` | `966.6 ms` | `6` | `4,619 ms` | `959 ms` | `15,744,160 B` | `18,322,004 B` | `2,577,844 B` |
| Scroll chapter 1 -> 5 | `QUALITY: LITE` -> `QUALITY: LITE` | `10,204.2 ms` | `1.96 fps` | `866.6 ms` | `20` | `10,089 ms` | `853 ms` | `15,612,544 B` | `27,687,272 B` | `12,074,728 B` |
| Playground open | `QUALITY: LITE` -> `QUALITY: LITE` | `8,966.2 ms` | `1.00 fps` | `899.9 ms` | `8` | `4,963 ms` | `887 ms` | `15,607,300 B` | `19,030,232 B` | `3,422,932 B` |
| Playground traffic mode | `QUALITY: LITE` -> `QUALITY: LITE` | `14,141.3 ms` | `0.71 fps` | `4,133.2 ms` | `9` | `10,842 ms` | `4,103 ms` | `15,276,368 B` | `23,784,988 B` | `8,508,620 B` |

### Automated Run Notes

- Console warnings sampled:
  - `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`
  - `THREE.WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead.`
  - WebGL driver warnings: `GPU stall due to ReadPixels`
- Dynamic quality console logs reported very low measured FPS in headless mode, which explains the app's automatic `QUALITY: LITE` state during automation.
- Screenshots captured:
  - Hero idle: `/tmp/bitnsbrews-hero-idle.png`
  - Scroll chapter 1 -> 5: `/tmp/bitnsbrews-scroll-chapter-1-to-5.png`
- Screenshots not captured:
  - Playground open and playground traffic mode screenshots timed out while Playwright waited for fonts.
- Automated visual QA limitation:
  - The browser loaded the app without page errors, but real premium-quality visual inspection was not completed by this automated pass because it ran in headless Lite mode.

## Manual Metrics To Fill

Fill these in Chrome using the production preview URL, preferably on the same machine/browser/GPU each time.

### Lighthouse Desktop

- Performance score:
- FCP:
- LCP:
- TBT:
- CLS:
- Speed Index:
- Notes:

### Chrome Performance: Hero Idle

- URL/state:
- Browser/GPU:
- Quality mode:
- Recording duration:
- FPS estimate:
- Worst frame time:
- Long task count:
- JS heap before:
- JS heap after:
- Visual QA notes:

### Chrome Performance: Scroll Chapter 1 -> 5

- Start state:
- Interaction method:
- Recording duration:
- FPS estimate:
- Worst frame time:
- Long task count:
- JS heap before:
- JS heap after:
- Transition smoothness notes:
- Visual QA notes:

### Chrome Performance: Playground Open

- Start state:
- Interaction method:
- Recording duration:
- FPS estimate:
- Worst frame time:
- Long task count:
- JS heap before:
- JS heap after:
- Visual QA notes:

### Chrome Performance: Playground Traffic Mode

- Selected mode:
- Interaction method:
- Recording duration:
- FPS estimate:
- Worst frame time:
- Long task count:
- JS heap before:
- JS heap after:
- Traffic path/glow/label notes:
- Visual QA notes:

## Visual QA Checklist

- Hero datastream paths, colors, packet speed, and glow:
- Die/model geometry and material quality:
- Bloom, postprocessing, glass, and glow:
- Lighting and shadows:
- Particles:
- Labels and HTML overlays:
- Camera motion and parallax:
- Chapter transition settle:
- Playground traffic paths and pulse heads:
- Playground endpoint rings and bandwidth labels:
- Mobile/responsive behavior:

## Port Forwarding

The preview server is listening on `0.0.0.0:4173`.

- Local URL in this workspace: `http://localhost:4173/`
- Same-LAN URL printed by Vite: `http://192.168.0.105:4173/`
- Remote/container VS Code: forward TCP port `4173`, then open the forwarded localhost URL shown by VS Code. If port `4173` is already taken locally, use the forwarded port that VS Code assigns.

## Baseline Summary

- Overall automated baseline status: production build passed, preview served HTTP 200, Playwright/CDP scenarios completed with `0` page errors.
- Main measurement limitation: headless/software WebGL caused Lite quality and very low FPS, so manual real-browser metrics are still required for the optimization comparison that matters visually.
- Primary bottleneck signal from automation: long main-thread tasks during scroll and playground traffic interactions.
- Biggest regression risk to watch manually: preserving premium visuals while improving runtime smoothness in full-quality browser rendering.
