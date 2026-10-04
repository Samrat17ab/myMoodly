/**
 * Paid ad placements for the blog. Off until a provider is chosen; while off,
 * slots render nothing at all. Add `?ads=preview` to any blog URL to see where
 * the slots sit without enabling them.
 *
 * Before turning ads on: update /privacy (it currently says myMoodly uses no
 * advertising cookies) and add cookie consent where the provider requires it.
 *
 * Placement rules, kept deliberately light so reading comes first:
 * - at most two slots per article, none above the first paragraph;
 * - the in-article slot only appears in longer posts, never next to a heading
 *   or a callout;
 * - no ads at all on posts with `adsAllowed: false` (crisis, self-harm, grief);
 * - every slot reserves its height so the page doesn't jump when an ad loads.
 */
export const ADS_ENABLED = false;

export type AdPlacement = "article-inline" | "article-end" | "index-feed";

export const AD_SLOT_HEIGHT: Record<AdPlacement, number> = {
  "article-inline": 280,
  "article-end": 280,
  "index-feed": 250,
};

/** Shortest article body (in blocks) that gets an in-article slot. */
export const INLINE_AD_MIN_BLOCKS = 12;
