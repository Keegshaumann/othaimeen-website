import type { APIRoute } from "astro";
import { SITE } from "../site";

export const GET: APIRoute = () =>
  new Response(
    SITE.noindex
      ? "User-agent: *\nDisallow: /\n"
      : `User-agent: *\nDisallow: /api/\n\nSitemap: ${SITE.url}/sitemap.xml\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
