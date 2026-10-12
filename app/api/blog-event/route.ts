import { ensureDbSchema, getD1 } from "@/db";
import { getPosts } from "@/app/blog/lib/posts";
import { BLOG_EVENTS, BLOG_INDEX_SLUG, classifySource, isBot, type BlogEvent } from "@/app/lib/blogAnalytics";

const KNOWN_SLUGS = new Set([BLOG_INDEX_SLUG, ...getPosts().map((p) => p.slug)]);
const ok = () => new Response(null, { status: 204 });

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// A random salt per UTC day, kept only for today. Yesterday's salt is
// deleted, so a visitor hash can't be linked to the same reader again.
async function todaysSalt(d1: D1Database) {
  const day = new Date().toISOString().slice(0, 10);
  const fresh = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
  await d1.batch([
    d1.prepare("INSERT OR IGNORE INTO analytics_salts (day, salt) VALUES (?, ?)").bind(day, fresh),
    d1.prepare("DELETE FROM analytics_salts WHERE day < ?").bind(day),
  ]);
  const row = await d1.prepare("SELECT salt FROM analytics_salts WHERE day = ?").bind(day).first<{ salt: string }>();
  return row?.salt ?? fresh;
}

// Public and anonymous: records a blog view, a finished read, or a "Check in"
// click. Always answers 204 so it never affects the page, even on bad input.
export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get("user-agent");
    if (isBot(userAgent)) return ok();

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const slug = typeof body.slug === "string" ? body.slug : "";
    const event = body.event as BlogEvent;
    if (!KNOWN_SLUGS.has(slug) || !BLOG_EVENTS.includes(event)) return ok();

    const source = classifySource(
      typeof body.referrer === "string" ? body.referrer : null,
      typeof body.utm === "string" ? body.utm : null,
      new URL(request.url).hostname.replace(/^www\./, ""),
    );

    await ensureDbSchema();
    const d1 = getD1();
    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "";
    const visitor = (await sha256Hex(`${await todaysSalt(d1)}|${ip}|${userAgent}`)).slice(0, 24);

    // A finished read or a click counts once per reader, post and day.
    if (event !== "view") {
      const seen = await d1
        .prepare("SELECT 1 FROM blog_events WHERE slug = ? AND event = ? AND visitor = ? LIMIT 1")
        .bind(slug, event, visitor)
        .first();
      if (seen) return ok();
    }

    await d1
      .prepare("INSERT INTO blog_events (id, slug, event, source, visitor) VALUES (?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), slug, event, source, visitor)
      .run();
    return ok();
  } catch {
    return ok();
  }
}
