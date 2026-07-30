import { createRemoteJWKSet, jwtVerify } from "jose";
import {
  hashToken,
  normalizeEmail,
  readCookie,
  SESSION_COOKIE,
} from "./magic-auth";

export interface AccessAuthEnv {
  POLICY_AUD?: string;
  TEAM_DOMAIN?: string;
  DB?: D1Database;
}

const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function cleanEmail(value: unknown) {
  return normalizeEmail(value);
}

export async function authenticatedRequestEmail(
  request: Request,
  env: AccessAuthEnv,
  localFallback?: unknown,
) {
  const sitesEmail = cleanEmail(
    request.headers.get("oai-authenticated-user-email"),
  );
  if (sitesEmail) return sitesEmail;

  const sessionToken = readCookie(request, SESSION_COOKIE);
  if (sessionToken && env.DB) {
    try {
      const tokenHash = await hashToken(sessionToken);
      const session = await env.DB.prepare(
        `SELECT user_email
         FROM auth_sessions
         WHERE token_hash = ? AND expires_at > unixepoch()
         LIMIT 1`,
      )
        .bind(tokenHash)
        .first<{ user_email: string }>();
      const sessionEmail = cleanEmail(session?.user_email);
      if (sessionEmail) return sessionEmail;
    } catch {
      // Continue to the configured hosted identity providers below.
    }
  }

  const token = request.headers.get("cf-access-jwt-assertion");
  const audience = env.POLICY_AUD?.trim();
  const issuer = env.TEAM_DOMAIN?.trim().replace(/\/+$/, "");
  if (token && audience && issuer) {
    try {
      let keySet = keySets.get(issuer);
      if (!keySet) {
        keySet = createRemoteJWKSet(
          new URL(`${issuer}/cdn-cgi/access/certs`),
        );
        keySets.set(issuer, keySet);
      }
      const verified = await jwtVerify(token, keySet, {
        issuer,
        audience,
      });
      return cleanEmail(verified.payload.email);
    } catch {
      return "";
    }
  }

  const hostname = new URL(request.url).hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return cleanEmail(localFallback);
  }
  return "";
}
