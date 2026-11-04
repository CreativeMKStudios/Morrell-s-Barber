import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import node from "@astrojs/node";

const site = process.env.PUBLIC_SITE_URL || "https://morrells.example.com";

export default defineConfig({
  site,
  output: "static",
  trailingSlash: "never",
  adapter: node({ mode: "standalone" }),
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/book/confirmed") && !page.includes("/404"),
    }),
  ],
  compressHTML: true,
});
