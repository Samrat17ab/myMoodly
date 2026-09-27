// Dev-only helper: screenshots a route with prefers-reduced-motion emulated.
import { chromium } from "playwright";

const [, , route = "/", out = "shot.png", width = "390", height = "1200"] = process.argv;
const base = process.env.MOODLY_BASE_URL ?? "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(`${base}${route}`, { waitUntil: "load", timeout: 30000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log(`Saved ${out}`);
