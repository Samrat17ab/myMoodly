import Link from "next/link";
import { formatDate, readingMinutes } from "@/app/blog/lib/posts";
import type { Category, Post } from "@/app/blog/lib/types";

const CATEGORY_TONE: Record<Category, string> = {
  Loneliness: "heavy",
  Feelings: "stirred",
  Research: "settled",
  Updates: "bright",
};

export function categoryTone(category: Category) {
  return CATEGORY_TONE[category];
}

export function PostMeta({ post }: { post: Post }) {
  return (
    <p className="mm-post-meta">
      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      <span aria-hidden="true">·</span>
      <span>{readingMinutes(post)} min read</span>
    </p>
  );
}

export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <article className={`mm-card${featured ? " mm-card--featured" : ""}`}>
      <div className={`mm-card__cover mm-card__cover--${categoryTone(post.category)}`} aria-hidden="true" />
      <div className="mm-card__body">
        <p className="mm-card__category">{post.category}</p>
        <h2 className={featured ? "mm-card__title mm-card__title--lg" : "mm-card__title"}>
          <Link href={`/blog/${post.slug}`} className="mm-card__link">
            {post.title}
          </Link>
        </h2>
        <p className="mm-card__excerpt">{post.description}</p>
        <PostMeta post={post} />
      </div>
    </article>
  );
}
