import { SITE_URL, getPosts, postUrl } from "../blog/lib/posts";

const STATIC_PATHS = ["/", "/blog", "/guide", "/help", "/privacy", "/terms"];

/** Generated so new blog posts are listed automatically. Replaces the old static public/sitemap.xml. */
export function GET() {
  const posts = getPosts();
  const latest = posts[0]?.updatedAt ?? posts[0]?.publishedAt;

  const urls = [
    ...STATIC_PATHS.map((path) => {
      const lastmod = path === "/blog" && latest ? `<lastmod>${latest}</lastmod>` : "";
      return `  <url><loc>${SITE_URL}${path === "/" ? "/" : path}</loc>${lastmod}</url>`;
    }),
    ...posts.map((p) => `  <url><loc>${postUrl(p.slug)}</loc><lastmod>${p.updatedAt ?? p.publishedAt}</lastmod></url>`),
  ].join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
