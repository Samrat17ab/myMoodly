"use client";

import { useEffect } from "react";

// Anonymous blog analytics (see app/api/blog-event): one view per page load,
// a "read" once the reader gets 75% of the way through the article, and a
// "cta" when they click a Check in link. Nothing personal is sent.

function send(slug: string, event: "view" | "read" | "cta") {
  const payload = JSON.stringify({
    slug,
    event,
    referrer: document.referrer || null,
    utm: new URLSearchParams(window.location.search).get("utm_source"),
  });
  try {
    // sendBeacon survives the page unloading, which matters for CTA clicks.
    if (navigator.sendBeacon?.("/api/blog-event", new Blob([payload], { type: "application/json" }))) return;
  } catch {
    // fall through to fetch
  }
  void fetch("/api/blog-event", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
}

export function BlogAnalytics({ slug, articleId }: { slug: string; articleId?: string }) {
  useEffect(() => {
    send(slug, "view");

    let read = false;
    const onScroll = () => {
      if (read || !articleId) return;
      const article = document.getElementById(articleId);
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / Math.max(1, rect.height);
      if (progress >= 0.75) {
        read = true;
        send(slug, "read");
        window.removeEventListener("scroll", onScroll);
      }
    };

    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href="/signin"]');
      if (link) send(slug, "cta");
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, [slug, articleId]);

  return null;
}
