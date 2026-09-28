import assert from "node:assert/strict";
import test from "node:test";
import { isHarmful } from "../worker/harmfulLanguage.ts";

const check = (list, expected) => {
  for (const text of list) assert.equal(isHarmful(text), expected, `${expected ? "should block" : "should allow"}: ${text}`);
};

test("blocks threats of violence at the other person", () => {
  check([
    "I will kill you",
    "i'll kill u",
    "I'm going to stab you",
    "im gonna hurt you",
    "I want to kill you",
    "let me punch you",
    "I'll k1ll you",
    "ill kiiiill you",
    "I will k.i.l.l you",
    "I'll shoot you dead",
    "i'll beat you up",
    "I'll beat the shit out of you",
    "I'll break your legs",
    "I will kill your family",
    "you're dead meat",
    "I'll make you suffer",
  ], true);
});

test("blocks telling someone to die or hurt themselves", () => {
  check([
    "kill yourself",
    "kys",
    "just kill yourself",
    "go kill yourself",
    "go die",
    "why don't you just kill yourself",
    "you should die",
    "you should go die",
    "I think you should kill yourself",
    "I hate you, kill yourself",
    "hope you die",
    "nobody would miss you",
    "you need to die",
    "no one would miss you",
    "do the world a favour and disappear",
    "no one would care if you died",
    "the world would be better without you",
  ], true);
});

test("blocks bullying, stalking, sexual harassment and slurs", () => {
  check([
    "you're worthless",
    "you are a waste of space",
    "nobody loves you",
    "I know where you live",
    "I'll find you",
    "I'm coming for you",
    "watch your back",
    "send nudes",
    "send me your nudes",
    "send noodz",
    "show me your tits",
    "I want to rape you",
    "suck my dick",
    "you should get raped",
    "shut up you faggot",
    "you retard",
    "tlai mardinchu",
    "timilai mari dinchhu",
  ], true);
});

test("allows swearing used to express feelings", () => {
  check([
    "fuck this week",
    "fuck my life honestly",
    "I'm so fucking tired",
    "this shit is hard",
    "my boss is such a bitch",
    "he was an asshole to me",
    "what a bastard",
    "fuck you lol, you made me laugh",
    "damn that's rough",
  ], false);
});

test("never blocks someone expressing their own pain or describing what happened", () => {
  check([
    "I want to die",
    "I want to kill myself",
    "sometimes I just want to go die",
    "I should just go die",
    "I feel like killing myself",
    "he threatened to kill me",
    "my ex said he would kill me",
    "they told me to kill myself at school",
    "I was bullied and called worthless",
    "someone tried to rape me when I was 16",
    "I hurt myself last night",
    "I feel like nobody loves me",
  ], false);
});

test("allows care, support and everyday phrases", () => {
  check([
    "please don't kill yourself",
    "are you thinking about killing yourself?",
    "do you want to kill yourself?",
    "if you kill yourself I would be so sad",
    "I would never hurt you",
    "I don't want to hurt you",
    "I'll shoot you a message later",
    "I can beat you at chess",
    "I'd break your heart if I left",
    "I'll find you a helpline number",
    "you're finished with exams?",
    "I'm from Niger",
    "I'm going to kill it at my interview",
    "this traffic is killing me",
    "you're killing it!",
    "I miss you so much",
    "I love you",
    "hang in there",
  ], false);
});

test("borderline messages are delivered with a warning", async () => {
  const { classifyMessage } = await import("../worker/harmfulLanguage.ts");
  const expect = (list, verdict) => {
    for (const text of list) assert.equal(classifyMessage(text), verdict, `expected ${verdict}: ${text}`);
  };
  expect([
    "you're so stupid",
    "you idiot",
    "shut up you bitch",
    "you are ugly",
    "such a loser, you are pathetic",
    "fuck you",
    "fuck you lol, you made me laugh",
    "go fuck yourself",
    "stfu",
    "I hate you",
    "are you single?",
    "what are you wearing",
    "send me a pic",
    "you're so hot",
    "wanna hook up?",
    "I'll kill you lol",
    "haha I'm going to stab you",
    "I will kill you 😂",
    "if you spoil the movie I'll kill you jk",
  ], "warn");
  expect([
    "I'll kill you lol, kys",
    "kys lol",
    "I will kill you",
    "go die haha",
    "send nudes lol",
  ], "block");
  expect([
    "you're not stupid at all",
    "I don't hate you",
    "people called me stupid at school",
    "I feel so ugly today",
    "fuck this week",
    "you're so kind",
    "thank you for listening",
    "I want to die",
  ], "ok");
});

test("catches 'you will die' and threats split across several messages", async () => {
  const { classifyMessage, classifyWithRecent } = await import("../worker/harmfulLanguage.ts");
  for (const t of ["you will die", "you'll die", "u gonna die", "you will die from my hand", "I will kill you with my bare hands"]) {
    assert.equal(classifyMessage(t), "block", `should block: ${t}`);
  }
  for (const t of ["if you keep smoking you will die", "i will die from my own hands", "I made this with my own hands", "please dont say it else i will die"]) {
    assert.equal(classifyMessage(t), "ok", `should allow: ${t}`);
  }
  // The exact sequence from the reported chat: each piece alone is harmless.
  const sent = [];
  const verdicts = ["i", "will", "kill", "you"].map((piece) => {
    const v = classifyWithRecent(piece, sent);
    if (v !== "block") sent.push(piece);
    return v;
  });
  assert.deepEqual(verdicts, ["ok", "ok", "ok", "block"]);
  assert.equal(classifyWithRecent("die", ["you will"]), "block", "completing \"you will die\" is blocked");
  assert.equal(classifyWithRecent("yourself", ["go", "kill"]), "block");
  assert.equal(classifyWithRecent("lol", ["i will", "kill", "you"]), "ok", "the blocked piece was never stored");
  // One earlier borderline message must not flag everything after it.
  assert.equal(classifyWithRecent("anyway how was your day", ["you're so stupid"]), "ok");
  assert.equal(classifyWithRecent("so sorry", ["i", "hate"]), "ok");
  assert.equal(classifyWithRecent("you", ["i", "hate"]), "warn");
});
