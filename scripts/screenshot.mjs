// Dev-only helper: `node scripts/screenshot.mjs <path> <out.png> [width] [height]`
// Screenshots a route served by the local dev server for visual review during
// the redesign. Not part of the app build.
import { chromium } from "playwright";

const [, , route = "/", out = "shot.png", width = "390", height = "844"] = process.argv;
const base = process.env.MOODLY_BASE_URL ?? "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
await page.goto(`${base}${route}`, { waitUntil: "load", timeout: 30000 });
await page.waitForTimeout(500);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`Saved ${out}`);
