export const NICKNAME_ADJECTIVES = [
  "Gentle", "Quiet", "Kind", "Warm", "Brave", "Calm", "Bright", "Patient",
  "Soft", "Steady", "Humble", "Cheerful", "Hopeful", "Curious", "Thoughtful",
  "Sincere", "Tender", "Serene", "Radiant", "Playful", "Graceful", "Loyal",
  "Wise", "Nimble", "Breezy", "Cozy", "Earnest", "Mellow", "Sunny", "Dreamy",
  "Quirky", "Gallant", "Jolly", "Lively", "Mindful", "Peaceful", "Spirited",
  "Trusty", "Vivid", "Whimsical",
];

export const NICKNAME_ANIMALS = [
  "Otter", "Sparrow", "Panda", "Fox", "Koala", "Robin", "Dolphin", "Deer",
  "Owl", "Hedgehog", "Rabbit", "Heron", "Badger", "Finch", "Seal", "Lynx",
  "Falcon", "Wren", "Beaver", "Swan", "Turtle", "Squirrel", "Raven", "Moose",
  "Puffin", "Gazelle", "Panther", "Lemur", "Egret", "Marten", "Ibis", "Vole",
  "Stag", "Crane", "Kite", "Newt", "Mink", "Tern", "Whale", "Bison",
];

export const NICKNAME_ROTATE_SECONDS = 24 * 60 * 60;

export function randomNickname() {
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  const adjective = NICKNAME_ADJECTIVES[bytes[0] % NICKNAME_ADJECTIVES.length];
  const animal = NICKNAME_ANIMALS[bytes[1] % NICKNAME_ANIMALS.length];
  return `${adjective} ${animal}`;
}

// Returns the profile's current nickname, assigning a fresh one if it has
// never been set or is older than NICKNAME_ROTATE_SECONDS.
export async function ensureNickname(
  d1: D1Database,
  email: string,
  current: { nickname: string | null; nickname_assigned_at: number | null } | null,
): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (
    current?.nickname &&
    current.nickname_assigned_at &&
    nowSeconds - current.nickname_assigned_at < NICKNAME_ROTATE_SECONDS
  ) {
    return current.nickname;
  }

  const nickname = randomNickname();
  await d1
    .prepare(
      "UPDATE profiles SET nickname = ?, nickname_assigned_at = unixepoch() WHERE email = ?",
    )
    .bind(nickname, email)
    .run();
  return nickname;
}
