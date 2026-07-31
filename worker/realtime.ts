import { DurableObject } from "cloudflare:workers";
import type { AccessAuthEnv } from "./access-auth";

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
const CONVERSATION_LIFETIME = "-20 minutes";
const MINIMUM_MATCH_WAIT_SECONDS = 3;
const SYNCHRONIZED_CHAT_DELAY_SECONDS = 2;

const adjectives = [
  "Gentle", "Quiet", "Kind", "Warm", "Brave", "Calm", "Bright", "Patient",
];
const animals = [
  "Otter", "Sparrow", "Panda", "Fox", "Koala", "Robin", "Dolphin", "Deer",
];

function anonymousName() {
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  return `${adjectives[bytes[0] % adjectives.length]} ${animals[bytes[1] % animals.length]}`;
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
      "CREATE INDEX IF NOT EXISTS conversation_messages_room_created_idx ON conversation_messages (conversation_id, created_at)",
    ),
  ]);
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
       WHERE status = 'active' AND created_at < datetime('now', ?)`,
    ).bind(CONVERSATION_LIFETIME),
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
    await this.env.DB.batch([
      this.env.DB
        .prepare(
          `INSERT INTO conversations (id, status, created_at)
           VALUES (?, 'active', ?)`,
        )
        .bind(conversationId, conversationCreatedAt),
      this.env.DB
        .prepare(
          `INSERT INTO conversation_members
            (conversation_id, user_email, anonymous_name) VALUES (?, ?, ?)`,
        )
        .bind(conversationId, current.user_email, anonymousName()),
      this.env.DB
        .prepare(
          `INSERT INTO conversation_members
            (conversation_id, user_email, anonymous_name) VALUES (?, ?, ?)`,
        )
        .bind(conversationId, candidate.user_email, anonymousName()),
      this.env.DB
        .prepare(
          `UPDATE matchmaking_tickets
           SET status = 'matched', conversation_id = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id IN (?, ?) AND status = 'waiting'`,
        )
        .bind(conversationId, current.id, candidate.id),
    ]);
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
        `SELECT cm.anonymous_name, c.status
         FROM conversation_members cm
         JOIN conversations c ON c.id = cm.conversation_id
         WHERE cm.conversation_id = ? AND cm.user_email = ? LIMIT 1`,
      )
      .bind(conversationId, email)
      .first<{ anonymous_name: string; status: string }>();
    if (!member) return new Response("Conversation not found", { status: 404 });
    if (member.status !== "active") return new Response("Conversation has ended", { status: 409 });

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
