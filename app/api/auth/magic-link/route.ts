import { env } from "cloudflare:workers";
import { ensureDbSchema, getD1 } from "@/db";
import {
  createOpaqueToken,
  hashToken,
  MAGIC_LINK_TTL_SECONDS,
  normalizeEmail,
  publicAppOrigin,
} from "@/worker/magic-auth";
import { sendMagicLinkEmail, type SmtpEnv } from "@/worker/smtp";

interface MagicLinkEnv extends SmtpEnv {
  PUBLIC_APP_URL?: string;
}

export async function POST(request: Request) {
  await ensureDbSchema();
  const payload = (await request.json().catch(() => ({}))) as {
    email?: unknown;
  };
  const email = normalizeEmail(payload.email);
  if (!email) {
    return Response.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const d1 = getD1();
  const recent = await d1
    .prepare(
      `SELECT requested_at
       FROM magic_link_tokens
       WHERE email = ? AND requested_at > unixepoch() - 60
       ORDER BY requested_at DESC
       LIMIT 1`,
    )
    .bind(email)
    .first();
  if (recent) {
    return Response.json({ sent: true });
  }

  const token = createOpaqueToken();
  const tokenHash = await hashToken(token);
  await d1.batch([
    d1
      .prepare(
        `DELETE FROM magic_link_tokens
         WHERE expires_at <= unixepoch() OR (email = ? AND used_at IS NULL)`,
      )
      .bind(email),
    d1
      .prepare(
        `INSERT INTO magic_link_tokens
          (token_hash, email, expires_at)
         VALUES (?, ?, unixepoch() + ?)`,
      )
      .bind(tokenHash, email, MAGIC_LINK_TTL_SECONDS),
  ]);

  const runtimeEnv = env as unknown as MagicLinkEnv;
  const origin = publicAppOrigin(request, runtimeEnv.PUBLIC_APP_URL);
  const magicLink = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`;

  try {
    await sendMagicLinkEmail(runtimeEnv, email, magicLink);
  } catch (error) {
    await d1
      .prepare("DELETE FROM magic_link_tokens WHERE token_hash = ?")
      .bind(tokenHash)
      .run();
    const message =
      error instanceof Error ? error.message : "Could not send sign-in email.";
    return Response.json({ error: message }, { status: 502 });
  }

  return Response.json({ sent: true });
}
