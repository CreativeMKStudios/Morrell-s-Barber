/** Prefix internal paths with Astro's base, so GitHub project pages keep working. */
export function withBase(path: string) {
  if (/^(https?:|tel:|mailto:)/.test(path)) return path;
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (suffix === "/") return base ? `${base}/` : "/";
  return `${base}${suffix}`;
}
