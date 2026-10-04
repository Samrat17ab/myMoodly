import { Fragment } from "react";
import { INLINE_AD_MIN_BLOCKS } from "@/app/blog/lib/ads";
import type { Block, Post } from "@/app/blog/lib/types";
import { AdSlot } from "./AdSlot";
import { CheckInInline } from "./CheckInCta";
import { InlineText } from "./InlineText";

const INLINE_CTA_MIN_BLOCKS = 8;

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Index after which an insert can sit between two plain paragraphs, closest to `fraction` of the way through. */
function paragraphGapNear(blocks: Block[], fraction: number, avoid: number[] = []): number | null {
  const target = Math.round(blocks.length * fraction);
  const isGap = (i: number) =>
    blocks[i]?.type === "p" && blocks[i + 1]?.type === "p" && avoid.every((a) => Math.abs(a - i) >= 2);
  for (let offset = 0; offset < blocks.length; offset++) {
    if (isGap(target - offset)) return target - offset;
    if (isGap(target + offset)) return target + offset;
  }
  return null;
}

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case "p":
      return (
        <p key={key}>
          <InlineText text={block.text} />
        </p>
      );
    case "h2":
      return (
        <h2 key={key} id={slugify(block.text)}>
          {block.text}
        </h2>
      );
    case "h3":
      return <h3 key={key}>{block.text}</h3>;
    case "ul":
    case "ol": {
      const List = block.type;
      return (
        <List key={key}>
          {block.items.map((item, i) => (
            <li key={i}>
              <InlineText text={item} />
            </li>
          ))}
        </List>
      );
    }
    case "quote":
      return (
        <blockquote key={key}>
          <p>
            <InlineText text={block.text} />
          </p>
          {block.cite && <cite>{block.cite}</cite>}
        </blockquote>
      );
    case "callout":
      return (
        <aside key={key} className="mm-callout">
          {block.title && <p className="mm-callout__title">{block.title}</p>}
          <p>
            <InlineText text={block.text} />
          </p>
        </aside>
      );
  }
}

export function ArticleBody({ post, adPreview }: { post: Post; adPreview: boolean }) {
  const { body } = post;
  const adAfter =
    post.adsAllowed !== false && body.length >= INLINE_AD_MIN_BLOCKS ? paragraphGapNear(body, 0.45) : null;
  const ctaAfter =
    body.length >= INLINE_CTA_MIN_BLOCKS ? paragraphGapNear(body, 0.72, adAfter === null ? [] : [adAfter]) : null;

  return (
    <div className="mm-prose">
      {body.map((block, i) => (
        <Fragment key={i}>
          {renderBlock(block, i)}
          {i === adAfter && <AdSlot placement="article-inline" preview={adPreview} />}
          {i === ctaAfter && <CheckInInline />}
        </Fragment>
      ))}
    </div>
  );
}
