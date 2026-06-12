// Portal + reader flow: chapter 4 → click block → portal → read article.
import { chromium } from "playwright";

const OUT = "scripts/shots";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);

// Navigate to chapter 4 (the library)
for (let i = 0; i < 3; i++) {
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(1200);
}
await page.waitForTimeout(1500);

// Click near the center of the die to select a block
await page.mouse.click(800, 430);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/08-portal.png` });

// Open the first article if the portal appeared
const read = page.getByText("Read →").first();
if (await read.isVisible().catch(() => false)) {
  await read.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/09-reader.png` });
  // Scroll the reader a bit
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/10-reader-scrolled.png` });
  // Close with Escape — back to portal/die
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/11-after-close.png` });
}

await browser.close();
console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "OK");
