import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("sitemap-index.xml", site).href;
  const body = `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /book/confirmed\n\nSitemap: ${sitemap}\n`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
};
