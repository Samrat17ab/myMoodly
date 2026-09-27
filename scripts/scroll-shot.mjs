// Dev-only helper: scrolls incrementally (like a real user) so whileInView
// scroll-observers actually fire, then takes a full-page screenshot.
// `node scripts/scroll-shot.mjs <path> <out.png> [width] [height] [reducedMotion]`
import { chromium } from "playwright";

const [, , route = "/", out = "shot.png", width = "390", height = "844", reducedArg = "no"] = process.argv;
const base = process.env.MOODLY_BASE_URL ?? "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
if (reducedArg === "reduce") await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(`${base}${route}`, { waitUntil: "load", timeout: 30000 });
await page.waitForTimeout(1500);

const total = await page.evaluate(() => document.documentElement.scrollHeight);
const step = Number(height);
for (let y = 0; y < total; y += step) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(500);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1000);

await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`Saved ${out}`);
