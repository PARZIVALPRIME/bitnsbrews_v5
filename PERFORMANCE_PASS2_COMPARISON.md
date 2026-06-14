# Performance Pass 2 Comparison

Comparison report for Pass 2 lazy overlay loading.

Goal: compare Pass 1 commit against the Pass 2 working tree using production builds, without changing graphics quality.

## Compared States

| Role | State | Commit / tree | Notes |
| --- | --- | --- | --- |
| Before | Pass 1 committed baseline | `047cd868120ee27360a1558a1a0e9f2e24a7ec4e` | Pass 1 safe frame-loop/allocation work committed. |
| After | Pass 2 working tree | `perf-visual-quality-optimization` with uncommitted `src/AppUI.tsx`, `OPTIMIZATION_AUDIT.md`, and `PERFORMANCE_PASS2_COMPARISON.md` changes | Lazy overlay loading implemented; not committed. |

Working-tree caveat: `vite.config.ts` and `serve.mjs` remain pre-existing dirty/untracked files. They were not changed for Pass 2 and should not be included in a Pass 2 commit unless explicitly approved.

## Build Metrics

Both measurements use production build output from:

```bash
npm run build
```

| State | Build result | Modules transformed | `dist/index.html` raw | `dist/index.html` gzip | Total `dist/` raw | Output files |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Pass 1 commit | Passed | `632` | `1,586,370 B` | `470,819 B` | `3,722,748 B` | `dist/index.html`, `dist/images/preetam.png` |
| Pass 2 working tree | Passed | `632` | `1,590,768 B` | `471,765 B` | `3,727,146 B` | `dist/index.html`, `dist/images/preetam.png` |

Delta after Pass 2:

- `dist/index.html` raw: `+4,398 B`
- `dist/index.html` gzip: `+946 B`
- Total `dist/` raw: `+4,398 B`

## Chunking Result

Dynamic imports were added in source code for:

- `PlaygroundOverlay`
- `ArticleReader`
- `ComponentPortal`
- `TrackPage`
- `SearchPalette`

Under the current `vite-plugin-singlefile` configuration:

- Separate lazy chunks were not emitted as separate files in `dist/`.
- Vite reported a single JavaScript payload being inlined: `index-C3TNRS7X.js`.
- Vite reported a single CSS payload being inlined: `style-BPXlrPUF.css`.
- The final `dist/` contains no external overlay chunk files.
- The built `index.html` still contains overlay code, including playground strings, because the single-file plugin folds/inlines the JavaScript payload.

Expected impact under current single-file output:

- Initial transfer size: no improvement; it increased slightly due to lazy wrapper/fallback code.
- Browser network waterfall: no improvement, because everything remains in `index.html`.
- Initial JavaScript parse/evaluation: not conclusively measured. Any benefit depends on whether the inlined dynamic modules avoid executing overlay module bodies before first open.
- User-visible quality: expected unchanged after lazy modules resolve.

Expected impact if regular split deployment is later enabled:

- Initial transfer size should improve because the heavy playground scene and secondary overlays can move out of the first route payload.
- Initial parse/eval work should improve because closed overlays will not evaluate until opened.
- `PlaygroundOverlay` should be the highest-impact split candidate because it pulls in a second R3F/Three scene.
- Secondary overlay splits should help less individually, but still keep article/search/track UI code out of the initial path.

## Runtime Metrics

No new runtime metrics were collected for Pass 2.

| Scenario | Metric status | Reason |
| --- | --- | --- |
| Hero idle | Not measured | Previous headless WebGL automation produced unreliable FPS and forced `QUALITY: LITE`; manual Chrome/GPU profiling is needed. |
| Initial landing load | Not measured | Lighthouse and reliable real-browser profiling were not run in this pass. |
| Playground first open | Not measured | Needs manual Chrome timing to observe lazy fallback and loaded overlay behavior. |
| Search first open | Not measured | Needs manual Chrome timing to confirm no visible loading flash. |
| Article/track/component overlays | Not measured | Needs manual interaction QA in a real browser. |

## Verification Results

| Command | Result | Notes |
| --- | --- | --- |
| `npm run build` | Passed | `dist/index.html 1,590.77 kB | gzip: 472.70 kB`; `632` modules transformed. |
| `npx tsc --noEmit` | Failed | Existing project type errors remain; no new lazy-import prop/type errors appeared. |
| `git diff --check` | Passed | No whitespace errors. |

Typecheck failures observed:

- Unused symbols in `src/AppUI.tsx`: `getTrackArticle`, `selectedTrack`, `email`, `subscribed`, `submitting`, `setSubmitting`, `autoDowngraded`, `isVisible`.
- `src/AppUI.tsx`: local `SceneProps` does not include `uiTransitionRef`.
- `src/AppUI.tsx`: `Block.label` does not exist on `Block`.
- `src/ArticleReader.tsx`: duplicate `Article` identifier.
- Unused imports in `src/ComponentPortal.tsx`, `src/components/Footer.tsx`, and `src/components/TrackIcon.tsx`.

## Manual QA Checklist

- Hero loads and looks unchanged.
- Die/model quality unchanged.
- Initial landing visual unchanged.
- Playground opens correctly.
- Playground graphics, traffic, labels, glow, shadows, and model quality unchanged.
- Article reader opens correctly.
- Search palette opens correctly.
- Component portal/track page behavior unchanged.
- No blank ugly loading flash.
- Desktop viewport sanity check.
- Mobile viewport sanity check.

## Pass 2 Verdict

Implementation status: complete and build-passing, not committed.

Performance verdict under current single-file output: limited expected benefit for download size, because dynamic imports are folded into `index.html`.

Architecture verdict: useful future-facing change. If single-file output is later relaxed, this pass should become a high-impact first-load optimization without reducing graphics quality.
