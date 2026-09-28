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
