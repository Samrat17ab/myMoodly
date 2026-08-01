import assert from "node:assert/strict";

const baseUrl = process.env.MOODLY_BASE_URL ?? "http://localhost:3000";
const runId = crypto.randomUUID().slice(0, 8);

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

async function setUpUser(label, languages) {
  const email = `lang-${runId}-${label}@moodly.local`;
  await post("/api/moodly", {
    type: "profile",
    email,
    profile: {
      age: "25",
      gender: "Prefer not to say",
      customGender: "",
      country: "Nepal",
      languages,
      terms: true,
    },
  });
  const checkIn = await post("/api/moodly", {
    type: "check-in",
    email,
    energy: "high",
    pleasant: true,
    quadrant: "yellow",
    emotion: `language-test-${label}`,
    note: "",
    matchMode: "similar",
  });
  return { email, languages, checkInId: checkIn.id };
}

async function join(user) {
  return post("/api/match", {
    action: "join",
    email: user.email,
    checkInId: user.checkInId,
    matchMode: "similar",
    quadrant: "yellow",
    languages: user.languages,
  });
}

async function pollUntilSettled(user, ticketId, { timeoutMs }) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    last = await post("/api/match", { action: "status", email: user.email, ticketId });
    if (last.status === "matched") return last;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return last;
}

// Case 1: zero overlapping languages -- must never match, no matter how long they wait.
{
  const userA = await setUpUser("mismatch-a", ["English"]);
  const userB = await setUpUser("mismatch-b", ["Nepali"]);
  const [ticketA, ticketB] = await Promise.all([join(userA), join(userB)]);
  assert.equal(ticketA.status, "waiting");
  assert.equal(ticketB.status, "waiting");

  const [resultA, resultB] = await Promise.all([
    pollUntilSettled(userA, ticketA.ticketId, { timeoutMs: 9_000 }),
    pollUntilSettled(userB, ticketB.ticketId, { timeoutMs: 9_000 }),
  ]);
  assert.equal(resultA.status, "waiting", "User with no shared language must not be matched.");
  assert.equal(resultB.status, "waiting", "User with no shared language must not be matched.");

  await Promise.all([
    post("/api/match", { action: "cancel", email: userA.email, ticketId: ticketA.ticketId }),
    post("/api/match", { action: "cancel", email: userB.email, ticketId: ticketB.ticketId }),
  ]);
}

// Case 2: exactly one overlapping language out of several -- must match.
{
  const userA = await setUpUser("overlap-a", ["English", "Nepali", "French"]);
  const userB = await setUpUser("overlap-b", ["Nepali", "Hindi"]);
  const [ticketA, ticketB] = await Promise.all([join(userA), join(userB)]);

  const [resultA, resultB] = await Promise.all([
    pollUntilSettled(userA, ticketA.ticketId, { timeoutMs: 9_000 }),
    pollUntilSettled(userB, ticketB.ticketId, { timeoutMs: 9_000 }),
  ]);
  assert.equal(resultA.status, "matched", "A single shared language must be enough to match.");
  assert.equal(resultB.status, "matched", "A single shared language must be enough to match.");
  assert.equal(resultA.conversationId, resultB.conversationId);
}

// Case 3: case-insensitive overlap ("english" vs "English") must still count as shared.
{
  const userA = await setUpUser("case-a", ["english"]);
  const userB = await setUpUser("case-b", ["ENGLISH"]);
  const [ticketA, ticketB] = await Promise.all([join(userA), join(userB)]);

  const [resultA, resultB] = await Promise.all([
    pollUntilSettled(userA, ticketA.ticketId, { timeoutMs: 9_000 }),
    pollUntilSettled(userB, ticketB.ticketId, { timeoutMs: 9_000 }),
  ]);
  assert.equal(resultA.status, "matched", "Case-insensitive language match must still count as shared.");
  assert.equal(resultB.status, "matched", "Case-insensitive language match must still count as shared.");
}

console.log(JSON.stringify({
  noSharedLanguageNeverMatched: true,
  singleSharedLanguageIsEnough: true,
  caseInsensitiveMatchVerified: true,
}));
