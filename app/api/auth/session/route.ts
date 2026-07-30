import { env } from "cloudflare:workers";
import { ensureDbSchema, getD1 } from "@/db";
import {
  authenticatedRequestEmail,
  type AccessAuthEnv,
} from "@/worker/access-auth";
import {
  clearSessionCookie,
  hashToken,
  readCookie,
  SESSION_COOKIE,
} from "@/worker/magic-auth";

const noStoreHeaders = { "cache-control": "no-store" };

export async function GET(request: Request) {
  await ensureDbSchema();
  const email = await authenticatedRequestEmail(
    request,
    env as unknown as AccessAuthEnv,
  );
  if (!email) {
    return Response.json(
      { authenticated: false },
      { status: 401, headers: noStoreHeaders },
    );
  }
  return Response.json(
    { authenticated: true, email },
    { headers: noStoreHeaders },
  );
}

export async function DELETE(request: Request) {
  await ensureDbSchema();
  const token = readCookie(request, SESSION_COOKIE);
  if (token) {
    const tokenHash = await hashToken(token);
    await getD1()
      .prepare("DELETE FROM auth_sessions WHERE token_hash = ?")
      .bind(tokenHash)
      .run();
  }
  return Response.json(
    { signedOut: true },
    {
      headers: {
        ...noStoreHeaders,
        "set-cookie": clearSessionCookie(),
      },
    },
  );
}
