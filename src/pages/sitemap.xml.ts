import type { APIRoute } from "astro";
import services from "../data/services.json";
import posts from "../data/posts.json";
import { SITE } from "../site";

export const GET: APIRoute = () => {
  const pages = [
    "/",
    "/services/",
    ...services.map((s) => `/service/${s.slug}/`),
    "/leadcrystal/",
    "/company-overview/",
    "/company-overview/our-partners/",
    "/company-overview/careers/",
    "/news/",
    ...posts.map((p) => `/${p.slug}/`),
    "/contact/",
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE.url}${p}</loc></url>`).join("\n")}
</urlset>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
