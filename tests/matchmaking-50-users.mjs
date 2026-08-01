import assert from "node:assert/strict";

const baseUrl = process.env.MOODLY_BASE_URL ?? "http://localhost:3000";
const runId = crypto.randomUUID().slice(0, 8);
const quadrants = ["red", "yellow", "green", "blue"];
const users = Array.from({ length: 50 }, (_, index) => {
  const pair = Math.floor(index / 2);
  const mode = pair % 2 === 0 ? "similar" : "different";
  const firstQuadrant = quadrants[pair % quadrants.length];
  const quadrant = mode === "similar" || index % 2 === 0
    ? firstQuadrant
    : quadrants[(pair + 1) % quadrants.length];
  return {
    index,
    pair,
    email: `load-${runId}-${index}@moodly.local`,
    language: `Pair language ${pair}`,
    mode,
    quadrant,
    emotion: `${quadrant}-emotion-${index}`,
    note: `How user ${index} feels in load test ${runId}`,
  };
});

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

await Promise.all(users.map((user) => post("/api/moodly", {
  type: "profile",
  email: user.email,
  profile: {
    age: "25",
    gender: "Prefer not to say",
    customGender: "",
    country: "Nepal",
    languages: [user.language],
    terms: true,
  },
})));

const checkIns = await Promise.all(users.map((user) => post("/api/moodly", {
  type: "check-in",
  email: user.email,
  energy: user.quadrant === "red" || user.quadrant === "yellow" ? "high" : "low",
  pleasant: user.quadrant === "yellow" || user.quadrant === "green",
  quadrant: user.quadrant,
  emotion: user.emotion,
  note: user.note,
  matchMode: user.mode,
})));

const ticketJoins = await Promise.all(users.map(async (user) => ({
  user,
  ticket: await post("/api/match", {
    action: "join",
    email: user.email,
    checkInId: checkIns[user.index].id,
    matchMode: user.mode,
    quadrant: user.quadrant,
    languages: [user.language],
  }),
  returnedAt: Date.now(),
})));
const tickets = ticketJoins.map(({ ticket }) => ticket);
assert.ok(tickets.every((ticket) => ticket.status === "waiting"));

const earlyUsers = ticketJoins
  .filter(({ returnedAt }) => Date.now() - returnedAt < 2_500)
  .slice(-10)
  .map(({ user }) => user);
assert.ok(earlyUsers.length > 0, "At least one fresh ticket is required for the timing check.");
const earlyResults = await Promise.all(earlyUsers.map((user) => post("/api/match", {
  action: "status",
  email: user.email,
  ticketId: tickets[user.index].ticketId,
})));
assert.ok(
  earlyResults.every((result) => result.status === "waiting"),
  "No user may match before waiting for three seconds.",
);

const lastJoinReturn = Math.max(...ticketJoins.map(({ returnedAt }) => returnedAt));
const remainingDelay = Math.max(0, lastJoinReturn + 3_500 - Date.now());
await new Promise((resolve) => setTimeout(resolve, remainingDelay));

const results = new Map();
const deadline = Date.now() + 10_000;
while (results.size < users.length && Date.now() < deadline) {
  const pendingUsers = users.filter((user) => !results.has(user.email));
  const round = await Promise.all(pendingUsers.map(async (user) => ({
    user,
    result: await post("/api/match", {
      action: "status",
      email: user.email,
      ticketId: tickets[user.index].ticketId,
    }),
  })));
  for (const { user, result } of round) {
    if (result.status === "matched") results.set(user.email, result);
  }
  if (results.size < users.length) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

assert.equal(results.size, 50, "All 50 actively searching users should be matched.");
const conversations = new Map();
for (const user of users) {
  const result = results.get(user.email);
  assert.ok(result.conversationId);
  assert.ok(result.partnerName);
  assert.ok(result.chatStartsAt);
  const members = conversations.get(result.conversationId) ?? [];
  members.push(user);
  conversations.set(result.conversationId, members);
}
assert.equal(conversations.size, 25, "Fifty users should create exactly 25 conversations.");

for (const [conversationId, members] of conversations) {
  assert.equal(members.length, 2, `${conversationId} must contain exactly two users.`);
  const [first, second] = members;
  assert.notEqual(first.email, second.email);
  assert.equal(first.language, second.language, "Partners must share a language.");
  assert.equal(
    first.mode === "similar" ? first.quadrant === second.quadrant : first.quadrant !== second.quadrant,
    true,
    "The first user's mood preference must be satisfied.",
  );
  assert.equal(
    second.mode === "similar" ? second.quadrant === first.quadrant : second.quadrant !== first.quadrant,
    true,
    "The second user's mood preference must be satisfied.",
  );
  assert.equal(results.get(first.email).partnerEmotion, second.emotion);
  assert.equal(results.get(first.email).partnerNote, second.note);
  assert.equal(results.get(second.email).partnerEmotion, first.emotion);
  assert.equal(results.get(second.email).partnerNote, first.note);
  assert.equal(results.get(first.email).chatStartsAt, results.get(second.email).chatStartsAt);
}

// Every user's own anonymous name is the partnerName their partner sees, so
// collecting both directions across all 25 conversations covers all 50
// assigned names.
const anonymousNames = users.map((user) => results.get(user.email).partnerName);
assert.equal(anonymousNames.length, 50);
assert.equal(
  new Set(anonymousNames).size,
  50,
  "No two concurrently matched users may share an anonymous name.",
);

console.log(JSON.stringify({
  users: users.length,
  conversations: conversations.size,
  allMatched: true,
  minimumWaitVerified: true,
  moodRulesVerified: true,
  partnerCheckInsVerified: true,
  synchronizedStartVerified: true,
  uniqueAnonymousNamesVerified: true,
}));
