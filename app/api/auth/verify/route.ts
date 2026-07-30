import { env } from "cloudflare:workers";
import { ensureDbSchema, getD1 } from "@/db";
import {
  createOpaqueToken,
  hashToken,
  publicAppOrigin,
  sessionCookie,
  SESSION_TTL_SECONDS,
} from "@/worker/magic-auth";

interface VerifyEnv {
  PUBLIC_APP_URL?: string;
}

function redirect(origin: string, result: "success" | "invalid", cookie?: string) {
  const headers = new Headers({
    location:
      result === "success"
        ? `${origin}/?signedIn=1`
        : `${origin}/?authError=invalid-or-expired`,
    "cache-control": "no-store",
  });
  if (cookie) headers.set("set-cookie", cookie);
  return new Response(null, { status: 302, headers });
}

export async function GET(request: Request) {
  await ensureDbSchema();
  const runtimeEnv = env as unknown as VerifyEnv;
  const origin = publicAppOrigin(request, runtimeEnv.PUBLIC_APP_URL);
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!token || token.length > 256) return redirect(origin, "invalid");

  const d1 = getD1();
  const tokenHash = await hashToken(token);
  const result = await d1
    .prepare(
      `UPDATE magic_link_tokens
       SET used_at = unixepoch()
       WHERE token_hash = ?
         AND used_at IS NULL
         AND expires_at > unixepoch()
       RETURNING email`,
    )
    .bind(tokenHash)
    .first<{ email: string }>();
  if (!result?.email) return redirect(origin, "invalid");

  const sessionToken = createOpaqueToken();
  const sessionHash = await hashToken(sessionToken);
  await d1.batch([
    d1
      .prepare("DELETE FROM auth_sessions WHERE expires_at <= unixepoch()"),
    d1
      .prepare(
        `INSERT INTO auth_sessions
          (token_hash, user_email, expires_at)
         VALUES (?, ?, unixepoch() + ?)`,
      )
      .bind(sessionHash, result.email, SESSION_TTL_SECONDS),
  ]);

  return redirect(origin, "success", sessionCookie(sessionToken));
}
