import type { Block, Post } from "./types";
import { namingFeelings } from "../posts/naming-your-feelings";
import { lonelinessFacts } from "../posts/loneliness-is-not-a-personal-failing";
import { whyMymoodly } from "../posts/why-we-built-mymoodly";

export const SITE_URL = "https://mymoodly.space";
export const BLOG_TITLE = "The myMoodly Blog";
export const BLOG_DESCRIPTION =
  "Notes on loneliness, feelings and connection, grounded in research, plus updates from the people building myMoodly.";

/** Register new posts here. They're sorted newest first; on the same date, this order wins. */
const ALL_POSTS: Post[] = [lonelinessFacts, namingFeelings, whyMymoodly];

export function getPosts(): Post[] {
  return [...ALL_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPost(slug: string): Post | undefined {
  return ALL_POSTS.find((p) => p.slug === slug);
}

/** Same category first, then most recent, excluding the post itself. */
export function getRelated(post: Post, count = 2): Post[] {
  const others = getPosts().filter((p) => p.slug !== post.slug);
  const same = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);
  return [...same, ...rest].slice(0, count);
}

function blockText(block: Block): string {
  switch (block.type) {
    case "ul":
    case "ol":
      return block.items.join(" ");
    case "callout":
      return `${block.title ?? ""} ${block.text}`;
    default:
      return block.text;
  }
}

export function readingMinutes(post: Post): number {
  const words = post.body.map(blockText).join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function postUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`;
}
