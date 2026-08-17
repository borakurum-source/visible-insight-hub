import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://1cite.com";

const staticPaths = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/ucretsiz-yapay-zeka-gorunurluk-raporu", priority: "0.9", changefreq: "weekly" },
  { path: "/ozellikler", priority: "0.9", changefreq: "monthly" },
  { path: "/metodoloji", priority: "0.8", changefreq: "monthly" },
  { path: "/platform/citation-share", priority: "0.7", changefreq: "monthly" },
  { path: "/platform/evidence-gaps", priority: "0.7", changefreq: "monthly" },
  { path: "/solutions/agencies", priority: "0.7", changefreq: "monthly" },
  { path: "/fiyatlandirma", priority: "0.8", changefreq: "monthly" },
  { path: "/proof/filmfolk", priority: "0.6", changefreq: "monthly" },
  { path: "/hakkimizda", priority: "0.5", changefreq: "yearly" },
  { path: "/sunum", priority: "0.4", changefreq: "yearly" },
  { path: "/makaleler", priority: "0.7", changefreq: "weekly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/kvkk", priority: "0.3", changefreq: "yearly" },
];

const articleSlugs = [
  "yapay-zeka-atif-payini-olcmek",
  "kanit-acigi-nedir",
  "ureten-motor-optimizasyonu-geo",
  "filmfolk-vaka-incelemesi",
  "en-iyi-ai-gorunurluk-araclari",
  "ajanslar-icin-geo-ai-gorunurluk-araclari",
  "icerik-ekipleri-icin-ai-arama-optimizasyon-araclari",
  "yapay-zeka-gorunurlugu-nedir",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const { listBlogSitemapEntries } = await import("@/lib/blog.functions");
        let dbEntries: Array<{ path: string; priority: string; changefreq: string; lastmod?: string }> = [];
        try {
          const rows = await listBlogSitemapEntries();
          dbEntries = (rows ?? [])
            .filter((row) => !articleSlugs.includes(row.slug))
            .map((row) => ({
              path: `/makaleler/${row.slug}`,
              priority: "0.6",
              changefreq: "monthly",
              lastmod: String(row.updated_at ?? "").slice(0, 10) || today,
            }));
        } catch {
          dbEntries = [];
        }
        const entries = [
          ...staticPaths,
          ...articleSlugs.map((slug) => ({ path: `/makaleler/${slug}`, priority: "0.6", changefreq: "monthly" })),
          ...dbEntries,
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) =>
      `  <url><loc>${BASE_URL}${entry.path === "/" ? "/" : entry.path}</loc><lastmod>${("lastmod" in entry && entry.lastmod) || today}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
