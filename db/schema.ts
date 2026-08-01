import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  email: text("email").primaryKey(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  customGender: text("custom_gender").notNull().default(""),
  country: text("country").notNull(),
  languages: text("languages", { mode: "json" })
    .$type<string[]>()
    .notNull(),
  termsAccepted: integer("terms_accepted", { mode: "boolean" }).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const checkIns = sqliteTable(
  "check_ins",
  {
    id: text("id").primaryKey(),
    userEmail: text("user_email")
      .notNull()
      .references(() => profiles.email, { onDelete: "cascade" }),
    energy: text("energy", { enum: ["high", "low"] }).notNull(),
    pleasant: integer("pleasant", { mode: "boolean" }).notNull(),
    quadrant: text("quadrant", {
      enum: ["red", "yellow", "green", "blue"],
    }).notNull(),
    emotion: text("emotion").notNull(),
    note: text("note").notNull().default(""),
    matchMode: text("match_mode", {
      enum: ["similar", "different"],
    }).notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("check_ins_user_created_idx").on(table.userEmail, table.createdAt),
  ],
);

export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: text("id").primaryKey(),
    checkInId: text("check_in_id")
      .notNull()
      .references(() => checkIns.id, { onDelete: "cascade" }),
    senderEmail: text("sender_email")
      .notNull()
      .references(() => profiles.email, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("chat_messages_check_in_created_idx").on(
      table.checkInId,
      table.createdAt,
    ),
  ],
);

export const conversationSurveys = sqliteTable(
  "conversation_surveys",
  {
    id: text("id").primaryKey(),
    checkInId: text("check_in_id")
      .notNull()
      .references(() => checkIns.id, { onDelete: "cascade" }),
    userEmail: text("user_email")
      .notNull()
      .references(() => profiles.email, { onDelete: "cascade" }),
    understood: text("understood").notNull(),
    moodChange: text("mood_change").notNull(),
    moodQuadrant: text("mood_quadrant"),
    moodEmotion: text("mood_emotion"),
    matchedMoodQuadrant: text("matched_mood_quadrant"),
    matchedMoodEmotion: text("matched_mood_emotion"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("conversation_surveys_check_in_idx").on(table.checkInId),
  ],
);

export const matchmakingTickets = sqliteTable(
  "matchmaking_tickets",
  {
    id: text("id").primaryKey(),
    userEmail: text("user_email")
      .notNull()
      .references(() => profiles.email, { onDelete: "cascade" }),
    checkInId: text("check_in_id")
      .notNull()
      .references(() => checkIns.id, { onDelete: "cascade" }),
    matchMode: text("match_mode", {
      enum: ["similar", "different"],
    }).notNull(),
    quadrant: text("quadrant", {
      enum: ["red", "yellow", "green", "blue"],
    }).notNull(),
    languages: text("languages", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    status: text("status", {
      enum: ["waiting", "matched", "cancelled", "expired"],
    }).notNull(),
    conversationId: text("conversation_id"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("matchmaking_tickets_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
    index("matchmaking_tickets_user_idx").on(table.userEmail),
  ],
);

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  status: text("status", { enum: ["active", "ended"] }).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  endedAt: text("ended_at"),
});

export const conversationMembers = sqliteTable(
  "conversation_members",
  {
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userEmail: text("user_email")
      .notNull()
      .references(() => profiles.email, { onDelete: "cascade" }),
    anonymousName: text("anonymous_name").notNull(),
    joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.userEmail] }),
    uniqueIndex("conversation_members_user_conversation_idx").on(
      table.userEmail,
      table.conversationId,
    ),
  ],
);

export const conversationMessages = sqliteTable(
  "conversation_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderEmail: text("sender_email")
      .notNull()
      .references(() => profiles.email, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("conversation_messages_room_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);

export const otpCodes = sqliteTable(
  "otp_codes",
  {
    codeHash: text("code_hash").primaryKey(),
    email: text("email").notNull(),
    expiresAt: integer("expires_at").notNull(),
    requestedAt: integer("requested_at")
      .notNull()
      .default(sql`(unixepoch())`),
    attempts: integer("attempts").notNull().default(0),
    usedAt: integer("used_at"),
  },
  (table) => [
    index("otp_codes_email_requested_idx").on(table.email, table.requestedAt),
  ],
);

export const authSessions = sqliteTable(
  "auth_sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userEmail: text("user_email").notNull(),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("auth_sessions_user_idx").on(table.userEmail),
    index("auth_sessions_expires_idx").on(table.expiresAt),
  ],
);

export const oauthStates = sqliteTable(
  "oauth_states",
  {
    stateHash: text("state_hash").primaryKey(),
    codeVerifier: text("code_verifier").notNull(),
    nonce: text("nonce").notNull(),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("oauth_states_expires_idx").on(table.expiresAt),
  ],
);

export const oauthIdentities = sqliteTable(
  "oauth_identities",
  {
    provider: text("provider").notNull(),
    subject: text("subject").notNull(),
    userEmail: text("user_email").notNull(),
    emailAtLogin: text("email_at_login").notNull(),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.subject] }),
    index("oauth_identities_user_idx").on(table.userEmail),
  ],
);
