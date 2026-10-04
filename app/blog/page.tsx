import type { Metadata } from "next";
import { AdSlot } from "@/app/components/blog/AdSlot";
import { CheckInPanel } from "@/app/components/blog/CheckInCta";
import { JsonLd } from "@/app/components/blog/JsonLd";
import { PostCard } from "@/app/components/blog/PostCard";
import { ADS_ENABLED } from "./lib/ads";
import { BLOG_DESCRIPTION, BLOG_TITLE, SITE_URL, getPosts, postUrl } from "./lib/posts";

export const metadata: Metadata = {
  title: `${BLOG_TITLE}: loneliness, feelings and connection`,
  description: BLOG_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/blog`,
    types: { "application/rss+xml": `${SITE_URL}/blog/feed.xml` },
  },
  openGraph: {
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    url: `${SITE_URL}/blog`,
    type: "website",
    siteName: "myMoodly",
    images: [{ url: `${SITE_URL}/og.jpg`, width: 1200, height: 628, alt: BLOG_TITLE }],
  },
};

const FEED_AD_AFTER = 3;

export default async function BlogIndex({ searchParams }: { searchParams: Promise<{ ads?: string }> }) {
  const adPreview = (await searchParams).ads === "preview";
  const [featured, ...rest] = getPosts();

  return (
    <main className="mm-blog-main">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: BLOG_TITLE,
          description: BLOG_DESCRIPTION,
          url: `${SITE_URL}/blog`,
          publisher: { "@type": "Organization", name: "myMoodly", url: SITE_URL },
          blogPost: getPosts().map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            url: postUrl(p.slug),
            datePublished: p.publishedAt,
          })),
        }}
      />

      <header className="mm-blog-hero">
        <p className="mm-blog-hero__overline">The myMoodly blog</p>
        <h1 className="mm-display mm-display--lg">Notes on feeling, and finding your people.</h1>
        <p className="mm-lede">{BLOG_DESCRIPTION}</p>
      </header>

      {featured && (
        <section className="mm-blog-featured" aria-label="Latest post">
          <PostCard post={featured} featured />
        </section>
      )}

      {rest.length > 0 && (
        <section className="mm-blog-grid" aria-label="More posts">
          {rest.slice(0, FEED_AD_AFTER).map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
          {(ADS_ENABLED || adPreview) && (
            <div className="mm-blog-grid__full">
              <AdSlot placement="index-feed" preview={adPreview} />
            </div>
          )}
          {rest.slice(FEED_AD_AFTER).map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </section>
      )}

      <CheckInPanel />
    </main>
  );
}
