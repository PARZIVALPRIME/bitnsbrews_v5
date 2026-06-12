// Potato-mode visual check: toggle Quality to Perf, walk the chapters.
import { chromium } from "playwright";

const OUT = "scripts/shots";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);

// Switch to performance (potato) mode
await page.getByText(/Quality ·/).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/p1-hero-potato.png` });

await page.getByText("Start the journey").click();
await page.waitForTimeout(2200);
await page.screenshot({ path: `${OUT}/p2-chapter2-potato.png` });

await page.keyboard.press("ArrowDown");
await page.waitForTimeout(2200);
await page.screenshot({ path: `${OUT}/p3-chapter3-potato.png` });

await page.keyboard.press("ArrowDown");
await page.waitForTimeout(2200);
await page.screenshot({ path: `${OUT}/p4-chapter4-potato.png` });

await browser.close();
console.log("OK");
