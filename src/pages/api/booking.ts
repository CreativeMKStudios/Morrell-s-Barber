import type { APIRoute } from "astro";
import { findBooking } from "../../lib/store.ts";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const ref = url.searchParams.get("ref") || "";
  if (!/^MR-[A-Z2-9]{6}$/.test(ref)) {
    return Response.json({ error: "Unknown booking." }, { status: 404 });
  }
  const booking = findBooking(ref);
  if (!booking) return Response.json({ error: "Unknown booking." }, { status: 404 });
  return Response.json({
    ref: booking.ref,
    name: booking.name,
    serviceName: booking.serviceName,
    date: booking.date,
    time: booking.time,
    ends: booking.ends,
    durationMin: booking.durationMin,
    payment: booking.payment,
    paymentStatus: booking.paymentStatus,
    emailsSent: booking.emailsSent,
  });
};
