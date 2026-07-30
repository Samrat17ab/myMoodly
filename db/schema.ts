import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("conversation_surveys_check_in_idx").on(table.checkInId),
  ],
);
