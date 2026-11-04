process.env.ASTRO_NODE_AUTOSTART = "disabled";
const { createServer } = await import("node:http");
const { handler } = await import("../dist/server/entry.mjs");

const port = Number(process.env.PORT || 4321);
const host = process.env.HOST || "127.0.0.1";

const security = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};
if ((process.env.PUBLIC_SITE_URL || "").startsWith("https://")) {
  security["Strict-Transport-Security"] = "max-age=15552000; includeSubDomains";
}

const server = createServer((req, res) => {
  for (const [key, value] of Object.entries(security)) res.setHeader(key, value);
  handler(req, res);
});

server.listen(port, host, () => {
  console.log(`Morrell's site listening on http://${host}:${port}`);
});
