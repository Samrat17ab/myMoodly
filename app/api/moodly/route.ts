import { env } from "cloudflare:workers";
import { ensureDbSchema, getD1 } from "@/db";
import { recordAlert } from "@/worker/alerts";
import {
  authenticatedRequestEmail,
  type AccessAuthEnv,
} from "@/worker/access-auth";
import { clearSessionCookie } from "@/worker/magic-auth";
import { ensureNickname } from "@/worker/nickname";
import type { SmtpEnv } from "@/worker/smtp";

type ProfilePayload = {
  age?: string | number;
  gender?: string;
  customGender?: string;
  country?: string;
  languages?: string[];
  terms?: boolean;
};

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return jsonError(message, 500);
}

// The client only ever knows a chat partner by their rotating anonymous
// nickname, never their real email -- report/block requests identify the
// target by conversationId instead, and the partner's real email is
// resolved here, server-side, after confirming the caller was actually a
// member of that conversation (so a conversationId can't be used to target
// an arbitrary stranger).
async function resolveConversationPartner(d1: D1Database, conversationId: string, email: string) {
  const members = await d1
    .prepare("SELECT user_email FROM conversation_members WHERE conversation_id = ?")
    .bind(conversationId)
    .all<{ user_email: string }>();
  const emails = members.results.map((row) => row.user_email);
  if (!emails.includes(email)) return null;
  return emails.find((candidate) => candidate !== email) ?? null;
}

export async function GET(request: Request) {
  try {
    await ensureDbSchema();
    const email = await authenticatedRequestEmail(
      request,
      env as unknown as AccessAuthEnv,
      new URL(request.url).searchParams.get("email"),
    );
    if (!email) return jsonError("Authentication required", 401);

    const d1 = getD1();
    const [profileResult, usageResult] = await d1.batch([
      d1.prepare(
        `SELECT email, age, gender, custom_gender, country, languages, terms_accepted,
                nickname, nickname_assigned_at
         FROM profiles WHERE email = ? LIMIT 1`,
      ).bind(email),
      d1.prepare(
        `SELECT COUNT(*) AS count FROM check_ins
         WHERE user_email = ? AND created_at >= datetime('now', 'start of day')`,
      ).bind(email),
    ]);

    const row = profileResult.results[0] as
      | {
          email: string;
          age: number;
          gender: string;
          custom_gender: string;
          country: string;
          languages: string;
          terms_accepted: number;
          nickname: string | null;
          nickname_assigned_at: number | null;
        }
      | undefined;
    const usageRow = usageResult.results[0] as { count?: number } | undefined;

    const nickname = row ? await ensureNickname(d1, email, row) : null;

    return Response.json({
      profile: row
        ? {
            age: String(row.age),
            gender: row.gender,
            customGender: row.custom_gender,
            country: row.country,
            languages: JSON.parse(row.languages) as string[],
            terms: Boolean(row.terms_accepted),
          }
        : null,
      nickname,
      usage: Number(usageRow?.count ?? 0),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await ensureDbSchema();
    const payload = (await request.json()) as Record<string, unknown>;
    const type = payload.type;
    const email = await authenticatedRequestEmail(
      request,
      env as unknown as AccessAuthEnv,
      payload.email,
    );
    if (!email) return jsonError("Authentication required", 401);

    const d1 = getD1();

    if (type === "profile") {
      const profile = payload.profile as ProfilePayload | undefined;
      const age = Number(profile?.age);
      const gender = profile?.gender?.trim() ?? "";
      const country = profile?.country?.trim() ?? "";
      const languages = profile?.languages?.filter(Boolean) ?? [];
      if (
        !Number.isInteger(age) ||
        age < 18 ||
        age > 100 ||
        !gender ||
        !country ||
        !profile?.terms
      ) {
        return jsonError("A valid adult profile is required");
      }

      await d1
        .prepare(
          `INSERT INTO profiles
            (email, age, gender, custom_gender, country, languages, terms_accepted)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(email) DO UPDATE SET
             age = excluded.age,
             gender = excluded.gender,
             custom_gender = excluded.custom_gender,
             country = excluded.country,
             languages = excluded.languages,
             terms_accepted = excluded.terms_accepted,
             updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(
          email,
          age,
          gender,
          profile.customGender?.trim() ?? "",
          country,
          JSON.stringify(languages),
          1,
        )
        .run();

      // Re-applies a permanent ban on every profile create/update, so
      // deleting the account and signing up again under the same email
      // can't undo it -- banned_emails survives deletion, profiles doesn't.
      await d1
        .prepare(
          `UPDATE profiles
           SET banned_at = COALESCE(banned_at, (SELECT banned_at FROM banned_emails WHERE email = ?))
           WHERE email = ?`,
        )
        .bind(email, email)
        .run();

      const nicknameRow = await d1
        .prepare(
          "SELECT nickname, nickname_assigned_at FROM profiles WHERE email = ?",
        )
        .bind(email)
        .first<{ nickname: string | null; nickname_assigned_at: number | null }>();
      const nickname = await ensureNickname(d1, email, nicknameRow ?? null);

      return Response.json({ saved: true, nickname });
    }

    if (type === "check-in") {
      const id = crypto.randomUUID();
      const energy = payload.energy;
      const pleasant = payload.pleasant;
      const quadrant = payload.quadrant;
      const emotion = typeof payload.emotion === "string" ? payload.emotion.trim() : "";
      const note = typeof payload.note === "string" ? payload.note.trim().slice(0, 80) : "";
      const matchMode = payload.matchMode;
      if (
        !["high", "low"].includes(String(energy)) ||
        typeof pleasant !== "boolean" ||
        !["red", "yellow", "green", "blue"].includes(String(quadrant)) ||
        !emotion ||
        !["similar", "different"].includes(String(matchMode))
      ) {
        return jsonError("A complete mood check-in is required");
      }

      await d1
        .prepare(
          `INSERT INTO check_ins
            (id, user_email, energy, pleasant, quadrant, emotion, note, match_mode)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          email,
          energy,
          pleasant ? 1 : 0,
          quadrant,
          emotion,
          note,
          matchMode,
        )
        .run();

      return Response.json({ id }, { status: 201 });
    }

    if (type === "message") {
      const checkInId =
        typeof payload.checkInId === "string" ? payload.checkInId : "";
      const body =
        typeof payload.body === "string" ? payload.body.trim().slice(0, 1000) : "";
      if (!checkInId || !body) return jsonError("checkInId and body are required");

      const id = crypto.randomUUID();
      await d1
        .prepare(
          `INSERT INTO chat_messages (id, check_in_id, sender_email, body)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(id, checkInId, email, body)
        .run();

      return Response.json({ id }, { status: 201 });
    }

    if (type === "survey") {
      const checkInId =
        typeof payload.checkInId === "string" ? payload.checkInId : "";
      const understood =
        typeof payload.understood === "string" ? payload.understood : "";
      const moodChange =
        typeof payload.moodChange === "string" ? payload.moodChange : "";
      const partnerRating =
        typeof payload.partnerRating === "string" ? payload.partnerRating : "";
      if (
        !checkInId ||
        !understood ||
        !moodChange ||
        !["Great", "Okay", "Not for me"].includes(partnerRating)
      ) {
        return jsonError("Complete survey answers are required");
      }

      const [ownCheckInResult, partnerCheckInResult, profileResult, sessionResult] =
        await d1.batch([
          d1
            .prepare(
              "SELECT quadrant, emotion FROM check_ins WHERE id = ? AND user_email = ? LIMIT 1",
            )
            .bind(checkInId, email),
          d1
            .prepare(
              `SELECT other_ci.quadrant AS quadrant, other_ci.emotion AS emotion,
                      other_mt.user_email AS partner_email,
                      mt.relaxed_at IS NOT NULL AS was_relaxed
               FROM matchmaking_tickets mt
               JOIN matchmaking_tickets other_mt
                 ON other_mt.conversation_id = mt.conversation_id
                AND other_mt.user_email <> mt.user_email
               JOIN check_ins other_ci ON other_ci.id = other_mt.check_in_id
               WHERE mt.check_in_id = ?
                 AND mt.user_email = ?
                 AND mt.conversation_id IS NOT NULL
               ORDER BY other_mt.created_at DESC
               LIMIT 1`,
            )
            .bind(checkInId, email),
          d1.prepare("SELECT age, gender FROM profiles WHERE email = ? LIMIT 1").bind(email),
          d1
            .prepare(
              `SELECT CAST(ROUND((julianday(c.ended_at) - julianday(c.created_at)) * 86400) AS INTEGER) AS seconds
               FROM matchmaking_tickets mt
               JOIN conversations c ON c.id = mt.conversation_id
               WHERE mt.check_in_id = ?
                 AND mt.user_email = ?
                 AND c.ended_at IS NOT NULL
               ORDER BY mt.created_at DESC
               LIMIT 1`,
            )
            .bind(checkInId, email),
        ]);

      const ownCheckIn = ownCheckInResult.results[0] as
        | { quadrant: string; emotion: string }
        | undefined;
      if (!ownCheckIn) return jsonError("Check-in not found", 404);
      const partnerCheckIn = partnerCheckInResult.results[0] as
        | { quadrant: string; emotion: string; partner_email: string | null; was_relaxed: number }
        | undefined;
      const profile = profileResult.results[0] as
        | { age: number; gender: string }
        | undefined;
      const session = sessionResult.results[0] as { seconds: number | null } | undefined;

      const id = crypto.randomUUID();
      await d1
        .prepare(
          `INSERT INTO conversation_surveys
            (id, check_in_id, user_email, understood, mood_change,
             mood_quadrant, mood_emotion, matched_mood_quadrant, matched_mood_emotion,
             age, gender, chat_session_seconds, partner_rating, matched_relaxed)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          checkInId,
          email,
          understood,
          moodChange,
          ownCheckIn.quadrant,
          ownCheckIn.emotion,
          partnerCheckIn?.quadrant ?? null,
          partnerCheckIn?.emotion ?? null,
          profile?.age ?? null,
          profile?.gender ?? null,
          session?.seconds ?? null,
          partnerRating,
          partnerCheckIn?.was_relaxed ?? 0,
        )
        .run();

      // A low rating is a low-stakes "we just weren't a fit" signal, not a
      // report -- so it quietly excludes this pairing from future matches
      // (same mechanism as an explicit block) without accusing anyone of
      // anything or notifying either side.
      if (partnerRating === "Not for me" && partnerCheckIn?.partner_email) {
        await d1
          .prepare("INSERT OR IGNORE INTO blocks (blocker_email, blocked_email) VALUES (?, ?)")
          .bind(email, partnerCheckIn.partner_email)
          .run();
      }

      return Response.json({ id }, { status: 201 });
    }

    if (type === "block") {
      const conversationId = typeof payload.conversationId === "string" ? payload.conversationId : "";
      const targetEmail = conversationId
        ? await resolveConversationPartner(d1, conversationId, email)
        : null;
      if (!targetEmail) return jsonError("Conversation not found", 404);

      await d1
        .prepare("INSERT OR IGNORE INTO blocks (blocker_email, blocked_email) VALUES (?, ?)")
        .bind(email, targetEmail)
        .run();

      return Response.json({ blocked: true });
    }

    if (type === "report") {
      const conversationId = typeof payload.conversationId === "string" ? payload.conversationId : "";
      const reason = typeof payload.reason === "string" ? payload.reason.trim().slice(0, 200) : "";
      const targetEmail = conversationId
        ? await resolveConversationPartner(d1, conversationId, email)
        : null;
      if (!targetEmail) return jsonError("Conversation not found", 404);
      if (!reason) return jsonError("A report reason is required");

      const id = crypto.randomUUID();
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO reports (id, reporter_email, reported_email, conversation_id, reason)
             VALUES (?, ?, ?, ?, ?)`,
          )
          .bind(id, email, targetEmail, conversationId, reason),
        // Reporting someone implies you don't want to be matched with them
        // again either, so it carries the same future-match exclusion as an
        // explicit block.
        d1
          .prepare("INSERT OR IGNORE INTO blocks (blocker_email, blocked_email) VALUES (?, ?)")
          .bind(email, targetEmail),
      ]);

      await recordAlert(
        d1,
        env as unknown as SmtpEnv,
        "report",
        `${email} reported ${targetEmail} (${reason}).`,
      );

      // Distinct reporters, not raw report rows, so one person can't fake a
      // ban by reporting the same target repeatedly.
      const distinctReporters = await d1
        .prepare("SELECT COUNT(DISTINCT reporter_email) AS count FROM reports WHERE reported_email = ?")
        .bind(targetEmail)
        .first<{ count: number }>();
      const reportCount = distinctReporters?.count ?? 0;
      if (reportCount >= 3) {
        await d1.batch([
          d1
            .prepare("UPDATE profiles SET banned_at = unixepoch() WHERE email = ? AND banned_at IS NULL")
            .bind(targetEmail),
          // The permanent record -- profiles.banned_at alone wouldn't survive
          // the reported user deleting their account and signing up again.
          d1
            .prepare("INSERT OR IGNORE INTO banned_emails (email, report_count) VALUES (?, ?)")
            .bind(targetEmail, reportCount),
        ]);
        await recordAlert(
          d1,
          env as unknown as SmtpEnv,
          "ban",
          `${targetEmail} was permanently banned after ${reportCount} distinct reports.`,
        );
      }

      return Response.json({ id, reported: true });
    }

    if (type === "feedback") {
      const body = typeof payload.body === "string" ? payload.body.trim().slice(0, 1000) : "";
      if (!body) return jsonError("Feedback can't be empty");

      const id = crypto.randomUUID();
      await d1
        .prepare("INSERT INTO feedback (id, user_email, body) VALUES (?, ?, ?)")
        .bind(id, email, body)
        .run();

      return Response.json({ id }, { status: 201 });
    }

    return jsonError("Unknown operation");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureDbSchema();
    const email = await authenticatedRequestEmail(
      request,
      env as unknown as AccessAuthEnv,
    );
    if (!email) return jsonError("Authentication required", 401);

    const d1 = getD1();
    const profile = await d1
      .prepare("SELECT age, gender, country FROM profiles WHERE email = ? LIMIT 1")
      .bind(email)
      .first<{ age: number; gender: string; country: string }>();

    await d1.batch([
      // A permanent record that this account existed and was deleted --
      // profiles, check_ins, and conversation history all disappear below,
      // but feedback/reports/bans (kept in their own tables, not linked by
      // foreign key) stay queryable by email regardless.
      d1
        .prepare(
          "INSERT INTO deleted_accounts (id, email, age, gender, country) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(crypto.randomUUID(), email, profile?.age ?? null, profile?.gender ?? null, profile?.country ?? null),
      d1.prepare("DELETE FROM profiles WHERE email = ?").bind(email),
      d1.prepare("DELETE FROM auth_sessions WHERE user_email = ?").bind(email),
      d1.prepare("DELETE FROM oauth_identities WHERE user_email = ?").bind(email),
      d1.prepare("DELETE FROM otp_codes WHERE email = ?").bind(email),
    ]);

    return Response.json(
      { deleted: true },
      { headers: { "set-cookie": clearSessionCookie() } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
