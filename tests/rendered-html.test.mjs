import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectFile = (path) => new URL(`../${path}`, import.meta.url);

test("build emits the Moodly client stylesheet", async () => {
  const manifest = await readFile(
    projectFile("dist/server/__vite_rsc_assets_manifest.js"),
    "utf8",
  );
  const cssPath = manifest.match(/"\/assets\/([^"]+\.css)"/)?.[1];
  assert.ok(cssPath, "The server manifest should reference a CSS asset.");
  await access(projectFile(`dist/client/assets/${cssPath}`));

  const wrangler = await readFile(projectFile("wrangler.direct.jsonc"), "utf8");
  assert.match(wrangler, /"run_worker_first"\s*:\s*\[/);
  assert.match(wrangler, /"\/api\/\*"/);
  assert.doesNotMatch(wrangler, /"run_worker_first"\s*:\s*true/);
});

test("uses secure email and Google authentication instead of the demo login", async () => {
  const [app, requestRoute, verifyRoute, sessionRoute, googleStart, googleCallback, accessAuth, smtp] =
    await Promise.all([
      readFile(projectFile("app/MoodlyApp.tsx"), "utf8"),
      readFile(projectFile("app/api/auth/magic-link/route.ts"), "utf8"),
      readFile(projectFile("app/api/auth/verify/route.ts"), "utf8"),
      readFile(projectFile("app/api/auth/session/route.ts"), "utf8"),
      readFile(projectFile("app/api/auth/google/start/route.ts"), "utf8"),
      readFile(projectFile("app/api/auth/google/callback/route.ts"), "utf8"),
      readFile(projectFile("worker/access-auth.ts"), "utf8"),
      readFile(projectFile("worker/smtp.ts"), "utf8"),
    ]);

  assert.match(app, /\/api\/auth\/magic-link/);
  assert.match(app, /\/api\/auth\/session/);
  assert.match(app, /\/api\/auth\/google\/start/);
  assert.match(app, /Continue with Google/);
  assert.doesNotMatch(app, /google-demo@moodly\.local/);
  assert.doesNotMatch(app, /Open secure sign-in link/);

  assert.match(requestRoute, /MAGIC_LINK_TTL_SECONDS/);
  assert.match(requestRoute, /sendMagicLinkEmail/);
  assert.match(verifyRoute, /used_at IS NULL/);
  assert.match(verifyRoute, /sessionCookie/);
  assert.match(sessionRoute, /clearSessionCookie/);
  assert.match(googleStart, /code_challenge_method", "S256"/);
  assert.match(googleStart, /prompt", "select_account"/);
  assert.match(googleCallback, /jwtVerify/);
  assert.match(googleCallback, /email_verified/);
  assert.match(googleCallback, /oauth_identities/);
  assert.match(accessAuth, /auth_sessions/);
  assert.match(smtp, /smtp\.gmail\.com/);
  assert.match(smtp, /secureTransport:\s*"on"/);
});

test("keeps credentials out of tracked configuration", async () => {
  const [wrangler, example, ignore] = await Promise.all([
    readFile(projectFile("wrangler.direct.jsonc"), "utf8"),
    readFile(projectFile(".dev.vars.example"), "utf8"),
    readFile(projectFile(".gitignore"), "utf8"),
  ]);

  assert.doesNotMatch(wrangler, /GMAIL_APP_PASSWORD/);
  assert.match(example, /GMAIL_APP_PASSWORD=/);
  assert.match(ignore, /^\.dev\.vars$/m);
});

test("a new match search cannot reopen a previous conversation", async () => {
  const realtime = await readFile(projectFile("worker/realtime.ts"), "utf8");
  const existingTicketQuery = realtime.match(
    /const existing = await this\.env\.DB[\s\S]*?\.first<TicketRow>\(\);/,
  )?.[0];

  assert.ok(existingTicketQuery, "The existing-ticket lookup should be present.");
  assert.match(existingTicketQuery, /status = 'waiting'/);
  assert.doesNotMatch(existingTicketQuery, /status = 'matched'/);
});

test("matching requires a live queue heartbeat and chats expire", async () => {
  const realtime = await readFile(projectFile("worker/realtime.ts"), "utf8");

  assert.match(realtime, /WAITING_HEARTBEAT_TIMEOUT = "-15 seconds"/);
  assert.match(realtime, /mt\.updated_at >= datetime\('now', '-15 seconds'\)/);
  assert.match(
    realtime,
    /UPDATE matchmaking_tickets SET updated_at = CURRENT_TIMESTAMP[\s\S]*status = 'waiting'/,
  );
  assert.match(realtime, /CONVERSATION_LIFETIME = "-20 minutes"/);
  assert.match(realtime, /SET status = 'ended', ended_at = CURRENT_TIMESTAMP/);
  assert.match(realtime, /onlineUsers\.add\(attachment\.email\)/);
});

test("matches wait three seconds and share partner check-ins", async () => {
  const [realtime, app, loadTest] = await Promise.all([
    readFile(projectFile("worker/realtime.ts"), "utf8"),
    readFile(projectFile("app/MoodlyApp.tsx"), "utf8"),
    readFile(projectFile("tests/matchmaking-50-users.mjs"), "utf8"),
  ]);

  assert.match(realtime, /MINIMUM_MATCH_WAIT_SECONDS = 3/);
  assert.match(realtime, /await this\.tryMatch\(email, ticketId\)/);
  assert.match(realtime, /partnerEmotion:/);
  assert.match(realtime, /partnerNote:/);
  assert.match(realtime, /chatStartsAt:/);
  assert.match(app, /scheduleMatchedChat/);
  assert.match(app, /partnerName}'s check-in/);
  assert.match(loadTest, /length: 50/);
  assert.match(loadTest, /conversations\.size, 25/);
});
