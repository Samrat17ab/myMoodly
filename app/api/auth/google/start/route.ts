import { env } from "cloudflare:workers";
import { cleanupExpiredAuthArtifacts, ensureDbSchema, getD1 } from "@/db";
import {
  createOpaqueToken,
  googleStateCookie,
  hashToken,
  OAUTH_STATE_TTL_SECONDS,
  publicAppOrigin,
  sha256Base64Url,
} from "@/worker/magic-auth";

interface GoogleAuthEnv {
  GOOGLE_CLIENT_ID?: string;
  PUBLIC_APP_URL?: string;
}

export async function GET(request: Request) {
  await ensureDbSchema();
  const runtimeEnv = env as unknown as GoogleAuthEnv;
  const clientId = runtimeEnv.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    return Response.json(
      { error: "Google sign-in is not configured." },
      { status: 503 },
    );
  }

  const origin = publicAppOrigin(request, runtimeEnv.PUBLIC_APP_URL);
  const redirectUri = `${origin}/api/auth/google/callback`;
  const state = createOpaqueToken();
  const stateHash = await hashToken(state);
  const codeVerifier = createOpaqueToken();
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const nonce = createOpaqueToken();
  const d1 = getD1();

  await cleanupExpiredAuthArtifacts(d1);
  await d1
    .prepare(
      `INSERT INTO oauth_states
        (state_hash, code_verifier, nonce, expires_at)
       VALUES (?, ?, ?, unixepoch() + ?)`,
    )
    .bind(stateHash, codeVerifier, nonce, OAUTH_STATE_TTL_SECONDS)
    .run();

  const authorizationUrl = new URL(
    "https://accounts.google.com/o/oauth2/v2/auth",
  );
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("nonce", nonce);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("prompt", "select_account");

  return new Response(null, {
    status: 302,
    headers: {
      location: authorizationUrl.toString(),
      "set-cookie": googleStateCookie(state),
      "cache-control": "no-store",
    },
  });
}
