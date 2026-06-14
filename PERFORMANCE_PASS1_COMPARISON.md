# Performance Pass 1 Comparison

Comparison report for Pass 1 safe optimizations.

Goal: compare the exact Pass 1 target areas without graphics compromise.

## Branches Compared

| Role | Branch | Commit / state | Preview URL |
| --- | --- | --- | --- |
| Before | `feature/ui-enhancements` | `5edfbdb7008f5431536990de3bd409b1700d9885` from temporary worktree `/tmp/bitnsbrews-feature-ui-pass1` | `http://localhost:4174/` |
| After | `perf-visual-quality-optimization` | `5edfbdb7008f5431536990de3bd409b1700d9885` plus uncommitted Pass 1 changes | `http://localhost:4173/` |

After-working-tree note: the measured after branch also had the existing dirty `vite.config.ts` change that was already present before Pass 1. The Pass 1 source changes under review are `src/soc/Scene.tsx`, `src/soc/Particles.tsx`, and `src/soc/Traffic.tsx`.

Both previews were served from production builds with Vite preview:

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

The comparison used separate ports so both production builds could run at the same time:

- After: `npm run preview -- --host 0.0.0.0 --port 4173`
- Before: `npm run preview -- --host 0.0.0.0 --port 4174`

Both preview URLs returned HTTP 200 during measurement.

## Valid Build Metrics

These are valid production-build metrics.

| Branch | Build result | Modules | Build time | `dist/index.html` raw | `dist/index.html` gzip | Total `dist/` raw |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `feature/ui-enhancements` | Passed | `632` | `5.83s` | `1,585,928 B` | `470,643 B` | `3,722,306 B` |
| `perf-visual-quality-optimization` | Passed | `632` | `5.28s` | `1,586,370 B` | `470,819 B` | `3,722,748 B` |

Build-size delta after Pass 1:

- `dist/index.html`: `+442 B` raw, `+176 B` gzip
- Total `dist/`: `+442 B`

## Automation Reliability

The browser measurements below were collected with Python Playwright `1.60.0`, headless Chromium, and SwiftShader/software WebGL behavior. The app auto-selected `QUALITY: LITE` in every measured scenario and logged WebGL GPU-stall warnings.

These runtime numbers are automation-only. They are useful as a smoke comparison for page errors, rough scripting deltas, long-task behavior, and heap movement in this environment. They are not reliable full-quality GPU FPS numbers and should not be used as the final visual-performance verdict.

GC spikes were not measured because this Chromium run did not expose `PerformanceObserver` `gc` entries.

## Scenario 1: Hero Idle For 10 Seconds

| Branch | Preview URL | Quality mode | FPS estimate | Worst frame time | Long task count | Total scripting time | JS heap before | JS heap after | Heap delta | GC spikes | Visual notes |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `feature/ui-enhancements` | `http://localhost:4174/` | `QUALITY: LITE` | `2.29 fps` automation-only | `683.3 ms` | `24` | `125.8 ms` | `19,951,220 B` | `19,830,432 B` | `-120,788 B` | Not measured | Hero loaded with no page errors; headless Lite only. |
| `perf-visual-quality-optimization` | `http://localhost:4173/` | `QUALITY: LITE` | `2.16 fps` automation-only | `683.4 ms` | `24` | `113.1 ms` | `14,917,428 B` | `22,402,024 B` | `+7,484,596 B` | Not measured | Hero loaded with no page errors; headless Lite only. |

Readout:

- Total scripting time improved in automation: `125.8 ms -> 113.1 ms`.
- FPS and worst-frame readings are effectively noise under headless software WebGL.
- No automated page errors were observed.

## Scenario 2: Scroll Chapter 1 -> 5, Then Wait 5 Seconds

| Branch | Preview URL | Quality mode | FPS estimate | Worst frame time | Long task count | Total scripting time | JS heap before | JS heap after | Heap delta | GC spikes | Visual notes |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `feature/ui-enhancements` | `http://localhost:4174/` | `QUALITY: LITE` | `2.06 fps` automation-only | `1,116.7 ms` | `29` | `420.9 ms` | `20,104,400 B` | `19,660,780 B` | `-443,620 B` | Not measured | Automation reached `CHAPTER 05`; no manual full-quality smoothness QA. |
| `perf-visual-quality-optimization` | `http://localhost:4173/` | `QUALITY: LITE` | `2.05 fps` automation-only | `933.3 ms` | `28` | `381.9 ms` | `19,960,000 B` | `23,529,072 B` | `+3,569,072 B` | Not measured | Automation reached `CHAPTER 05`; no manual full-quality smoothness QA. |

Readout:

- This is the clearest automation improvement.
- Total scripting time improved: `420.9 ms -> 381.9 ms`.
- Worst frame improved in this run: `1,116.7 ms -> 933.3 ms`.
- Long task count improved slightly: `29 -> 28`.
- Full-quality Chrome scroll smoothness still needs manual verification.

## Scenario 3: Hub Level Idle For 10 Seconds After Particles Disappear

| Branch | Preview URL | Quality mode | FPS estimate | Worst frame time | Long task count | Total scripting time | JS heap before | JS heap after | Heap delta | GC spikes | Visual notes |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `feature/ui-enhancements` | `http://localhost:4174/` | `QUALITY: LITE` | `2.94 fps` automation-only | `400.0 ms` | `32` | `123.8 ms` | `23,613,616 B` | `29,129,008 B` | `+5,515,392 B` | Not measured | Automation reached hub and waited before measuring; manual particle fade check required. |
| `perf-visual-quality-optimization` | `http://localhost:4173/` | `QUALITY: LITE` | `2.93 fps` automation-only | `400.0 ms` | `32` | `124.7 ms` | `29,792,140 B` | `25,492,444 B` | `-4,299,696 B` | Not measured | Automation reached hub and waited before measuring; manual particle fade check required. |

Readout:

- Headless automation did not show a clear runtime improvement here.
- Scripting time was effectively flat: `123.8 ms -> 124.7 ms`.
- Long task count and worst frame were unchanged in this environment.
- The targeted code changes still remove wasted RAF/uniform work after settling, but this automation run is inconclusive for the hub-idle benefit.

## Scenario 4: Playground Traffic Mode For 10 Seconds

Selected traffic mode: `Gaming`.

| Branch | Preview URL | Quality mode | FPS estimate | Worst frame time | Long task count | Total scripting time | JS heap before | JS heap after | Heap delta | GC spikes | Visual notes |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `feature/ui-enhancements` | `http://localhost:4174/` | `QUALITY: LITE` | `0.55 fps` automation-only | `1,816.6 ms` | `8` | `54.1 ms` | `20,952,232 B` | `20,183,940 B` | `-768,292 B` | Not measured | Playground opened and Gaming mode selected; manual traffic path/glow/label QA required. |
| `perf-visual-quality-optimization` | `http://localhost:4173/` | `QUALITY: LITE` | `0.53 fps` automation-only | `1,933.2 ms` | `8` | `49.8 ms` | `20,540,904 B` | `20,773,856 B` | `+232,952 B` | Not measured | Playground opened and Gaming mode selected; manual traffic path/glow/label QA required. |

Readout:

- Total scripting time improved slightly: `54.1 ms -> 49.8 ms`.
- FPS and worst-frame data are not reliable here because headless software WebGL dominated the run.
- No page errors were observed.
- Manual visual QA is required for tube paths, endpoint rings, labels, pulse heads, and glow.

## Graphics-Compromise Check

Pass 1 did not intentionally change visual-quality controls:

- No DPR changes were part of Pass 1.
- No bloom or postprocessing changes were part of Pass 1.
- No lighting or shadow-quality changes were part of Pass 1.
- No geometry segment/detail reductions were part of Pass 1.
- No particle count or particle-quality reductions were part of Pass 1.
- No material or shader-quality reductions were part of Pass 1.
- No die/model visual downgrade was part of Pass 1.
- No animation simplification was part of Pass 1.
- No Vite build-behavior changes were part of Pass 1.

Automation did not report page errors, but it did not validate full-quality visuals because it ran in headless `QUALITY: LITE`.

## Targeted Pass 1 Areas

| Target | Automated signal | Status |
| --- | --- | --- |
| Stop settled level-transition RAF work | Scroll scenario scripting and worst frame improved; hub-idle automation was flat. | Partially supported, not fully confirmed by headless metrics. |
| Reuse camera temp vectors | No visual/page-error regression; global scripting improved in scroll. | Source-level improvement; runtime impact not isolated by automation. |
| Skip invisible-particle frame work | Hub idle did not show a measurable headless improvement. | Inconclusive in automation; manual profiling needed. |
| Reduce datastream/traffic allocation waste | Playground scripting improved slightly, but frame metrics were dominated by software WebGL. | Inconclusive in automation; no page-error regression. |

## Manual Chrome Numbers Needed

Run these on the production preview in a normal browser/GPU session, preferably with `QUALITY: HIGH`:

- Hero idle for 10 seconds: FPS, worst frame, long tasks, scripting time, heap before/after, visual smoothness.
- Scroll chapter 1 -> 5, then wait 5 seconds: transition smoothness, camera motion, labels, datastreams, scripting time.
- Hub level idle after particles disappear: confirm particles fade at the same point and no post-settle RAF churn appears in Chrome Performance.
- Playground Gaming traffic for 10 seconds: confirm traffic paths, pulse heads, endpoint rings, labels, and glow are unchanged.

## Manual Real-Browser Check

Use Chrome DevTools Performance against the production preview URLs in a normal browser/GPU session. Fill these values from the same machine, viewport, browser profile, and quality mode for both branches.

| Scenario | Branch | Quality mode | Scripting time | Rendering time | Painting time | Worst frame | Long task count | JS heap before | JS heap after | Heap delta | Visible stutter yes/no | Visual quality unchanged yes/no | Notes |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| Scroll chapter 1 -> 5, then wait 5 seconds | `feature/ui-enhancements` at `http://localhost:4174/` |  |  |  |  |  |  |  |  |  |  |  |  |
| Scroll chapter 1 -> 5, then wait 5 seconds | `perf-visual-quality-optimization` at `http://localhost:4173/` |  |  |  |  |  |  |  |  |  |  |  |  |
| Playground traffic mode for 10 seconds | `feature/ui-enhancements` at `http://localhost:4174/` |  |  |  |  |  |  |  |  |  |  |  |  |
| Playground traffic mode for 10 seconds | `perf-visual-quality-optimization` at `http://localhost:4173/` |  |  |  |  |  |  |  |  |  |  |  |  |

### Final Decision Checklist

- Build passed: yes/no
- Typecheck has no new Pass 1 errors: yes/no
- Visual quality unchanged: yes/no
- Scripting time same or better: yes/no
- Long tasks same or fewer: yes/no
- Heap growth same or lower: yes/no
- Safe to commit Pass 1: yes/no

## Final Verdict

Verdict: **Inconclusive**.

Build correctness is confirmed for both branches, preview serving is confirmed, and automation showed no page errors. Some target-adjacent scripting metrics improved, especially the chapter scroll scenario, but the automated runtime environment forced `QUALITY: LITE` and software WebGL, making FPS and frame-time comparisons unreliable.

Pass 1 should not be considered fully confirmed until manual Chrome Performance numbers are collected in a real full-quality browser/GPU session.
