import { DurableObject } from "cloudflare:workers";
import type { AccessAuthEnv } from "./access-auth";
import { ensureNickname } from "./nickname";

export interface RealtimeEnv extends AccessAuthEnv {
  DB: D1Database;
  MATCHMAKER: DurableObjectNamespace<Matchmaker>;
  CHAT_ROOMS: DurableObjectNamespace<ChatRoom>;
}

type ConnectionAttachment = {
  conversationId: string;
  email: string;
  anonymousName: string;
};

type TicketRow = {
  id: string;
  status: "waiting" | "matched" | "cancelled" | "expired";
  conversation_id: string | null;
};

type WaitingTicketRow = {
  id: string;
  user_email: string;
  match_mode: "similar" | "different";
  quadrant: "red" | "yellow" | "green" | "blue";
  languages: string;
};

const WAITING_TICKET_LIFETIME = "-2 minutes";
const WAITING_HEARTBEAT_TIMEOUT = "-15 seconds";
const LEGACY_CONVERSATION_LIFETIME = "-20 minutes";
const MINIMUM_MATCH_WAIT_SECONDS = 3;
const SYNCHRONIZED_CHAT_DELAY_SECONDS = 2;
const CHAT_DURATION_SECONDS = 20 * 60;

// D1 timestamps come back either as our own `Date.toISOString()` strings
// (already has "T" and "Z") or as SQLite's `CURRENT_TIMESTAMP`/`datetime()`
// format ("YYYY-MM-DD HH:MM:SS", no "T" or "Z"). Normalize before Date.parse.
function parseSqliteTimestamp(value: string): number {
  return Date.parse(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
}

// A user's anonymous name to conversation partners is their own profile
// nickname (worker/nickname.ts), so what a partner sees always matches what
// that user sees for themselves in Settings, and only changes when their
// nickname rotates (every 24h) rather than per conversation.
async function createConversationWithMemberNicknames(
  d1: D1Database,
  conversationId: string,
  conversationCreatedAt: string,
  conversationExpiresAt: string,
  memberA: string,
  memberB: string,
  ticketIds: [string, string],
) {
  const profileRows = await d1
    .prepare(
      "SELECT email, nickname, nickname_assigned_at FROM profiles WHERE email IN (?, ?)",
    )
    .bind(memberA, memberB)
    .all<{ email: string; nickname: string | null; nickname_assigned_at: number | null }>();
  const profileByEmail = new Map(
    profileRows.results.map((row) => [row.email, row]),
  );
  const [nameA, nameB] = await Promise.all([
    ensureNickname(d1, memberA, profileByEmail.get(memberA) ?? null),
    ensureNickname(d1, memberB, profileByEmail.get(memberB) ?? null),
  ]);

  await d1.batch([
    d1
      .prepare(
        `INSERT INTO conversations (id, status, created_at, expires_at)
         VALUES (?, 'active', ?, ?)`,
      )
      .bind(conversationId, conversationCreatedAt, conversationExpiresAt),
    d1
      .prepare(
        `INSERT INTO conversation_members
          (conversation_id, user_email, anonymous_name) VALUES (?, ?, ?)`,
      )
      .bind(conversationId, memberA, nameA),
    d1
      .prepare(
        `INSERT INTO conversation_members
          (conversation_id, user_email, anonymous_name) VALUES (?, ?, ?)`,
      )
      .bind(conversationId, memberB, nameB),
    d1
      .prepare(
        `UPDATE matchmaking_tickets
         SET status = 'matched', conversation_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id IN (?, ?) AND status = 'waiting'`,
      )
      .bind(conversationId, ticketIds[0], ticketIds[1]),
  ]);
}

async function ensureRealtimeSchema(d1: D1Database) {
  await d1.batch([
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
      ended_at TEXT,
      expires_at TEXT
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
      "CREATE INDEX IF NOT EXISTS conversation_messages_room_created_idx ON conversation_messages (conversation_id, created_at)",
    ),
  ]);
  await ensureConversationsExpiryColumn(d1);
}

// conversations predates expires_at, so existing deployments need it added
// and backfilled from their fixed 20-minute window. Only runs the backfill
// the one time the column is actually added -- see the equivalent fix in
// db/index.ts for why an unconditional backfill on every request is wasteful.
async function ensureConversationsExpiryColumn(d1: D1Database) {
  const columns = await d1
    .prepare("PRAGMA table_info(conversations)")
    .all<{ name: string }>();
  const hasExpiresAt = columns.results.some((column) => column.name === "expires_at");
  if (hasExpiresAt) return;

  await d1.prepare("ALTER TABLE conversations ADD COLUMN expires_at TEXT").run();
  await d1
    .prepare(
      `UPDATE conversations
       SET expires_at = datetime(created_at, '+20 minutes')
       WHERE expires_at IS NULL`,
    )
    .run();
}

async function expireStaleRealtimeState(d1: D1Database) {
  await d1.batch([
    d1.prepare(
      `UPDATE matchmaking_tickets
       SET status = 'expired', updated_at = CURRENT_TIMESTAMP
       WHERE status = 'waiting'
         AND (
           created_at < datetime('now', ?)
           OR updated_at < datetime('now', ?)
         )`,
    ).bind(WAITING_TICKET_LIFETIME, WAITING_HEARTBEAT_TIMEOUT),
    d1.prepare(
      `UPDATE conversations
       SET status = 'ended', ended_at = CURRENT_TIMESTAMP
       WHERE status = 'active'
         AND (
           (expires_at IS NOT NULL AND expires_at <= datetime('now'))
           OR (expires_at IS NULL AND created_at < datetime('now', ?))
         )`,
    ).bind(LEGACY_CONVERSATION_LIFETIME),
    d1.prepare(
      `UPDATE matchmaking_tickets
       SET status = 'expired', updated_at = CURRENT_TIMESTAMP
       WHERE status = 'matched'
         AND conversation_id IN (
           SELECT id FROM conversations WHERE status <> 'active'
         )`,
    ),
  ]);
}

async function ticketResponse(d1: D1Database, ticket: TicketRow, email: string) {
  if (ticket.status !== "matched" || !ticket.conversation_id) {
    return { ticketId: ticket.id, status: ticket.status };
  }

  const partner = await d1
    .prepare(
      `SELECT
         cm.anonymous_name,
         ci.emotion,
         ci.note,
         strftime(
           '%Y-%m-%dT%H:%M:%fZ',
           c.created_at,
           '+' || ? || ' seconds'
         ) AS chat_starts_at
       FROM conversation_members cm
       JOIN conversations c ON c.id = cm.conversation_id
       LEFT JOIN matchmaking_tickets mt
         ON mt.conversation_id = cm.conversation_id
        AND mt.user_email = cm.user_email
       LEFT JOIN check_ins ci ON ci.id = mt.check_in_id
       WHERE cm.conversation_id = ? AND cm.user_email <> ?
       ORDER BY mt.created_at DESC
       LIMIT 1`,
    )
    .bind(SYNCHRONIZED_CHAT_DELAY_SECONDS, ticket.conversation_id, email)
    .first<{
      anonymous_name: string;
      emotion: string | null;
      note: string | null;
      chat_starts_at: string;
    }>();

  return {
    ticketId: ticket.id,
    status: ticket.status,
    conversationId: ticket.conversation_id,
    partnerName: partner?.anonymous_name ?? "Anonymous partner",
    partnerEmotion: partner?.emotion ?? "",
    partnerNote: partner?.note ?? "",
    chatStartsAt: partner?.chat_starts_at ?? new Date().toISOString(),
  };
}

export class Matchmaker extends DurableObject<RealtimeEnv> {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    await ensureRealtimeSchema(this.env.DB);
    await expireStaleRealtimeState(this.env.DB);
    const email = request.headers.get("x-moodly-user-email")?.trim().toLowerCase();
    if (!email) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const action = payload.action;
    if (action === "join") return this.join(email, payload);
    if (action === "status") return this.status(email, payload);
    if (action === "cancel") return this.cancel(email, payload);
    return Response.json({ error: "Unknown matchmaking action" }, { status: 400 });
  }

  private async join(email: string, payload: Record<string, unknown>) {
    const checkInId = typeof payload.checkInId === "string" ? payload.checkInId : "";
    const matchMode = payload.matchMode;
    const quadrant = payload.quadrant;
    const languages = Array.isArray(payload.languages)
      ? payload.languages.filter((item): item is string => typeof item === "string")
      : [];

    if (
      !checkInId ||
      !["similar", "different"].includes(String(matchMode)) ||
      !["red", "yellow", "green", "blue"].includes(String(quadrant)) ||
      languages.length === 0
    ) {
      return Response.json({ error: "A complete matching request is required" }, { status: 400 });
    }

    const ownsCheckIn = await this.env.DB
      .prepare("SELECT id FROM check_ins WHERE id = ? AND user_email = ? LIMIT 1")
      .bind(checkInId, email)
      .first();
    if (!ownsCheckIn) {
      return Response.json({ error: "Check-in not found" }, { status: 404 });
    }

    const existing = await this.env.DB
      .prepare(
        `SELECT id, status, conversation_id
         FROM matchmaking_tickets
         WHERE user_email = ?
           AND status = 'waiting'
         ORDER BY created_at DESC LIMIT 1`,
      )
      .bind(email)
      .first<TicketRow>();
    if (existing) {
      return Response.json(await ticketResponse(this.env.DB, existing, email));
    }

    const ticketId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await this.env.DB
      .prepare(
        `INSERT INTO matchmaking_tickets
          (id, user_email, check_in_id, match_mode, quadrant, languages, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'waiting', ?, ?)`,
      )
      .bind(
        ticketId,
        email,
        checkInId,
        matchMode,
        quadrant,
        JSON.stringify(languages),
        createdAt,
        createdAt,
      )
      .run();
    return Response.json({ ticketId, status: "waiting" }, { status: 201 });
  }

  private async status(email: string, payload: Record<string, unknown>) {
    const ticketId = typeof payload.ticketId === "string" ? payload.ticketId : "";
    await this.env.DB
      .prepare(
        `UPDATE matchmaking_tickets SET updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_email = ? AND status = 'waiting'`,
      )
      .bind(ticketId, email)
      .run();
    await this.tryMatch(email, ticketId);
    const ticket = await this.env.DB
      .prepare(
        `SELECT id, status, conversation_id FROM matchmaking_tickets
         WHERE id = ? AND user_email = ? LIMIT 1`,
      )
      .bind(ticketId, email)
      .first<TicketRow>();
    if (!ticket) {
      return Response.json({ error: "Matchmaking ticket not found" }, { status: 404 });
    }
    return Response.json(await ticketResponse(this.env.DB, ticket, email));
  }

  private async tryMatch(email: string, ticketId: string) {
    const current = await this.env.DB
      .prepare(
        `SELECT id, user_email, match_mode, quadrant, languages
         FROM matchmaking_tickets
         WHERE id = ?
           AND user_email = ?
           AND status = 'waiting'
           AND julianday(created_at) <= julianday('now', '-' || ? || ' seconds')
         LIMIT 1`,
      )
      .bind(ticketId, email, MINIMUM_MATCH_WAIT_SECONDS)
      .first<WaitingTicketRow>();
    if (!current) return;

    const candidate = await this.env.DB
      .prepare(
        `SELECT mt.id, mt.user_email, mt.match_mode, mt.quadrant, mt.languages
         FROM matchmaking_tickets mt
         WHERE mt.status = 'waiting'
           AND mt.user_email <> ?
           AND mt.created_at >= datetime('now', '-2 minutes')
           AND mt.updated_at >= datetime('now', '-15 seconds')
           AND julianday(mt.created_at) <= julianday('now', '-' || ? || ' seconds')
           AND EXISTS (
             SELECT 1
             FROM json_each(mt.languages) candidate_language
             JOIN json_each(?) current_language
               ON lower(candidate_language.value) = lower(current_language.value)
           )
           AND (
             (? = 'similar' AND mt.quadrant = ?)
             OR (? = 'different' AND mt.quadrant <> ?)
           )
           AND (
             (mt.match_mode = 'similar' AND mt.quadrant = ?)
             OR (mt.match_mode = 'different' AND mt.quadrant <> ?)
           )
         ORDER BY mt.created_at ASC
         LIMIT 1`,
      )
      .bind(
        email,
        MINIMUM_MATCH_WAIT_SECONDS,
        current.languages,
        current.match_mode,
        current.quadrant,
        current.match_mode,
        current.quadrant,
        current.quadrant,
        current.quadrant,
      )
      .first<WaitingTicketRow>();
    if (!candidate) return;

    const conversationId = crypto.randomUUID();
    const conversationCreatedAt = new Date().toISOString();
    const conversationExpiresAt = new Date(
      Date.now() + CHAT_DURATION_SECONDS * 1000,
    ).toISOString();
    await createConversationWithMemberNicknames(
      this.env.DB,
      conversationId,
      conversationCreatedAt,
      conversationExpiresAt,
      current.user_email,
      candidate.user_email,
      [current.id, candidate.id],
    );
  }

  private async cancel(email: string, payload: Record<string, unknown>) {
    const ticketId = typeof payload.ticketId === "string" ? payload.ticketId : "";
    await this.env.DB
      .prepare(
        `UPDATE matchmaking_tickets
         SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_email = ? AND status = 'waiting'`,
      )
      .bind(ticketId, email)
      .run();
    const ticket = await this.env.DB
      .prepare(
        `SELECT id, status, conversation_id FROM matchmaking_tickets
         WHERE id = ? AND user_email = ? LIMIT 1`,
      )
      .bind(ticketId, email)
      .first<TicketRow>();
    if (!ticket) {
      return Response.json({ error: "Matchmaking ticket not found" }, { status: 404 });
    }
    return Response.json(await ticketResponse(this.env.DB, ticket, email));
  }
}

export class ChatRoom extends DurableObject<RealtimeEnv> {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }

    await ensureRealtimeSchema(this.env.DB);
    await expireStaleRealtimeState(this.env.DB);
    const email = request.headers.get("x-moodly-user-email")?.trim().toLowerCase();
    const conversationId = request.headers.get("x-moodly-conversation-id");
    if (!email || !conversationId) {
      return new Response("Authentication required", { status: 401 });
    }

    const member = await this.env.DB
      .prepare(
        `SELECT cm.anonymous_name, c.status, c.expires_at
         FROM conversation_members cm
         JOIN conversations c ON c.id = cm.conversation_id
         WHERE cm.conversation_id = ? AND cm.user_email = ? LIMIT 1`,
      )
      .bind(conversationId, email)
      .first<{ anonymous_name: string; status: string; expires_at: string | null }>();
    if (!member) return new Response("Conversation not found", { status: 404 });

    if (member.status !== "active") {
      // A browser can't distinguish an HTTP-level rejection from a network
      // blip, so a client reconnecting after the chat already ended (e.g. it
      // was asleep when the alarm fired) would otherwise retry forever.
      // Accept the socket just long enough to deliver the real "ended"
      // event through the same channel the client already handles.
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      server.send(JSON.stringify({ type: "ended" }));
      server.close(1000, "Conversation has ended");
      return new Response(null, { status: 101, webSocket: client });
    }

    const expiresAtMs = member.expires_at
      ? parseSqliteTimestamp(member.expires_at)
      : Date.now() + CHAT_DURATION_SECONDS * 1000;
    await this.ctx.storage.put("conversationId", conversationId);
    await this.ctx.storage.setAlarm(expiresAtMs);

    const history = await this.env.DB
      .prepare(
        `SELECT id, sender_email, body, created_at
         FROM (
           SELECT id, sender_email, body, created_at
           FROM conversation_messages
           WHERE conversation_id = ?
           ORDER BY created_at DESC, id DESC
           LIMIT 50
         )
         ORDER BY created_at ASC, id ASC`,
      )
      .bind(conversationId)
      .all<{ id: string; sender_email: string; body: string; created_at: string }>();

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const attachment: ConnectionAttachment = {
      conversationId,
      email,
      anonymousName: member.anonymous_name,
    };
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(attachment);
    server.send(JSON.stringify({
      type: "ready",
      expiresAt: expiresAtMs,
      history: history.results.map((message) => ({
        id: message.id,
        text: message.body,
        mine: message.sender_email === email,
        time: message.created_at,
      })),
    }));
    this.broadcastPresence();

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(socket: WebSocket, raw: string | ArrayBuffer) {
    const attachment = socket.deserializeAttachment() as ConnectionAttachment | null;
    if (!attachment || typeof raw !== "string") return;
    await expireStaleRealtimeState(this.env.DB);

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      socket.send(JSON.stringify({ type: "error", message: "Invalid message" }));
      return;
    }

    if (payload.type === "end") {
      await this.env.DB
        .prepare(
          `UPDATE conversations SET status = 'ended', ended_at = CURRENT_TIMESTAMP
           WHERE id = ? AND status = 'active'`,
        )
        .bind(attachment.conversationId)
        .run();
      this.broadcast({ type: "ended" });
      return;
    }

    if (payload.type === "extend-request") {
      await this.handleExtendRequest(attachment);
      return;
    }

    if (payload.type !== "message") return;
    const body = typeof payload.text === "string" ? payload.text.trim().slice(0, 1000) : "";
    if (!body) return;

    const active = await this.env.DB
      .prepare("SELECT id FROM conversations WHERE id = ? AND status = 'active' LIMIT 1")
      .bind(attachment.conversationId)
      .first();
    if (!active) {
      socket.send(JSON.stringify({ type: "ended" }));
      return;
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await this.env.DB
      .prepare(
        `INSERT INTO conversation_messages
          (id, conversation_id, sender_email, body, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(id, attachment.conversationId, attachment.email, body, createdAt)
      .run();

    for (const peer of this.ctx.getWebSockets()) {
      const peerAttachment = peer.deserializeAttachment() as ConnectionAttachment | null;
      if (peer.readyState === WebSocket.OPEN && peerAttachment) {
        peer.send(JSON.stringify({
          type: "message",
          message: {
            id,
            text: body,
            mine: peerAttachment.email === attachment.email,
            time: createdAt,
          },
        }));
      }
    }
  }

  webSocketClose(socket: WebSocket, code: number, reason: string) {
    socket.close(code, reason);
    this.broadcastPresence();
  }

  webSocketError(socket: WebSocket) {
    socket.close(1011, "WebSocket error");
    this.broadcastPresence();
  }

  // Guaranteed by the Cloudflare runtime to fire at the scheduled time even
  // if no one is connected (or this DO was evicted in the meantime), so the
  // chat ends for both users at the same instant regardless of which of them
  // is actually online -- unlike a client-side timer, this can't be paused
  // by one participant's device sleeping.
  async alarm() {
    const conversationId = await this.ctx.storage.get<string>("conversationId");
    if (!conversationId) return;

    const conversation = await this.env.DB
      .prepare("SELECT status, expires_at FROM conversations WHERE id = ? LIMIT 1")
      .bind(conversationId)
      .first<{ status: string; expires_at: string | null }>();
    if (!conversation || conversation.status !== "active") return;

    const expiresAtMs = conversation.expires_at
      ? parseSqliteTimestamp(conversation.expires_at)
      : 0;
    if (expiresAtMs > Date.now()) {
      // Expiry was pushed out (extended) after this alarm was scheduled.
      await this.ctx.storage.setAlarm(expiresAtMs);
      return;
    }

    await this.env.DB
      .prepare(
        `UPDATE conversations SET status = 'ended', ended_at = CURRENT_TIMESTAMP
         WHERE id = ? AND status = 'active'`,
      )
      .bind(conversationId)
      .run();
    this.broadcast({ type: "ended" });
  }

  // Extends the chat by another full window, but only once every current
  // member has separately asked to -- silence (or running out the clock)
  // means the chat simply ends on schedule.
  private async handleExtendRequest(attachment: ConnectionAttachment) {
    const members = await this.env.DB
      .prepare("SELECT user_email FROM conversation_members WHERE conversation_id = ?")
      .bind(attachment.conversationId)
      .all<{ user_email: string }>();
    const memberEmails = new Set(members.results.map((row) => row.user_email));
    if (!memberEmails.has(attachment.email)) return;

    const stored = (await this.ctx.storage.get<string[]>("extendRequests")) ?? [];
    const requested = new Set(stored.filter((requesterEmail) => memberEmails.has(requesterEmail)));
    requested.add(attachment.email);
    await this.ctx.storage.put("extendRequests", [...requested]);

    for (const peer of this.ctx.getWebSockets()) {
      const peerAttachment = peer.deserializeAttachment() as ConnectionAttachment | null;
      if (peer.readyState === WebSocket.OPEN && peerAttachment) {
        peer.send(JSON.stringify({
          type: "extend-requested",
          mine: peerAttachment.email === attachment.email,
        }));
      }
    }

    const everyoneAgreed = memberEmails.size > 0
      && [...memberEmails].every((memberEmail) => requested.has(memberEmail));
    if (!everyoneAgreed) return;

    const conversation = await this.env.DB
      .prepare("SELECT status, expires_at FROM conversations WHERE id = ? LIMIT 1")
      .bind(attachment.conversationId)
      .first<{ status: string; expires_at: string | null }>();
    if (!conversation || conversation.status !== "active") return;

    const currentExpiresAtMs = conversation.expires_at
      ? parseSqliteTimestamp(conversation.expires_at)
      : Date.now();
    const newExpiresAtMs = Math.max(currentExpiresAtMs, Date.now()) + CHAT_DURATION_SECONDS * 1000;
    const newExpiresAtIso = new Date(newExpiresAtMs).toISOString();

    await this.env.DB
      .prepare("UPDATE conversations SET expires_at = ? WHERE id = ? AND status = 'active'")
      .bind(newExpiresAtIso, attachment.conversationId)
      .run();
    await this.ctx.storage.delete("extendRequests");
    await this.ctx.storage.setAlarm(newExpiresAtMs);
    this.broadcast({ type: "extended", expiresAt: newExpiresAtMs });
  }

  private broadcast(payload: Record<string, unknown>) {
    const encoded = JSON.stringify(payload);
    for (const socket of this.ctx.getWebSockets()) {
      if (socket.readyState === WebSocket.OPEN) socket.send(encoded);
    }
  }

  private broadcastPresence() {
    const onlineUsers = new Set<string>();
    for (const socket of this.ctx.getWebSockets()) {
      if (socket.readyState !== WebSocket.OPEN) continue;
      const attachment = socket.deserializeAttachment() as ConnectionAttachment | null;
      if (attachment) onlineUsers.add(attachment.email);
    }
    this.broadcast({
      type: "presence",
      online: onlineUsers.size,
    });
  }
}
