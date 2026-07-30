import { createRemoteJWKSet, jwtVerify } from "jose";

export interface AccessAuthEnv {
  POLICY_AUD?: string;
  TEAM_DOMAIN?: string;
}

const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function cleanEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
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
