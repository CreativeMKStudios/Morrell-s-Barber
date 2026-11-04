import type { APIRoute } from "astro";
import { withBase } from "../lib/url.ts";

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(withBase("/sitemap-index.xml"), site).href;
  const body = `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /book/confirmed\n\nSitemap: ${sitemap}\n`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
};
