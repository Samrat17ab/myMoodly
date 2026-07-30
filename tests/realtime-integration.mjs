import assert from "node:assert/strict";

const baseUrl = process.env.MOODLY_BASE_URL ?? "http://localhost:3000";
const runId = crypto.randomUUID().slice(0, 8);
const users = [
  `realtime-a-${runId}@moodly.local`,
  `realtime-b-${runId}@moodly.local`,
];

async function post(path, payload) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  assert.equal(response.ok, true, `${path}: ${JSON.stringify(data)}`);
  return data;
}

function waitForType(socket, type) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Timed out waiting for ${type}`)),
      10_000,
    );
    const onMessage = (event) => {
      const payload = JSON.parse(String(event.data));
      if (payload.type !== type) return;
      clearTimeout(timeout);
      socket.removeEventListener("message", onMessage);
      resolve(payload);
    };
    socket.addEventListener("message", onMessage);
  });
}

for (const email of users) {
  await post("/api/moodly", {
    type: "profile",
    email,
    profile: {
      age: "25",
      gender: "Prefer not to say",
      customGender: "",
      country: "Nepal",
      languages: ["English"],
      terms: true,
    },
  });
}

const checkIns = [];
for (const email of users) {
  checkIns.push(await post("/api/moodly", {
    type: "check-in",
    email,
    energy: "low",
    pleasant: true,
    quadrant: "green",
    emotion: "Calm",
    note: "Realtime integration test",
    matchMode: "similar",
  }));
}

const firstTicket = await post("/api/match", {
  action: "join",
  email: users[0],
  checkInId: checkIns[0].id,
  matchMode: "similar",
  quadrant: "green",
  languages: ["English"],
});
assert.equal(firstTicket.status, "waiting");

const secondTicket = await post("/api/match", {
  action: "join",
  email: users[1],
  checkInId: checkIns[1].id,
  matchMode: "similar",
  quadrant: "green",
  languages: ["English"],
});
assert.equal(secondTicket.status, "matched");

const firstStatus = await post("/api/match", {
  action: "status",
  email: users[0],
  ticketId: firstTicket.ticketId,
});
assert.equal(firstStatus.status, "matched");
assert.equal(firstStatus.conversationId, secondTicket.conversationId);

const websocketBase = baseUrl.replace(/^http/, "ws");
const sockets = users.map((email) => new WebSocket(
  `${websocketBase}/api/realtime?conversationId=${encodeURIComponent(firstStatus.conversationId)}&email=${encodeURIComponent(email)}`,
));
const readyPackets = sockets.map((socket) => waitForType(socket, "ready"));
await Promise.all(readyPackets);

const received = sockets.map((socket) => waitForType(socket, "message"));
sockets[0].send(JSON.stringify({ type: "message", text: "Hello from user A" }));
const [senderPacket, receiverPacket] = await Promise.all(received);
assert.equal(senderPacket.message.text, "Hello from user A");
assert.equal(senderPacket.message.mine, true);
assert.equal(receiverPacket.message.text, "Hello from user A");
assert.equal(receiverPacket.message.mine, false);

const ended = sockets.map((socket) => waitForType(socket, "ended"));
sockets[1].send(JSON.stringify({ type: "end" }));
await Promise.all(ended);
sockets.forEach((socket) => socket.close(1000, "Test complete"));

console.log(JSON.stringify({
  matched: true,
  conversationId: firstStatus.conversationId,
  websocketDelivery: true,
  persistedMessageId: senderPacket.message.id,
}));
