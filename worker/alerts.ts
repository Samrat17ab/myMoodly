import { sendAlertEmail, type SmtpEnv } from "./smtp";

export type AlertType = "report" | "ban" | "otp_failure";

// OTP failures can spike all at once during an outage -- throttle the EMAIL
// (not the log, which always records every failure so the admin panel shows
// a true count) so one bad patch doesn't flood the inbox with duplicates.
let lastOtpFailureEmailAt = 0;
const OTP_FAILURE_EMAIL_INTERVAL_MS = 15 * 60_000;

function alertSubject(type: AlertType) {
  if (type === "report") return "myMoodly: new report filed";
  if (type === "ban") return "myMoodly: account banned";
  return "myMoodly: a sign-in email failed to send";
}

// Always logs, so the admin panel is a reliable record even if the email
// itself never arrives (which is exactly the scenario a broken email
// pathway would otherwise hide). Never lets an alert failure break the
// caller's own request -- reporting someone should still succeed even if
// notifying the admin about it doesn't.
export async function recordAlert(
  d1: D1Database,
  env: SmtpEnv,
  type: AlertType,
  message: string,
) {
  try {
    await d1
      .prepare("INSERT INTO alerts (id, type, message) VALUES (?, ?, ?)")
      .bind(crypto.randomUUID(), type, message)
      .run();
  } catch {
    // If even the log write fails, there's nothing left to do but skip the
    // email too -- don't let this take down the caller's real request.
    return;
  }

  if (type === "otp_failure") {
    const now = Date.now();
    if (now - lastOtpFailureEmailAt < OTP_FAILURE_EMAIL_INTERVAL_MS) return;
    lastOtpFailureEmailAt = now;
  }

  try {
    await sendAlertEmail(env, alertSubject(type), message);
  } catch {
    // Already logged above -- the panel doesn't depend on this succeeding.
  }
}
