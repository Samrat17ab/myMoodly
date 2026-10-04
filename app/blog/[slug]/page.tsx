import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/app/components/blog/AdSlot";
import { ArticleBody } from "@/app/components/blog/ArticleBody";
import { CheckInPanel } from "@/app/components/blog/CheckInCta";
import { JsonLd } from "@/app/components/blog/JsonLd";
import { PostCard, PostMeta, categoryTone } from "@/app/components/blog/PostCard";
import { ReadingProgress } from "@/app/components/blog/ReadingProgress";
import { SITE_URL, getPost, getPosts, getRelated, postUrl } from "../lib/posts";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ ads?: string }> };

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const url = postUrl(post.slug);
  return {
    title: `${post.title} | myMoodly`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      siteName: "myMoodly",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.author],
      section: post.category,
      images: [{ url: `${SITE_URL}/og.jpg`, width: 1200, height: 628, alt: post.title }],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

export default async function BlogPost({ params, searchParams }: Params) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const adPreview = (await searchParams).ads === "preview";
  const url = postUrl(post.slug);
  const related = getRelated(post);

  return (
    <main className="mm-blog-main mm-blog-main--article">
      <ReadingProgress targetId="mm-article" />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt ?? post.publishedAt,
          author: { "@type": "Organization", name: post.author, url: SITE_URL },
          publisher: {
            "@type": "Organization",
            name: "myMoodly",
            url: SITE_URL,
            logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png` },
          },
          image: `${SITE_URL}/og.jpg`,
          mainEntityOfPage: url,
          articleSection: post.category,
          ...(post.sources?.length
            ? { citation: post.sources.map((s) => ({ "@type": "CreativeWork", name: s.label, ...(s.url ? { url: s.url } : {}) })) }
            : {}),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "myMoodly", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
            { "@type": "ListItem", position: 3, name: post.title, item: url },
          ],
        }}
      />

      <article id="mm-article" className="mm-article">
        <header className={`mm-article__header mm-article__header--${categoryTone(post.category)}`}>
          <nav className="mm-crumbs" aria-label="Breadcrumb">
            <Link href="/blog">Blog</Link>
            <span aria-hidden="true">/</span>
            <span>{post.category}</span>
          </nav>
          <h1 className="mm-article__title">{post.title}</h1>
          <p className="mm-article__dek">{post.description}</p>
          <div className="mm-article__byline">
            <span className="mm-article__author">{post.author}</span>
            <PostMeta post={post} />
          </div>
        </header>

        <ArticleBody post={post} adPreview={adPreview} />

        {post.sources && post.sources.length > 0 && (
          <section className="mm-sources" aria-labelledby="mm-sources-title">
            <h2 id="mm-sources-title">Sources</h2>
            <ol>
              {post.sources.map((s) => (
                <li key={s.label}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  ) : (
                    s.label
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}
      </article>

      {post.adsAllowed !== false && <AdSlot placement="article-end" preview={adPreview} />}

      <CheckInPanel heading="If this sounds familiar, you don't have to sit with it alone." />

      {related.length > 0 && (
        <section className="mm-related" aria-labelledby="mm-related-title">
          <h2 id="mm-related-title" className="mm-related__title">
            Keep reading
          </h2>
          <div className="mm-related__grid">
            {related.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
