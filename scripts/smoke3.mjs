// Debug: does Escape close the reader?
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
for (let i = 0; i < 3; i++) {
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(1200);
}
await page.waitForTimeout(1500);
await page.mouse.click(800, 430);
await page.waitForTimeout(1000);
console.log("portal open:", await page.getByText("Learning path").isVisible().catch(() => false));

await page.getByText("Read →").first().click();
await page.waitForTimeout(1000);
const readerOpen = await page.getByText("Back to the die").first().isVisible().catch(() => false);
console.log("reader open:", readerOpen);

await page.keyboard.press("Escape");
await page.waitForTimeout(1000);
console.log("reader open after esc:", await page.getByText("Back to the die").first().isVisible().catch(() => false));
console.log("portal open after esc:", await page.getByText("Learning path").isVisible().catch(() => false));

await page.keyboard.press("Escape");
await page.waitForTimeout(1000);
console.log("reader open after 2nd esc:", await page.getByText("Back to the die").first().isVisible().catch(() => false));
console.log("portal open after 2nd esc:", await page.getByText("Learning path").isVisible().catch(() => false));

await browser.close();
