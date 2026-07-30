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
    ]);
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });

  return schemaReady;
}
