// Finds contact details (phone numbers, emails, links, social handles) in
// short free text such as the check-in note. Shared by the client, for an
// inline hint, and the server, which enforces it. It aims at honest mistakes
// and casual attempts; deliberate evasion is left to reporting.

export type ContactDetailKind = "phone" | "email" | "link" | "handle";

export const CONTACT_DETAILS_MESSAGE =
  "Please keep phone numbers, emails, social handles and links out of your note. It helps keep everyone here safe.";

// Nepali (Devanagari) digits count as digits too.
const DIGIT = "[0-9\\u0966-\\u096F]";
const DIGIT_RE = new RegExp(DIGIT, "g");

// A run that starts and ends with a digit and may contain spaces, dashes,
// dots, slashes or brackets between digits (e.g. "+977 (984) 123-4567").
const DIGIT_RUN = new RegExp(`\\+?${DIGIT}(?:[\\s().\\-/]*${DIGIT})+`, "g");
// Seven or more digits reads as a phone number; times, dates and prices
// ("2:30", "12/10", "2500") stay well under that.
const PHONE_MIN_DIGITS = 7;

const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const SPELLED_EMAIL = /\b(?:at|@)\s*(?:gmail|yahoo|hotmail|outlook|icloud|proton(?:mail)?|live)\b|\b(?:gmail|yahoo|hotmail|outlook|icloud|protonmail)\s*(?:\.|dot)\s*com\b/i;

const URL_PREFIX = /\b(?:https?:\/\/|www\.)\S+/i;
const BARE_DOMAIN = /\b[a-z0-9][a-z0-9-]*\s?\.\s?(?:com|net|org|io|me|co|np|in|app|ly|gg|xyz|info|site|online|dev|link|to|tv)\b(?!\.[a-z])/i;

const HANDLE = /(?:^|[\s(])@[a-z0-9_.]{2,}/i;
const PLATFORM =
  "insta(?:gram)?|ig|snap(?:chat)?|telegram|whats\\s?app|discord|facebook|fb|messenger|tik\\s?tok|twitter|viber|imo|wechat|kik";
// "insta: name", "snap id - name", "telegram = name"
const PLATFORM_ID = new RegExp(`\\b(?:${PLATFORM})\\b\\s*(?:id|handle|user(?:name)?)?\\s*[:=\\-\\u2013]\\s*\\S+`, "i");
// "add me on snap", "dm me on insta", "text me on whatsapp"
const CONTACT_ME = new RegExp(`\\b(?:add|dm|message|msg|text|call|follow|find|hit|ping)\\s+me\\s+(?:up\\s+)?(?:on|at|in)\\s+(?:${PLATFORM})\\b`, "i");
// "my number is", "my insta is", "my email:"
const MY_DETAIL = new RegExp(`\\bmy\\s+(?:${PLATFORM}|number|no\\.?|phone|mobile|cell|email|e-mail|mail|id|handle|username)\\s*(?:is|:|=)`, "i");

function hasPhoneNumber(text: string) {
  for (const run of text.match(DIGIT_RUN) ?? []) {
    if ((run.match(DIGIT_RE) ?? []).length >= PHONE_MIN_DIGITS) return true;
  }
  return false;
}

/** The first kind of contact detail found in `text`, or null if there is none. */
export function findContactDetail(text: string): ContactDetailKind | null {
  const value = text.normalize("NFKC");
  if (EMAIL.test(value) || SPELLED_EMAIL.test(value)) return "email";
  if (URL_PREFIX.test(value) || BARE_DOMAIN.test(value)) return "link";
  if (HANDLE.test(value) || PLATFORM_ID.test(value) || CONTACT_ME.test(value) || MY_DETAIL.test(value)) return "handle";
  if (hasPhoneNumber(value)) return "phone";
  return null;
}
