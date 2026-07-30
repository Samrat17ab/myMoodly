import { env } from "cloudflare:workers";
import { ensureDbSchema, getD1 } from "@/db";
import {
  authenticatedRequestEmail,
  type AccessAuthEnv,
} from "@/worker/access-auth";

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
        `SELECT email, age, gender, custom_gender, country, languages, terms_accepted
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
        }
      | undefined;
    const usageRow = usageResult.results[0] as { count?: number } | undefined;

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

      return Response.json({ saved: true });
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
      if (!checkInId || !understood || !moodChange) {
        return jsonError("Complete survey answers are required");
      }

      const id = crypto.randomUUID();
      await d1
        .prepare(
          `INSERT INTO conversation_surveys
            (id, check_in_id, user_email, understood, mood_change)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(id, checkInId, email, understood, moodChange)
        .run();

      return Response.json({ id }, { status: 201 });
    }

    return jsonError("Unknown operation");
  } catch (error) {
    return errorResponse(error);
  }
}
