import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

export function getD1() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB`.",
    );
  }

  return env.DB;
}

let schemaReady: Promise<void> | null = null;

// conversation_surveys predates these columns, so existing deployments need
// them added and backfilled rather than just created fresh. Backfill only
// runs when a column is actually added this call -- once migrated, every new
// row is written with real values already, so re-scanning for NULLs on every
// cold isolate forever would be pure wasted D1 round-trips.
async function ensureConversationSurveyColumns(d1: D1Database) {
  const columns = await d1
    .prepare("PRAGMA table_info(conversation_surveys)")
    .all<{ name: string }>();
  const existing = new Set(columns.results.map((column) => column.name));

  const moodColumns = [
    ["mood_quadrant", "TEXT"],
    ["mood_emotion", "TEXT"],
    ["matched_mood_quadrant", "TEXT"],
    ["matched_mood_emotion", "TEXT"],
  ] as const;
  const demographicColumns = [
    ["age", "INTEGER"],
    ["gender", "TEXT"],
    ["chat_session_seconds", "INTEGER"],
  ] as const;

  const missingMood = moodColumns.filter(([name]) => !existing.has(name));
  const missingDemographic = demographicColumns.filter(
    ([name]) => !existing.has(name),
  );
  const allMissing = [...missingMood, ...missingDemographic];

  if (allMissing.length > 0) {
    await d1.batch(
      allMissing.map(([name, type]) =>
        d1.prepare(`ALTER TABLE conversation_surveys ADD COLUMN ${name} ${type}`),
      ),
    );
  }

  const backfillStatements = [];
  if (missingMood.length > 0) {
    backfillStatements.push(
      d1.prepare(
        `UPDATE conversation_surveys
         SET mood_quadrant = (SELECT quadrant FROM check_ins WHERE check_ins.id = conversation_surveys.check_in_id),
             mood_emotion = (SELECT emotion FROM check_ins WHERE check_ins.id = conversation_surveys.check_in_id)
         WHERE mood_quadrant IS NULL`,
      ),
      d1.prepare(
        `UPDATE conversation_surveys
         SET matched_mood_quadrant = (
               SELECT other_ci.quadrant
               FROM matchmaking_tickets mt
               JOIN matchmaking_tickets other_mt
                 ON other_mt.conversation_id = mt.conversation_id
                AND other_mt.user_email <> mt.user_email
               JOIN check_ins other_ci ON other_ci.id = other_mt.check_in_id
               WHERE mt.check_in_id = conversation_surveys.check_in_id
                 AND mt.user_email = conversation_surveys.user_email
               ORDER BY other_mt.created_at DESC LIMIT 1
             ),
             matched_mood_emotion = (
               SELECT other_ci.emotion
               FROM matchmaking_tickets mt
               JOIN matchmaking_tickets other_mt
                 ON other_mt.conversation_id = mt.conversation_id
                AND other_mt.user_email <> mt.user_email
               JOIN check_ins other_ci ON other_ci.id = other_mt.check_in_id
               WHERE mt.check_in_id = conversation_surveys.check_in_id
                 AND mt.user_email = conversation_surveys.user_email
               ORDER BY other_mt.created_at DESC LIMIT 1
             )
         WHERE matched_mood_quadrant IS NULL`,
      ),
    );
  }
  if (missingDemographic.length > 0) {
    backfillStatements.push(
      d1.prepare(
        `UPDATE conversation_surveys
         SET age = (SELECT age FROM profiles WHERE profiles.email = conversation_surveys.user_email),
             gender = (SELECT gender FROM profiles WHERE profiles.email = conversation_surveys.user_email)
         WHERE age IS NULL`,
      ),
      d1.prepare(
        `UPDATE conversation_surveys
         SET chat_session_seconds = (
               SELECT CAST(ROUND((julianday(c.ended_at) - julianday(c.created_at)) * 86400) AS INTEGER)
               FROM matchmaking_tickets mt
               JOIN conversations c ON c.id = mt.conversation_id
               WHERE mt.check_in_id = conversation_surveys.check_in_id
                 AND mt.user_email = conversation_surveys.user_email
                 AND c.ended_at IS NOT NULL
               ORDER BY mt.created_at DESC LIMIT 1
             )
         WHERE chat_session_seconds IS NULL`,
      ),
    );
  }
  if (backfillStatements.length > 0) {
    await d1.batch(backfillStatements);
  }
}

// profiles predates the nickname columns, so existing rows need them added
// rather than just created fresh.
async function ensureProfileNicknameColumns(d1: D1Database) {
  const columns = await d1
    .prepare("PRAGMA table_info(profiles)")
    .all<{ name: string }>();
  const existing = new Set(columns.results.map((column) => column.name));

  const missing = (
    [
      ["nickname", "TEXT"],
      ["nickname_assigned_at", "INTEGER"],
    ] as const
  ).filter(([name]) => !existing.has(name));

  if (missing.length > 0) {
    await d1.batch(
      missing.map(([name, type]) =>
        d1.prepare(`ALTER TABLE profiles ADD COLUMN ${name} ${type}`),
      ),
    );
  }
}

export function ensureDbSchema() {
  schemaReady ??= (async () => {
    const d1 = getD1();
    await d1.batch([
      d1.prepare(`CREATE TABLE IF NOT EXISTS profiles (
        email TEXT PRIMARY KEY NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        custom_gender TEXT NOT NULL DEFAULT '',
        country TEXT NOT NULL,
        languages TEXT NOT NULL,
        terms_accepted INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS check_ins (
        id TEXT PRIMARY KEY NOT NULL,
        user_email TEXT NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
        energy TEXT NOT NULL,
        pleasant INTEGER NOT NULL,
        quadrant TEXT NOT NULL,
        emotion TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        match_mode TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY NOT NULL,
        check_in_id TEXT NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
        sender_email TEXT NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS conversation_surveys (
        id TEXT PRIMARY KEY NOT NULL,
        check_in_id TEXT NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
        user_email TEXT NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
        understood TEXT NOT NULL,
        mood_change TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`),
      d1.prepare(
        "CREATE INDEX IF NOT EXISTS check_ins_user_created_idx ON check_ins (user_email, created_at)",
      ),
      d1.prepare(
        "CREATE INDEX IF NOT EXISTS chat_messages_check_in_created_idx ON chat_messages (check_in_id, created_at)",
      ),
      d1.prepare(
        "CREATE INDEX IF NOT EXISTS conversation_surveys_check_in_idx ON conversation_surveys (check_in_id)",
      ),
      d1.prepare(`CREATE TABLE IF NOT EXISTS matchmaking_tickets (
        id TEXT PRIMARY KEY NOT NULL,
        user_email TEXT NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
        check_in_id TEXT NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
        match_mode TEXT NOT NULL,
        quadrant TEXT NOT NULL,
        languages TEXT NOT NULL,
        status TEXT NOT NULL,
        conversation_id TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ended_at TEXT
      )`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS conversation_members (
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_email TEXT NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
        anonymous_name TEXT NOT NULL,
        joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (conversation_id, user_email)
      )`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS conversation_messages (
        id TEXT PRIMARY KEY NOT NULL,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_email TEXT NOT NULL REFERENCES profiles(email) ON DELETE CASCADE,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`),
      d1.prepare(
        "CREATE INDEX IF NOT EXISTS matchmaking_tickets_status_created_idx ON matchmaking_tickets (status, created_at)",
      ),
      d1.prepare(
        "CREATE INDEX IF NOT EXISTS matchmaking_tickets_user_idx ON matchmaking_tickets (user_email)",
      ),
      d1.prepare(
        "CREATE UNIQUE INDEX IF NOT EXISTS conversation_members_user_conversation_idx ON conversation_members (user_email, conversation_id)",
      ),
      d1.prepare(
        "CREATE INDEX IF NOT EXISTS conversation_messages_room_created_idx ON conversation_messages (conversation_id, created_at)",
      ),
      d1.prepare(`CREATE TABLE IF NOT EXISTS otp_codes (
        code_hash TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        requested_at INTEGER NOT NULL DEFAULT (unixepoch()),
        attempts INTEGER NOT NULL DEFAULT 0,
        used_at INTEGER
      )`),
      d1.prepare(
        "CREATE INDEX IF NOT EXISTS otp_codes_email_requested_idx ON otp_codes (email, requested_at)",
      ),
      d1.prepare(`CREATE TABLE IF NOT EXISTS auth_sessions (
        token_hash TEXT PRIMARY KEY NOT NULL,
        user_email TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`),
      d1.prepare(
        "CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions (user_email)",
      ),
      d1.prepare(
        "CREATE INDEX IF NOT EXISTS auth_sessions_expires_idx ON auth_sessions (expires_at)",
      ),
      d1.prepare(`CREATE TABLE IF NOT EXISTS oauth_states (
        state_hash TEXT PRIMARY KEY NOT NULL,
        code_verifier TEXT NOT NULL,
        nonce TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`),
      d1.prepare(
        "CREATE INDEX IF NOT EXISTS oauth_states_expires_idx ON oauth_states (expires_at)",
      ),
      d1.prepare(`CREATE TABLE IF NOT EXISTS oauth_identities (
        provider TEXT NOT NULL,
        subject TEXT NOT NULL,
        user_email TEXT NOT NULL,
        email_at_login TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
        PRIMARY KEY (provider, subject)
      )`),
      d1.prepare(
        "CREATE INDEX IF NOT EXISTS oauth_identities_user_idx ON oauth_identities (user_email)",
      ),
    ]);
    await ensureConversationSurveyColumns(d1);
    await ensureProfileNicknameColumns(d1);
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });

  return schemaReady;
}
