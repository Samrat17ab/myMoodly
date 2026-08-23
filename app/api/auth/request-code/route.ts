import { env } from "cloudflare:workers";
import { cleanupExpiredAuthArtifacts, ensureDbSchema, getD1 } from "@/db";
import { recordAlert } from "@/worker/alerts";
import {
  createOpaqueToken,
  createOtpCode,
  hashToken,
  normalizeEmail,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_SECONDS,
  REQUIRE_EMAIL_VERIFICATION,
  sessionCookie,
  SESSION_TTL_SECONDS,
} from "@/worker/magic-auth";
import { sendOtpEmail, type SmtpEnv } from "@/worker/smtp";

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

  if (!REQUIRE_EMAIL_VERIFICATION) {
    const sessionToken = createOpaqueToken();
    const sessionHash = await hashToken(sessionToken);
    await cleanupExpiredAuthArtifacts(d1);
    await d1
      .prepare(
        `INSERT INTO auth_sessions
          (token_hash, user_email, expires_at)
         VALUES (?, ?, unixepoch() + ?)`,
      )
      .bind(sessionHash, email, SESSION_TTL_SECONDS)
      .run();
    return Response.json(
      { verified: true },
      { headers: { "set-cookie": sessionCookie(sessionToken) } },
    );
  }

  const recent = await d1
    .prepare(
      `SELECT requested_at
       FROM otp_codes
       WHERE email = ? AND requested_at > unixepoch() - ?
       ORDER BY requested_at DESC
       LIMIT 1`,
    )
    .bind(email, OTP_RESEND_COOLDOWN_SECONDS)
    .first();
  if (recent) {
    return Response.json({ sent: true });
  }

  const code = createOtpCode();
  const codeHash = await hashToken(code);
  await cleanupExpiredAuthArtifacts(d1);
  await d1.batch([
    d1
      .prepare(`DELETE FROM otp_codes WHERE email = ? AND used_at IS NULL`)
      .bind(email),
    d1
      .prepare(
        `INSERT INTO otp_codes
          (code_hash, email, expires_at)
         VALUES (?, ?, unixepoch() + ?)`,
      )
      .bind(codeHash, email, OTP_TTL_SECONDS),
  ]);

  try {
    await sendOtpEmail(env as unknown as SmtpEnv, email, code);
  } catch (error) {
    await d1
      .prepare("DELETE FROM otp_codes WHERE code_hash = ?")
      .bind(codeHash)
      .run();
    const message =
      error instanceof Error ? error.message : "Could not send sign-in code.";
    await recordAlert(
      d1,
      env as unknown as SmtpEnv,
      "otp_failure",
      `Sign-in code to ${email} failed to send: ${message}`,
    );
    return Response.json({ error: message }, { status: 502 });
  }

  return Response.json({ sent: true });
}
