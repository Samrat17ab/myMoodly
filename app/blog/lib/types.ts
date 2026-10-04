export type Category = "Loneliness" | "Feelings" | "Research" | "Updates";

/**
 * Article body as typed blocks rather than raw HTML, so posts can't inject markup.
 * Inline text supports **bold**, *italic* and [link text](https://url).
 */
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "callout"; title?: string; text: string };

export interface Source {
  label: string;
  url?: string;
}

export interface Post {
  slug: string;
  title: string;
  /** Used as the meta description and the card excerpt. Aim for 140-160 characters. */
  description: string;
  category: Category;
  /** ISO date, e.g. "2026-10-04" */
  publishedAt: string;
  updatedAt?: string;
  author: string;
  body: Block[];
  sources?: Source[];
  /** Set false on posts about crisis, self-harm or grief: no ads are shown on them. */
  adsAllowed?: boolean;
}
