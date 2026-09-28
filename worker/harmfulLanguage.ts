// Blocks threats, harassment, sexual harassment, hate slurs and bullying
// aimed at another person, in chat messages and check-in notes.
//
// Deliberately NOT blocked:
// - ordinary swearing (fuck, shit, bitch, asshole, even "fuck you"), which
//   people use to express how they feel;
// - someone describing what happened to them ("he threatened to kill me");
// - someone expressing their own pain ("I want to die", "I want to kill
//   myself"). A person reaching out must never be silenced.
//
// Server-only: the list is never shipped to browsers, so it can't be read
// to find ways around it. It catches common and lightly disguised forms
// (k1ll, kiiill, k.i.l.l); determined evasion is left to reporting.

export const HARMFUL_MESSAGE_NOTICE =
  "This message wasn't sent because it could come across as threatening, harassing or hateful. Please keep things kind. You can end the conversation at any time.";

export const HARMFUL_NOTE_NOTICE =
  "Your note can't include threatening, harassing or hateful language. Please change it and try again.";

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };

/** Lowercase and undo common disguises: leetspeak, "k.i.l.l", zero-width characters, punctuation. */
function clean(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[​-‍﻿]/g, "")
    // Letters split by dots, dashes, underscores or asterisks: "k.i.l.l" -> "kill".
    .replace(/(?:^|(?<=\s))(?:[a-z0-9@$!][._\-*]){2,}[a-z0-9@$!](?=\s|$)/g, (m) => m.replace(/[._\-*]/g, ""))
    .replace(/[0-9@$!]/g, (c) => LEET[c] ?? c)
    .replace(/[’`´]/g, "'")
    .replace(/[^a-z'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Also collapse repeated letters, so "kiiiill" and "kill" both read "kil". */
const squeeze = (text: string) => text.replace(/([a-z])\1+/g, "$1");

// Rules below run on the squeezed text, so doubled letters are written once:
// kill -> kil, will -> wil, suffer -> sufer, better -> beter, off -> of.
const YOU = "(?:you|yu|u|ya|ye)";
const I_WILL =
  "(?:i ?'?l|i wil|i shal|i'?m going to|i am going to|i'?m gona|i am gona|im gona|gona|i wana|i want to|i'?d|i would|let me|ima|i'?m about to|i'?m gon)";
// Verbs that are violent whenever they're aimed at "you".
const HARM_VERB = "(?:kil|murder|stab|strangle|choke|behead|slit|hurt|rape|molest|punch|slap|hang|drown|end)";
const LOVED_ONES = "(?:family|mom|mum|mother|dad|father|parents|sister|brother|kids?|children|son|daughter|wife|husband|girlfriend|boyfriend|dog|cat|pet)";

// A negation turns a phrase supportive or harmless:
// "please don't kill yourself", "I would never hurt you".
const NEGATION_BEFORE = /\b(?:don'?t|dont|do not|never|won'?t|wont|wouldn'?t|wouldnt|not|no one should|nobody should|shouldn'?t|shouldnt|stop)\b(?:\s+\S+){0,3}\s*$/;
const NEGATION_INSIDE = /\b(?:don'?t|dont|never|not|won'?t|wouldn'?t|wouldnt)\b/;

// A caring question or the speaker's own feelings, just before the match:
// "are you thinking about killing yourself?", "do you want to kill yourself?",
// "sometimes I just want to go die".
const CONCERN_BEFORE = /\b(?:do|did|are|have|were|would|if|when|how|ever|want to|wana|going to|gona|thinking|thought|planing|plan|try|tried|trying|feel like|urge|about to)\b(?:\s+\S+){0,3}\s*$/;

/** The words just before speak about the speaker ("I should just go die"), not the other person. */
function isSelfTalk(before: string) {
  const window = before.trim().split(" ").slice(-5).join(" ");
  return /\b(?:i|i'?m|im|me|myself)\b/.test(window) && !/\b(?:you|u|your|ur|you'?re)\b/.test(window);
}

interface Rule {
  pattern: RegExp;
  /** Skip when negated ("don't", "never") just before or inside the match. */
  negatable?: boolean;
  /** Skip when a caring question or the speaker's own feelings come just before. */
  concernable?: boolean;
  /** A violent threat that is only a warning when clearly joking ("I'll kill you lol"). */
  jokable?: boolean;
}

const RULES: Rule[] = [
  // Threats of violence at the other person or their loved ones.
  { pattern: new RegExp(`\\b${I_WILL} (?:\\S+ ){0,2}?${HARM_VERB}(?:s|ed|ing)? ${YOU}\\b`), negatable: true, jokable: true },
  { pattern: new RegExp(`\\b${I_WILL} (?:\\S+ ){0,2}?(?:${HARM_VERB}|shot|beat)(?:s|ed|ing)? (?:your|ur) ${LOVED_ONES}\\b`), negatable: true },
  { pattern: new RegExp(`\\b${I_WILL} (?:\\S+ ){0,2}?shot ${YOU}(?: dead| down| in the| with|$)`), negatable: true, jokable: true },
  { pattern: new RegExp(`\\b${I_WILL} (?:\\S+ ){0,2}?beat (?:${YOU} (?:up|to death|senseles|black and blue)|the (?:shit|hel|crap|life) out of ${YOU})\\b`), negatable: true, jokable: true },
  { pattern: new RegExp(`\\b${I_WILL} (?:\\S+ ){0,2}?break (?:your|ur) (?:neck|legs?|bones|face|skul|arms?|jaw)\\b`), negatable: true, jokable: true },
  { pattern: /\b(?:you'?re|you are|ur|u r) (?:dead meat|so dead|going to die|gona die)\b/, negatable: true, jokable: true },
  { pattern: new RegExp(`\\bi'?(?:l| wil|m going to|m gona) (?:make|watch) ${YOU} (?:sufer|bled|die|pay for this)\\b`) },

  // Telling someone to die or hurt themselves.
  { pattern: /\b(?:kil|hang|shot|end|drown) (?:yourself|urself|yourselves|ur self|your self|thyself)\b/, negatable: true, concernable: true },
  { pattern: /\bwhy (?:don'?t|dont|do not) (?:you|u) (?:just )?(?:go )?(?:die|kil yourself|hang yourself)\b/ },
  { pattern: /\bkys\b/ },
  { pattern: /\bgo (?:and )?(?:die|kil yourself|hang yourself|jump of a (?:bridge|building|clif)|drink bleach)\b/, concernable: true },
  { pattern: /\b(?:you|u|ya) (?:should|shoud|deserve to|ned to|beter|ought to|must) (?:just )?(?:go )?(?:die|be dead|kil yourself|end it al|get raped|be raped|sufer|rot)\b/, negatable: true },
  { pattern: /\b(?:hope|wish) (?:you|u|ya) (?:die|were dead|get raped|get kiled|get cancer|sufer|rot|drop dead|choke)\b/, negatable: true },
  { pattern: /\b(?:nobody|no one|none) (?:would|wil) (?:mis|cry for|even notice) (?:you|u)\b/ },
  { pattern: /\b(?:nobody|no one|none) (?:would|wil) care if (?:you|u) (?:died|die|were dead|kiled yourself)\b/ },
  { pattern: /\bworld (?:would be|is|wil be) beter (?:of )?without (?:you|u)\b/ },
  { pattern: /\b(?:do|doing) (?:us|everyone|the world) a favou?r and (?:die|kil yourself|disapear)\b/ },

  // Bullying aimed at the other person's worth.
  { pattern: /\b(?:you'?re|you are|youre|ur|u r|u are) (?:so |such a |just |a )?(?:worthles|a waste of (?:space|air|oxygen|life)|beter of dead|subhuman|unlovable)\b/ },
  { pattern: /\b(?:nobody|no one|none) (?:loves|likes|wants|cares about) (?:you|u)\b/ },
  { pattern: /\byour (?:parents|family|mom|mum|dad) should have (?:aborted|kiled) (?:you|u)\b/ },

  // Stalking and intimidation.
  { pattern: /\bi know where (?:you|u) (?:live|work|study|stay)\b/ },
  { pattern: /\bi'?(?:l| wil|m going to|m gona) (?:find|hunt|track) (?:you|u)(?: down| out| wherever| anywhere|$)/, negatable: true },
  { pattern: /\bi'?(?:m| am) (?:coming for|hunting) (?:you|u)\b/, negatable: true },
  { pattern: /\bwatch your back\b/ },

  // Sexual harassment.
  { pattern: /\bsend (?:me )?(?:some |your |ur |a )?(?:nudes?|nuds?|nodz|naked pics|pics of your (?:body|bobs|tits|dick))\b/ },
  { pattern: /\bshow (?:me )?(?:your |ur )?(?:bobs|tits|dick|cock|pusy|vagina|nudes?|naked body)\b/ },
  { pattern: /\bi (?:want|wana|wil|'?l|would|'?d|'?m going) (?:to )?(?:rape|molest|fuck|fuk|grope) (?:you|u)\b/, negatable: true },
  { pattern: /\b(?:suck|lick) my (?:dick|cock|bals?|pusy)\b/ },
  { pattern: /\b(?:you|u) (?:should|deserve to|ned to) (?:get|be) raped\b/ },

  // Romanized Nepali threats ("I'll kill you", "go die"). A native speaker
  // should review and extend these.
  { pattern: /\b(?:tlai|talai|timilai|tapailai|tapai lai|timi lai|ta lai|tero|timro) (?:\S+ )?(?:mar|mari|mari) ?din(?:chu|xu|chau)\b/ },
  { pattern: /\b(?:tlai|talai|timilai|timi lai|ta lai) (?:\S+ )?(?:khatam|sidhyai) ?(?:gari ?)?din(?:chu|xu)\b/ },
  { pattern: /\b(?:ja mar|mari ja|mar ja)\b/ },
];

// Hate slurs, matched on the un-squeezed text so a double letter still
// counts ("nigger" is a slur; "Niger" is a country). Ordinary swear words
// are intentionally absent.
const SLURS = /\b(?:nig{2,}(?:er|ers|r|rs)|fag{2,}ots?|kikes?|spics?|tran{2,}(?:y|ies)|wetbacks?|ragheads?|towelheads?)\b/;
const RETARD = /\b(?:you|u|ur|you'?re|you are|stupid|fucking|fuking|such a) (?:a )?retard(?:s|ed)?\b/;

// Borderline ("50/50") messages: delivered, but the sender sees a gentle
// warning and the receiver is offered a way to report. Squeezed spelling.
const INSULT =
  "(?:stupid|idiot|dumb|dumbas|moron|loser|pathetic|ugly|fat|disgusting|crep|crepy|weirdo|freak|trash|garbage|bitch|slut|whore|hoe|cunt|dick|ashole|bastard|prick|jerk|clown|psycho|useles|failure|anoying)";
const WARN_RULES: Rule[] = [
  // Insults aimed at the other person: "you're so stupid", "you idiot", "you bitch".
  { pattern: new RegExp(`\\b(?:you'?re|you are|youre|ur|u r|u are|you|u) (?:so |such a |such an |a |an |just |fucking |fuking |complete |total |big )*${INSULT}s?\\b`), negatable: true },
  // Hostile brush-offs.
  { pattern: /\b(?:fuck|fuk|screw) (?:you|u|of)\b|\bgo fuck yourself\b|\bstfu\b|\bshut the fuck up\b|^shut up$|\bpis of\b|\bkis my as\b|\b(?:nobody|no one) asked\b/ },
  { pattern: /\bi (?:fucking |realy |just )?hate (?:you|u)\b/, negatable: true },
  // Creepy or sexual pressure.
  { pattern: /\b(?:are you|are u|r u|r you) (?:single|a virgin|horny|naked|wet|alone right now)\b/ },
  { pattern: /\bwhat (?:are you|r u|are u) wearing\b/ },
  { pattern: /\bsend (?:me )?(?:a |your |ur )?(?:pic|pics|photo|photos|selfie|picture)\b/ },
  { pattern: /\b(?:you'?re|you are|ur|u r) (?:so |realy )?(?:hot|sexy)\b/ },
  { pattern: /\b(?:wana|want to|let'?s|lets) (?:fuck|have sex|hok up|sext)\b/ },
];

// Laughing it off turns a violent threat into a borderline message.
const JOKING = /\b(?:lol|lmao|lmfao|rofl|haha\w*|hehe\w*|jk|just kiding|kiding|joking|jokes)\b/;
const JOKING_EMOJI = /[\u{1F602}\u{1F923}\u{1F606}\u{1F61C}\u{1F61D}]/u;

export type MessageVerdict = "block" | "warn" | "ok";

function matchingRules(value: string, rules: Rule[]) {
  return rules.filter((rule) => {
    const match = rule.pattern.exec(value);
    if (!match) return false;
    const before = value.slice(0, match.index);
    if (rule.negatable && (NEGATION_BEFORE.test(before) || NEGATION_INSIDE.test(match[0]))) return false;
    if (rule.concernable && (CONCERN_BEFORE.test(before) || isSelfTalk(before))) return false;
    return true;
  });
}

/**
 * "block": never stored or delivered (threats, telling someone to die,
 * stalking, sexual harassment, slurs, bullying).
 * "warn": delivered, with a gentle warning to the sender and a report
 * option for the receiver (insults, hostility, creepy messages, joking threats).
 */
export function classifyMessage(text: string): MessageVerdict {
  const cleaned = clean(text);
  if (!cleaned) return "ok";
  if (SLURS.test(cleaned) || RETARD.test(cleaned)) return "block";
  const value = squeeze(cleaned);
  const hard = matchingRules(value, RULES);
  if (hard.length) {
    // Anything that isn't a laughed-off threat ("kys", slurs...) is always blocked.
    const joking = JOKING.test(value) || JOKING_EMOJI.test(text);
    return hard.every((rule) => rule.jokable) && joking ? "warn" : "block";
  }
  return matchingRules(value, WARN_RULES).length ? "warn" : "ok";
}

/** True when the text must be blocked outright. */
export function isHarmful(text: string) {
  return classifyMessage(text) === "block";
}
