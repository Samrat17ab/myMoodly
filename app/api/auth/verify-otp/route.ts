import { ensureDbSchema, getD1 } from "@/db";
import {
  createOpaqueToken,
  hashToken,
  normalizeEmail,
  OTP_MAX_ATTEMPTS,
  sessionCookie,
  SESSION_TTL_SECONDS,
} from "@/worker/magic-auth";

export async function POST(request: Request) {
  await ensureDbSchema();
  const payload = (await request.json().catch(() => ({}))) as {
    email?: unknown;
    code?: unknown;
  };
  const email = normalizeEmail(payload.email);
  const code =
    typeof payload.code === "string" ? payload.code.trim() : "";
  if (!email || !/^\d{6}$/.test(code)) {
    return Response.json(
      { error: "Enter the 6-digit code from your email." },
      { status: 400 },
    );
  }

  const d1 = getD1();
  const active = await d1
    .prepare(
      `SELECT code_hash, attempts
       FROM otp_codes
       WHERE email = ? AND used_at IS NULL AND expires_at > unixepoch()
       ORDER BY requested_at DESC
       LIMIT 1`,
    )
    .bind(email)
    .first<{ code_hash: string; attempts: number }>();
  if (!active || active.attempts >= OTP_MAX_ATTEMPTS) {
    return Response.json(
      { error: "That code is invalid or has expired." },
      { status: 400 },
    );
  }

  const codeHash = await hashToken(code);
  if (codeHash !== active.code_hash) {
    await d1
      .prepare("UPDATE otp_codes SET attempts = attempts + 1 WHERE code_hash = ?")
      .bind(active.code_hash)
      .run();
    return Response.json(
      { error: "That code is incorrect." },
      { status: 400 },
    );
  }

  const sessionToken = createOpaqueToken();
  const sessionHash = await hashToken(sessionToken);
  await d1.batch([
    d1
      .prepare("UPDATE otp_codes SET used_at = unixepoch() WHERE code_hash = ?")
      .bind(codeHash),
    d1.prepare("DELETE FROM auth_sessions WHERE expires_at <= unixepoch()"),
    d1
      .prepare(
        `INSERT INTO auth_sessions
          (token_hash, user_email, expires_at)
         VALUES (?, ?, unixepoch() + ?)`,
      )
      .bind(sessionHash, email, SESSION_TTL_SECONDS),
  ]);

  return Response.json(
    { verified: true },
    { headers: { "set-cookie": sessionCookie(sessionToken) } },
  );
}
