import type { Post } from "../lib/types";

export const whyMymoodly: Post = {
  slug: "why-we-built-mymoodly",
  title: "Why we built myMoodly",
  description:
    "Most places online ask you to perform. We wanted one that asks how you feel, then connects you with one real person for twenty minutes. Here's the thinking behind it.",
  category: "Updates",
  publishedAt: "2026-10-04",
  author: "The myMoodly team",
  body: [
    {
      type: "p",
      text: "Most of the internet asks you to perform. Post the good version of your day, keep up the streak, collect the likes. There are very few places where you can say \"honestly, I'm not great today\" to someone who isn't going to remember it tomorrow, judge you for it, or try to sell you something.",
    },
    { type: "p", text: "myMoodly is our attempt at one of those places." },
    { type: "h2", text: "How it works" },
    {
      type: "ol",
      items: [
        "**Check in.** Place a light on a mood map by energy and pleasantness, then pick the word that fits best.",
        "**Get matched.** We pair you with one real person, either someone in a similar headspace or a different one, whichever you choose.",
        "**Talk for twenty minutes.** Anonymously, under a rotating two-word name. You can extend the time if you both want to.",
        "**Reflect.** Afterwards you check in again, so you can see whether anything shifted.",
      ],
    },
    { type: "h2", text: "What we deliberately left out" },
    {
      type: "p",
      text: "No profiles to browse. No followers. No history anyone else can see. You don't have to look interesting or keep anything up. Each conversation stands on its own.",
    },
    { type: "h2", text: "Safety comes first" },
    {
      type: "p",
      text: "Anonymity only works if people feel safe. Clearly harmful messages are blocked before they're delivered, borderline ones arrive with a gentle warning, and you can report or block someone in one tap. People describing their own pain are never blocked. myMoodly is for adults 18 and over.",
    },
    {
      type: "p",
      text: "myMoodly is peer support. It isn't therapy and it isn't a crisis service, so support lines are one tap away on every screen.",
    },
    { type: "h2", text: "Why a blog" },
    {
      type: "p",
      text: "We'll use this space for two things: honest, research-backed writing about loneliness, feelings and connection, and plain updates on what we're changing and why. If there's something you'd like us to write about, we'd love to hear it at [mymoodly.space@gmail.com](mailto:mymoodly.space@gmail.com).",
    },
  ],
};
