import assert from "node:assert/strict";
import test from "node:test";
import { classifySource, isBot } from "../app/lib/blogAnalytics.ts";

test("works out where a blog reader came from", () => {
  const cases = [
    ["https://www.linkedin.com/feed/", null, "linkedin"],
    ["https://lnkd.in/abc", null, "linkedin"],
    ["https://www.reddit.com/r/SideProject/comments/x", null, "reddit"],
    ["https://out.reddit.com/t3_x", null, "reddit"],
    ["https://t.co/xyz", null, "x"],
    ["https://x.com/someone", null, "x"],
    ["https://l.facebook.com/l.php", null, "facebook"],
    ["https://www.google.com/", null, "google"],
    ["https://www.google.co.in/", null, "google"],
    ["https://mymoodly.space/blog", null, "internal"],
    ["", null, "direct"],
    [null, null, "direct"],
    ["not a url", null, "direct"],
    ["https://news.example.org/post", null, "news.example.org"],
    // A UTM tag wins over the referrer (in-app browsers often hide it).
    ["", "linkedin", "linkedin"],
    ["https://t.co/xyz", "Twitter", "x"],
  ];
  for (const [ref, utm, expected] of cases) assert.equal(classifySource(ref, utm), expected, `${ref} / ${utm}`);
});

test("leaves out bots and link-preview crawlers", () => {
  const bots = [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient)",
    "facebookexternalhit/1.1",
    "WhatsApp/2.23.20.0",
    "Twitterbot/1.0",
    "Slackbot-LinkExpanding 1.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0 Safari/537.36",
    "curl/8.4.0",
    "",
    null,
  ];
  for (const ua of bots) assert.equal(isBot(ua), true, String(ua));
  const people = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36 [LinkedInApp]",
  ];
  for (const ua of people) assert.equal(isBot(ua), false, ua);
});
