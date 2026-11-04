import type { APIRoute } from "astro";
import { clean } from "../../lib/booking.ts";
import { sendContactEmail } from "../../lib/mail.ts";

export const prerender = false;

const hits = new Map<string, number[]>();

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const now = Date.now();
  const ip = clientAddress || "local";
  const recent = (hits.get(ip) || []).filter((time) => now - time < 60 * 60 * 1000);
  if (recent.length >= 6) {
    return Response.json({ error: "Too many messages. Please call the salon." }, { status: 429 });
  }
  recent.push(now);
  hits.set(ip, recent);

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return Response.json({ error: "Message not sent." }, { status: 403 });
  }

  let raw: Record<string, unknown>;
  try {
    const type = request.headers.get("content-type") || "";
    raw = type.includes("application/json")
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());
  } catch {
    return Response.json({ error: "Message not sent." }, { status: 400 });
  }

  const name = clean(raw.name, 80);
  const email = clean(raw.email, 120).toLowerCase();
  const phone = clean(raw.phone, 30);
  const text = clean(raw.message, 1000);
  const company = clean(raw.company, 80);
  if (company) return Response.json({ ok: true });
  if (name.length < 2) return Response.json({ error: "Please add your name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please add a real email address." }, { status: 400 });
  }
  if (text.length < 8) return Response.json({ error: "Please write a short message." }, { status: 400 });

  const result = await sendContactEmail({ name, email, phone, text });
  const html = !(request.headers.get("content-type") || "").includes("application/json");
  if (html) {
    return new Response(null, { status: 303, headers: { Location: "/contact?sent=1" } });
  }
  return Response.json({
    ok: true,
    sent: result.sent,
    message: result.sent
      ? "Sent. The salon has your message."
      : "Saved, but the email did not send. Please call 01536 481561.",
  });
};
