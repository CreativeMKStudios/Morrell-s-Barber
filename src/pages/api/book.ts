import type { APIRoute } from "astro";
import { createBooking, parseBooking } from "../../lib/booking.ts";
import { sendBookingEmails } from "../../lib/mail.ts";
import { updateBooking } from "../../lib/store.ts";

export const prerender = false;

const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((time) => now - time < 60 * 60 * 1000);
  if (recent.length >= 8) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

async function readBody(request: Request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    return (await request.json()) as Record<string, unknown>;
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries()) as Record<string, unknown>;
}

function wantsHtml(request: Request) {
  const type = request.headers.get("content-type") || "";
  return !type.includes("application/json");
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const html = wantsHtml(request);
  if (limited(clientAddress || "local")) {
    return reply({ error: "Too many bookings from this network. Please call the salon." }, 429, html);
  }
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return reply({ error: "That booking could not be saved." }, 403, html);
  }
  let raw: Record<string, unknown>;
  try {
    raw = await readBody(request);
  } catch {
    return reply({ error: "That booking could not be read." }, 400, html);
  }
  const parsed = parseBooking(raw);
  if (!parsed.input) return reply({ error: parsed.error }, 400, html);
  const created = createBooking(parsed.input);
  if (!created.booking) return reply({ error: created.error }, 409, html);

  let mail = { customer: false, managers: false, mode: "error", previews: [] as string[] };
  try {
    mail = await sendBookingEmails(created.booking);
  } catch (error) {
    console.error("Email send failed", error);
  }
  const emailsSent = mail.customer && mail.managers;
  if (emailsSent) updateBooking(created.booking.ref, { emailsSent: true });
  if (mail.previews.length) {
    console.log("Booking email previews", created.booking.ref, mail.previews.join(" "));
  }

  const payload = {
    ok: true,
    ref: created.booking.ref,
    emailsSent,
    emailMode: mail.mode,
    message: emailsSent
      ? "Booked. We have emailed you and the salon."
      : "Booked, but the email did not send. Please call 01536 481561 and quote your reference.",
  };
  if (html) {
    return new Response(null, {
      status: 303,
      headers: { Location: `/book/confirmed?ref=${created.booking.ref}` },
    });
  }
  return Response.json(payload);
};

function reply(body: { error?: string }, status: number, html: boolean) {
  if (html) {
    return new Response(
      `<!doctype html><meta charset="utf-8"><title>Booking</title><p>${body.error}</p><p><a href="/book">Back to booking</a></p>`,
      { status, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }
  return Response.json(body, { status });
}
