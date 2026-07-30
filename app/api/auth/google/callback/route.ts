import { env } from "cloudflare:workers";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { ensureDbSchema, getD1 } from "@/db";
import {
  clearGoogleStateCookie,
  createOpaqueToken,
  GOOGLE_OAUTH_STATE_COOKIE,
  hashToken,
  normalizeEmail,
  publicAppOrigin,
  readCookie,
  sessionCookie,
  SESSION_TTL_SECONDS,
} from "@/worker/magic-auth";

interface GoogleAuthEnv {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  PUBLIC_APP_URL?: string;
}

type GoogleTokenResponse = {
  id_token?: string;
};

const googleKeySet = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

function redirect(
  origin: string,
  result: "success" | "error",
  session?: string,
) {
  const headers = new Headers({
    location:
      result === "success"
        ? `${origin}/?signedIn=1`
        : `${origin}/?authError=google`,
    "cache-control": "no-store",
    "set-cookie": clearGoogleStateCookie(),
  });
  if (session) headers.append("set-cookie", sessionCookie(session));
  return new Response(null, { status: 302, headers });
}

export async function GET(request: Request) {
  await ensureDbSchema();
  const runtimeEnv = env as unknown as GoogleAuthEnv;
  const clientId = runtimeEnv.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = runtimeEnv.GOOGLE_CLIENT_SECRET?.trim();
  const origin = publicAppOrigin(request, runtimeEnv.PUBLIC_APP_URL);
  if (!clientId || !clientSecret) return redirect(origin, "error");

  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const returnedState = url.searchParams.get("state") ?? "";
  const cookieState = readCookie(request, GOOGLE_OAUTH_STATE_COOKIE);
  if (
    url.searchParams.has("error") ||
    !code ||
    !returnedState ||
    returnedState !== cookieState
  ) {
    return redirect(origin, "error");
  }

  const d1 = getD1();
  const stateHash = await hashToken(returnedState);
  const oauthState = await d1
    .prepare(
      `DELETE FROM oauth_states
       WHERE state_hash = ? AND expires_at > unixepoch()
       RETURNING code_verifier, nonce`,
    )
    .bind(stateHash)
    .first<{ code_verifier: string; nonce: string }>();
  if (!oauthState) return redirect(origin, "error");

  const redirectUri = `${origin}/api/auth/google/callback`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: oauthState.code_verifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  if (!tokenResponse.ok) return redirect(origin, "error");

  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokens.id_token) return redirect(origin, "error");

  try {
    const verified = await jwtVerify(tokens.id_token, googleKeySet, {
      audience: clientId,
      issuer: ["https://accounts.google.com", "accounts.google.com"],
    });
    if (
      verified.payload.nonce !== oauthState.nonce ||
      verified.payload.email_verified !== true
    ) {
      return redirect(origin, "error");
    }

    const claimedEmail = normalizeEmail(verified.payload.email);
    const subject =
      typeof verified.payload.sub === "string" ? verified.payload.sub : "";
    if (!claimedEmail || !subject) return redirect(origin, "error");

    const existingIdentity = await d1
      .prepare(
        `SELECT user_email
         FROM oauth_identities
         WHERE provider = 'google' AND subject = ?
         LIMIT 1`,
      )
      .bind(subject)
      .first<{ user_email: string }>();
    const userEmail =
      normalizeEmail(existingIdentity?.user_email) || claimedEmail;

    const sessionToken = createOpaqueToken();
    const sessionHash = await hashToken(sessionToken);
    await d1.batch([
      d1
        .prepare(
          `INSERT INTO oauth_identities
            (provider, subject, user_email, email_at_login)
           VALUES ('google', ?, ?, ?)
           ON CONFLICT(provider, subject) DO UPDATE SET
             email_at_login = excluded.email_at_login,
             updated_at = unixepoch()`,
        )
        .bind(subject, userEmail, claimedEmail),
      d1.prepare("DELETE FROM auth_sessions WHERE expires_at <= unixepoch()"),
      d1
        .prepare(
          `INSERT INTO auth_sessions
            (token_hash, user_email, expires_at)
           VALUES (?, ?, unixepoch() + ?)`,
        )
        .bind(sessionHash, userEmail, SESSION_TTL_SECONDS),
    ]);

    return redirect(origin, "success", sessionToken);
  } catch {
    return redirect(origin, "error");
  }
}
