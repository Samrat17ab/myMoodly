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
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });

  return schemaReady;
}
