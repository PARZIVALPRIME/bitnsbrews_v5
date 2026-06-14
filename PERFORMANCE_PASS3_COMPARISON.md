# Performance Pass 3 Comparison

Comparison report for optional split builds.

Goal: keep the existing single-file deployment path while adding a normal chunked production build so Pass 2 lazy overlays can reduce initial loading work.

## Compared States

| State | Build path | Notes |
| --- | --- | --- |
| Pass 1 single-file | Historical `npm run build` output after Pass 1 commit `047cd868120ee27360a1558a1a0e9f2e24a7ec4e` | No lazy overlay loading yet. |
| Pass 2 lazy overlays under single-file | `npm run build:single` after Pass 2 lazy overlay changes | Lazy imports exist in source, but are folded into one output file by `vite-plugin-singlefile`. |
| Pass 3 split build | `npm run build:split` after Pass 3 config/scripts | Normal hashed JS/CSS chunks are emitted. Lazy overlays become separate files. |

## Scripts Added

`package.json` now contains:

```json
{
  "build": "npm run build:single",
  "build:single": "SINGLE_FILE=true vite build",
  "build:split": "SINGLE_FILE=false vite build"
}
```

`build` remains mapped to the current single-file behavior.

## Build Size Summary

| State | `dist/index.html` raw | `dist/index.html` gzip | Total `dist/` raw | Notes |
| --- | ---: | ---: | ---: | --- |
| Pass 1 single-file | `1,586,370 B` | `470,819 B` | `3,722,748 B` | Current deployment style before lazy overlays. |
| Pass 2 single-file | `1,590,768 B` | `471,765 B` | `3,727,146 B` | Lazy wrappers/fallbacks added, but still single-file. |
| Pass 3 split | `978 B` | `510 B` | `3,711,732 B` | JS/CSS emitted as separate hashed assets. |

Split initial route payload, based on `dist/index.html` references:

| Initial file | Raw | Gzip |
| --- | ---: | ---: |
| `dist/index.html` | `978 B` | `510 B` |
| `dist/assets/index-BPXlrPUF.css` | `69,827 B` | `11,416 B` |
| `dist/assets/index-cs5qjy-W.js` | `116,860 B` | `37,778 B` |
| `dist/assets/react-vendor-Cs9zSfOU.js` | `192,532 B` | `60,171 B` |
| `dist/assets/three-vendor-B59sHfnY.js` | `1,157,240 B` | `346,343 B` |
| Initial total | `1,537,437 B` | `456,218 B` |

The initial split payload is still large because the landing hero uses R3F/Three, so `three-vendor` is required up front.

## Split Chunk Inventory

| File | Raw | Gzip | Initial route? |
| --- | ---: | ---: | --- |
| `dist/assets/index-cs5qjy-W.js` | `116,860 B` | `37,778 B` | Yes |
| `dist/assets/react-vendor-Cs9zSfOU.js` | `192,532 B` | `60,171 B` | Yes, modulepreload |
| `dist/assets/three-vendor-B59sHfnY.js` | `1,157,240 B` | `346,343 B` | Yes, modulepreload |
| `dist/assets/index-BPXlrPUF.css` | `69,827 B` | `11,416 B` | Yes |
| `dist/assets/PlaygroundOverlay-CkyVUY_c.js` | `22,760 B` | `7,090 B` | No, lazy |
| `dist/assets/ArticleReader-CUGMtKRT.js` | `10,265 B` | `3,385 B` | No, lazy |
| `dist/assets/ComponentPortal-DP_MyipG.js` | `8,880 B` | `2,497 B` | No, lazy |
| `dist/assets/TrackPage-C9QenvZp.js` | `5,007 B` | `1,932 B` | No, lazy |
| `dist/assets/SearchPalette-CvdjJOpz.js` | `3,293 B` | `1,313 B` | No, lazy |

Image files are unchanged in quality and remain emitted as assets.

## Lazy Overlay Result

- Lazy overlay chunks are now separate in the split build.
- `PlaygroundOverlay` is separated from the initial route payload as `dist/assets/PlaygroundOverlay-CkyVUY_c.js`.
- `SearchPalette`, `ArticleReader`, `TrackPage`, and `ComponentPortal` are also separate lazy chunks.
- `dist/index.html` references only the initial app script, React vendor, Three vendor, and CSS.
- `dist/index.html` does not preload the overlay chunks.

## Expected Impact

Under current single-file deployment:

- `npm run build` and `npm run build:single` preserve the existing single-file path.
- Lazy overlays do not reduce first download size because the single-file plugin folds everything into `index.html`.
- The single-file output remains available for environments that need it.

Under split deployment:

- Closed overlay code is removed from the initial route payload.
- Playground overlay code is loaded only when the user opens the interactive die.
- Search, article reader, track page, and component portal code are loaded only when opened.
- Initial route still needs Three/R3F because the premium landing scene uses them.

## Verification

| Command | Result | Notes |
| --- | --- | --- |
| `npm run build:single` | Passed | Single-file plugin active; output remained one inlined `index.html`. |
| `npm run build:split` | Passed | Split chunks emitted. |
| `git diff --check` | Passed | No whitespace errors. |
| Split preview | Running | `http://localhost:4175/`, HTTP 200. |

Typecheck was not rerun in Pass 3. The known project typecheck failures from Pass 2 remain documented in `PERFORMANCE_PASS2_COMPARISON.md`.

## Manual QA Checklist

- Hero loads unchanged.
- Die/model quality unchanged.
- Initial landing visual unchanged.
- Playground opens correctly after lazy chunk load.
- No ugly blank flash.
- Search opens correctly.
- Article reader opens correctly.
- Track page and component portal open correctly.
- Desktop viewport sanity check.
- Mobile viewport sanity check.

## Pass 3 Verdict

Pass 3 makes Pass 2 meaningful for real web deployment while preserving the existing single-file build path.

Recommended next step before committing Pass 2 and Pass 3: manual QA the split preview at `http://localhost:4175/`, especially first-open behavior for Playground and Search.
