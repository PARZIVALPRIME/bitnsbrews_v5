// Visual smoke test: boot screen → hero → chapters → die interactions.
import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "scripts/shots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });

// Boot screen (capture quickly before it fades at ~1.4s)
await page.screenshot({ path: `${OUT}/01-boot.png` });

// Hero after boot
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/02-hero.png` });

// Advance to chapter 2 via CTA
await page.getByText("Start the journey").click();
await page.waitForTimeout(1600);
await page.screenshot({ path: `${OUT}/03-chapter2.png` });

// Chapter 3 — tracks menu
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/04-chapter3-tracks.png` });

// Select a track → detail panel
await page.getByText("Die Chronicles").first().click();
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/05-track-detail.png` });

// Chapter 4 — library
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/06-chapter4-library.png` });

// Chapter 5 — hub catalog
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/07-hub.png` });

await browser.close();

if (errors.length) {
  console.log("ERRORS:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("OK — no console/page errors");
