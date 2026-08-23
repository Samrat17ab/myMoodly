import { env } from "cloudflare:workers";
import { ensureDbSchema, getD1 } from "@/db";
import {
  authenticatedRequestEmail,
  type AccessAuthEnv,
} from "@/worker/access-auth";
import { isAdminEmail } from "@/worker/admin-auth";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return jsonError(message, 500);
}

async function requireAdmin(request: Request) {
  const email = await authenticatedRequestEmail(request, env as unknown as AccessAuthEnv);
  if (!email || !isAdminEmail(email)) return null;
  return email;
}

export async function GET(request: Request) {
  try {
    await ensureDbSchema();
    const admin = await requireAdmin(request);
    if (!admin) return jsonError("Not authorized", 403);

    const d1 = getD1();
    const view = new URL(request.url).searchParams.get("view") ?? "overview";

    if (view === "overview") {
      const [
        totalUsers, newToday, newThisWeek,
        checkInsToday, matchesToday, matchesThisWeek, activeNow,
        totalReports, totalBans, totalBlocks, totalFeedback, totalDeleted,
        avgSession, ratingRows, understoodRows, moodChangeRows, capHits, retention, alertsLast24h,
      ] = await d1.batch([
        d1.prepare("SELECT COUNT(*) AS n FROM profiles"),
        d1.prepare("SELECT COUNT(*) AS n FROM profiles WHERE created_at >= datetime('now', 'start of day')"),
        d1.prepare("SELECT COUNT(*) AS n FROM profiles WHERE created_at >= datetime('now', '-7 days')"),
        d1.prepare("SELECT COUNT(*) AS n FROM check_ins WHERE created_at >= datetime('now', 'start of day')"),
        d1.prepare("SELECT COUNT(*) AS n FROM conversations WHERE created_at >= datetime('now', 'start of day')"),
        d1.prepare("SELECT COUNT(*) AS n FROM conversations WHERE created_at >= datetime('now', '-7 days')"),
        d1.prepare("SELECT COUNT(*) AS n FROM conversations WHERE status = 'active'"),
        d1.prepare("SELECT COUNT(*) AS n FROM reports"),
        d1.prepare("SELECT COUNT(*) AS n FROM banned_emails"),
        d1.prepare("SELECT COUNT(*) AS n FROM blocks"),
        d1.prepare("SELECT COUNT(*) AS n FROM feedback"),
        d1.prepare("SELECT COUNT(*) AS n FROM deleted_accounts"),
        d1.prepare("SELECT AVG(chat_session_seconds) AS avg_seconds FROM conversation_surveys WHERE chat_session_seconds IS NOT NULL"),
        d1.prepare("SELECT partner_rating, COUNT(*) AS n FROM conversation_surveys WHERE partner_rating IS NOT NULL GROUP BY partner_rating"),
        d1.prepare("SELECT understood, COUNT(*) AS n FROM conversation_surveys WHERE understood IS NOT NULL AND understood != '' GROUP BY understood"),
        d1.prepare("SELECT mood_change, COUNT(*) AS n FROM conversation_surveys WHERE mood_change IS NOT NULL AND mood_change != '' GROUP BY mood_change"),
        d1.prepare(
          `SELECT COUNT(*) AS n FROM (
             SELECT user_email FROM check_ins
             WHERE created_at >= datetime('now', 'start of day')
             GROUP BY user_email HAVING COUNT(*) >= 10
           )`,
        ),
        // "Returned" = has any check-in strictly more than a day after their
        // very first one -- standard next-day-or-later retention, filters
        // out someone just re-checking-in in the same sitting.
        d1.prepare(
          `WITH first_checkins AS (
             SELECT user_email, MIN(created_at) AS first_at
             FROM check_ins GROUP BY user_email
           )
           SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN EXISTS (
               SELECT 1 FROM check_ins later
               WHERE later.user_email = fc.user_email
                 AND later.created_at > datetime(fc.first_at, '+1 day')
             ) THEN 1 ELSE 0 END) AS returned
           FROM first_checkins fc`,
        ),
        d1.prepare("SELECT COUNT(*) AS n FROM alerts WHERE created_at >= datetime('now', '-1 day')"),
      ]);

      const ratings: Record<string, number> = { Great: 0, Okay: 0, "Not for me": 0 };
      for (const row of ratingRows.results as { partner_rating: string; n: number }[]) {
        ratings[row.partner_rating] = row.n;
      }
      const understood: Record<string, number> = { Yes: 0, Somewhat: 0, No: 0 };
      for (const row of understoodRows.results as { understood: string; n: number }[]) {
        understood[row.understood] = row.n;
      }
      const moodChange: Record<string, number> = { Better: 0, Same: 0, Worse: 0 };
      for (const row of moodChangeRows.results as { mood_change: string; n: number }[]) {
        moodChange[row.mood_change] = row.n;
      }

      return Response.json({
        totalUsers: (totalUsers.results[0] as { n: number }).n,
        newToday: (newToday.results[0] as { n: number }).n,
        newThisWeek: (newThisWeek.results[0] as { n: number }).n,
        checkInsToday: (checkInsToday.results[0] as { n: number }).n,
        matchesToday: (matchesToday.results[0] as { n: number }).n,
        matchesThisWeek: (matchesThisWeek.results[0] as { n: number }).n,
        activeConversationsNow: (activeNow.results[0] as { n: number }).n,
        totalReports: (totalReports.results[0] as { n: number }).n,
        totalBans: (totalBans.results[0] as { n: number }).n,
        totalBlocks: (totalBlocks.results[0] as { n: number }).n,
        totalFeedback: (totalFeedback.results[0] as { n: number }).n,
        totalDeletedAccounts: (totalDeleted.results[0] as { n: number }).n,
        avgSessionSeconds: (avgSession.results[0] as { avg_seconds: number | null }).avg_seconds,
        ratingBreakdown: ratings,
        understoodBreakdown: understood,
        moodChangeBreakdown: moodChange,
        usersAtFreeCapToday: (capHits.results[0] as { n: number }).n,
        returnedUsers: (retention.results[0] as { total: number; returned: number | null }).returned ?? 0,
        totalUsersWithCheckIn: (retention.results[0] as { total: number; returned: number | null }).total,
        alertsLast24h: (alertsLast24h.results[0] as { n: number }).n,
      });
    }

    if (view === "moodPairs") {
      const pairs = await d1
        .prepare(
          `SELECT
             mood_quadrant, matched_mood_quadrant,
             COUNT(*) AS n,
             SUM(CASE WHEN mood_change = 'Better' THEN 1 ELSE 0 END) AS better,
             SUM(CASE WHEN mood_change = 'Same' THEN 1 ELSE 0 END) AS same,
             SUM(CASE WHEN mood_change = 'Worse' THEN 1 ELSE 0 END) AS worse,
             SUM(CASE WHEN understood = 'Yes' THEN 1 ELSE 0 END) AS understood_yes,
             SUM(CASE WHEN partner_rating = 'Great' THEN 1 ELSE 0 END) AS rating_great
           FROM conversation_surveys
           WHERE mood_quadrant IS NOT NULL AND matched_mood_quadrant IS NOT NULL
           GROUP BY mood_quadrant, matched_mood_quadrant
           ORDER BY n DESC`,
        )
        .all();

      const byMode = await d1
        .prepare(
          `SELECT
             ci.match_mode AS match_mode,
             COUNT(*) AS n,
             SUM(CASE WHEN cs.mood_change = 'Better' THEN 1 ELSE 0 END) AS better,
             SUM(CASE WHEN cs.mood_change = 'Same' THEN 1 ELSE 0 END) AS same,
             SUM(CASE WHEN cs.mood_change = 'Worse' THEN 1 ELSE 0 END) AS worse
           FROM conversation_surveys cs
           JOIN check_ins ci ON ci.id = cs.check_in_id
           GROUP BY ci.match_mode`,
        )
        .all();

      // Does how someone's *first* conversation went predict whether they
      // come back at all? Ties each user's first-ever check-in to its
      // survey (if they completed one) and checks for any later check-in.
      const retentionByFirstOutcome = await d1
        .prepare(
          `WITH first_checkins AS (
             SELECT ci.id AS check_in_id, ci.user_email, ci.created_at AS first_at
             FROM check_ins ci
             WHERE ci.created_at = (
               SELECT MIN(created_at) FROM check_ins WHERE user_email = ci.user_email
             )
           )
           SELECT
             cs.mood_change,
             COUNT(*) AS n,
             SUM(CASE WHEN EXISTS (
               SELECT 1 FROM check_ins later
               WHERE later.user_email = fc.user_email
                 AND later.created_at > datetime(fc.first_at, '+1 day')
             ) THEN 1 ELSE 0 END) AS returned
           FROM first_checkins fc
           JOIN conversation_surveys cs ON cs.check_in_id = fc.check_in_id
           WHERE cs.mood_change IS NOT NULL AND cs.mood_change != ''
           GROUP BY cs.mood_change`,
        )
        .all();

      // Compares outcomes for people who got their originally preferred
      // pairing vs. people who accepted a relaxed one after ~60s of
      // waiting -- see worker/realtime.ts's relax() for how that's tracked
      // separately from a genuinely chosen "different" mode.
      const byRelaxed = await d1
        .prepare(
          `SELECT
             matched_relaxed,
             COUNT(*) AS n,
             SUM(CASE WHEN mood_change = 'Better' THEN 1 ELSE 0 END) AS better,
             SUM(CASE WHEN mood_change = 'Same' THEN 1 ELSE 0 END) AS same,
             SUM(CASE WHEN mood_change = 'Worse' THEN 1 ELSE 0 END) AS worse
           FROM conversation_surveys
           WHERE mood_change IS NOT NULL AND mood_change != ''
           GROUP BY matched_relaxed`,
        )
        .all();

      return Response.json({
        pairs: pairs.results,
        byMode: byMode.results,
        retentionByFirstOutcome: retentionByFirstOutcome.results,
        byRelaxed: byRelaxed.results,
      });
    }

    if (view === "alerts") {
      const rows = await d1
        .prepare("SELECT id, type, message, created_at FROM alerts ORDER BY created_at DESC LIMIT 200")
        .all();
      return Response.json({ alerts: rows.results });
    }

    if (view === "reports") {
      const rows = await d1
        .prepare(
          `SELECT
             reported_email,
             COUNT(DISTINCT reporter_email) AS distinct_reporters,
             COUNT(*) AS total_reports,
             MAX(created_at) AS last_report_at,
             (SELECT reason FROM reports r2 WHERE r2.reported_email = r.reported_email ORDER BY created_at DESC LIMIT 1) AS last_reason,
             (SELECT banned_at FROM banned_emails b WHERE b.email = r.reported_email) AS banned_at
           FROM reports r
           GROUP BY reported_email
           ORDER BY distinct_reporters DESC, total_reports DESC, last_report_at DESC
           LIMIT 200`,
        )
        .all();
      return Response.json({ reports: rows.results });
    }

    if (view === "bans") {
      const rows = await d1
        .prepare("SELECT email, report_count, banned_at FROM banned_emails ORDER BY banned_at DESC LIMIT 200")
        .all();
      return Response.json({ bans: rows.results });
    }

    if (view === "blocks") {
      const rows = await d1
        .prepare("SELECT blocker_email, blocked_email, created_at FROM blocks ORDER BY created_at DESC LIMIT 200")
        .all();
      return Response.json({ blocks: rows.results });
    }

    if (view === "feedback") {
      const rows = await d1
        .prepare("SELECT id, user_email, body, created_at FROM feedback ORDER BY created_at DESC LIMIT 200")
        .all();
      return Response.json({ feedback: rows.results });
    }

    if (view === "deleted") {
      const rows = await d1
        .prepare("SELECT id, email, age, gender, country, deleted_at FROM deleted_accounts ORDER BY deleted_at DESC LIMIT 200")
        .all();
      return Response.json({ deleted: rows.results });
    }

    return jsonError("Unknown view");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await ensureDbSchema();
    const admin = await requireAdmin(request);
    if (!admin) return jsonError("Not authorized", 403);

    const d1 = getD1();
    const payload = (await request.json()) as Record<string, unknown>;
    const action = payload.action;

    if (action === "unban") {
      const targetEmail = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
      if (!targetEmail) return jsonError("email is required");
      await d1.batch([
        d1.prepare("DELETE FROM banned_emails WHERE email = ?").bind(targetEmail),
        d1.prepare("UPDATE profiles SET banned_at = NULL WHERE email = ?").bind(targetEmail),
      ]);
      return Response.json({ unbanned: true });
    }

    if (action === "unblock") {
      const blocker = typeof payload.blocker === "string" ? payload.blocker.trim().toLowerCase() : "";
      const blocked = typeof payload.blocked === "string" ? payload.blocked.trim().toLowerCase() : "";
      if (!blocker || !blocked) return jsonError("blocker and blocked are required");
      await d1
        .prepare("DELETE FROM blocks WHERE blocker_email = ? AND blocked_email = ?")
        .bind(blocker, blocked)
        .run();
      return Response.json({ unblocked: true });
    }

    return jsonError("Unknown action");
  } catch (error) {
    return errorResponse(error);
  }
}
