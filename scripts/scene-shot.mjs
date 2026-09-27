// Dev-only helper: pins a Sanctuary scene via localStorage before navigating,
// so a specific illustrated scene can be screenshotted regardless of the
// real local time. `node scripts/scene-shot.mjs <path> <sceneId> <out.png>`
import { chromium } from "playwright";

const [, , route = "/", sceneId = "day-meadow-horses", out = "shot.png", width = "1440", height = "900"] = process.argv;
const base = process.env.MOODLY_BASE_URL ?? "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
await page.addInitScript((id) => {
  window.localStorage.setItem("moodly:pinned-scene", id);
}, sceneId);
await page.goto(`${base}${route}`, { waitUntil: "load", timeout: 30000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: out });
await browser.close();
console.log(`Saved ${out}`);
