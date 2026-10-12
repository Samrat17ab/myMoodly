// Pure helpers for blog analytics, shared by the recording endpoint and tests.

export const BLOG_EVENTS = ["view", "read", "cta"] as const;
export type BlogEvent = (typeof BLOG_EVENTS)[number];

/** The blog index page is recorded under this slug. */
export const BLOG_INDEX_SLUG = "index";

// Crawlers, link-preview fetchers and headless browsers. Real visitors are
// recorded from client-side JavaScript, which most bots never run; this
// catches the ones that do.
const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|quora link|whatsapp|telegram|discord|slack|headless|lighthouse|pagespeed|phantom|puppeteer|playwright|curl|wget|python-requests|axios|node-fetch/i;

export function isBot(userAgent: string | null | undefined) {
  return !userAgent || BOT_UA.test(userAgent);
}

// Where a reader came from. A UTM tag wins (in-app browsers like LinkedIn's
// and Instagram's often strip the referrer); otherwise the referring site.
const SOURCES: [RegExp, string][] = [
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"],
  [/(^|\.)(reddit\.com|redd\.it)$/, "reddit"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "x"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "facebook"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(google\.[a-z.]+|googleusercontent\.com)$/, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)(news\.ycombinator\.com)$/, "hacker news"],
  [/(^|\.)producthunt\.com$/, "product hunt"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
];

export function classifySource(referrer: string | null | undefined, utmSource: string | null | undefined, ownHost = "mymoodly.space") {
  const utm = (utmSource ?? "").trim().toLowerCase().slice(0, 40);
  if (utm) return utm === "twitter" ? "x" : utm;
  if (!referrer) return "direct";
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "direct";
  }
  if (host === ownHost || host.endsWith(`.${ownHost}`) || host === "localhost") return "internal";
  for (const [pattern, name] of SOURCES) if (pattern.test(host)) return name;
  return host.slice(0, 60);
}
