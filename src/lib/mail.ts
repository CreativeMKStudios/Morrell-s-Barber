import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import type { Booking } from "./store.ts";
import { salon } from "../data/salon.ts";
import { formatLongDate, formatRange } from "./slots.ts";

export type MailResult = {
  customer: boolean;
  managers: boolean;
  mode: string;
  previews: string[];
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function paymentLine(booking: Booking) {
  if (booking.payment === "salon") {
    return "Pay in the salon on the day. No card has been taken.";
  }
  if (booking.paymentStatus === "paid") {
    return "Paid online. The card payment has gone through.";
  }
  return "You asked to pay online. No card has been taken on this website. Pay in the salon, unless the salon sends a payment link.";
}

function textBody(booking: Booking, audience: "customer" | "manager") {
  const when = `${formatLongDate(booking.date)}, ${formatRange(booking.time, booking.durationMin)}`;
  const hello =
    audience === "customer"
      ? `Hello ${booking.name},`
      : "New booking for Morrell's.";
  const lines = [
    hello,
    "",
    audience === "customer"
      ? "Your time at Morrell's is booked. Please keep this email."
      : "A customer has booked on the website. Please keep this email.",
    "",
    `Reference: ${booking.ref}`,
    `Service: ${booking.serviceName}`,
    `When: ${when}`,
    `Name: ${booking.name}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    `Stylist note: ${booking.stylist || "No preference"}`,
    `Notes: ${booking.notes || "None"}`,
    `Payment: ${paymentLine(booking)}`,
    "",
    "If this time will not work, please phone each other and move it.",
    `Salon phone: ${salon.phoneDisplay}`,
    `Address: ${salon.address.street}, ${salon.address.locality} ${salon.address.postalCode}`,
    "",
    "Morrell's, Kettering",
  ];
  return lines.join("\n");
}

function htmlBody(booking: Booking, audience: "customer" | "manager") {
  const when = `${formatLongDate(booking.date)}, ${formatRange(booking.time, booking.durationMin)}`;
  const rows = [
    ["Reference", booking.ref],
    ["Service", booking.serviceName],
    ["When", when],
    ["Name", booking.name],
    ["Email", booking.email],
    ["Phone", booking.phone],
    ["Stylist note", booking.stylist || "No preference"],
    ["Notes", booking.notes || "None"],
    ["Payment", paymentLine(booking)],
  ];
  const intro =
    audience === "customer"
      ? `Hello ${escapeHtml(booking.name)}, your time at Morrell's is booked.`
      : "A customer has booked on the website.";
  const table = rows
    .map(
      ([label, value]) =>
        `<tr><th style="text-align:left;padding:8px 12px 8px 0;vertical-align:top">${escapeHtml(label)}</th><td style="padding:8px 0">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1e1813;line-height:1.45">
  <p>${intro}</p>
  <table>${table}</table>
  <p>If this time will not work, please phone and move it. Salon: ${salon.phoneDisplay}.</p>
  <p>${escapeHtml(salon.address.street)}, ${escapeHtml(salon.address.locality)} ${escapeHtml(salon.address.postalCode)}</p>
  </body></html>`;
}

async function transport() {
  const host = process.env.SMTP_HOST;
  if (host) {
    const port = Number(process.env.SMTP_PORT || 587);
    return {
      mode: "smtp",
      transporter: nodemailer.createTransport({
        host,
        port,
        secure: port === 465 || process.env.SMTP_SECURE === "true",
        ignoreTLS: process.env.SMTP_IGNORE_TLS === "true",
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      }),
      previews: [] as string[],
    };
  }
  if (process.env.EMAIL_MODE === "ethereal") {
    const account = await nodemailer.createTestAccount();
    return {
      mode: "ethereal",
      transporter: nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      }),
      previews: [] as string[],
    };
  }
  return null;
}

function managerList() {
  return (process.env.MANAGER_EMAIL || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function fromAddress() {
  return process.env.EMAIL_FROM || `Morrell's <bookings@localhost>`;
}

function writeOutbox(name: string, payload: unknown) {
  const dir = path.join(process.cwd(), "data", "outbox");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), JSON.stringify(payload, null, 2));
}

async function withTimeout<T>(work: Promise<T>, ms = 8000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Email timed out")), ms);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function sendBookingEmails(booking: Booking): Promise<MailResult> {
  const managers = managerList();
  const customerSubject = `Your Morrell's booking, ${formatLongDate(booking.date)}`;
  const managerSubject = `New booking ${booking.ref}: ${booking.name}, ${booking.serviceName}`;
  const customerMail = { to: booking.email, subject: customerSubject, text: textBody(booking, "customer") };
  const managerMail = { to: managers, subject: managerSubject, text: textBody(booking, "manager") };
  writeOutbox(`${booking.ref}.json`, { customer: customerMail, managers: managerMail });

  const setup = await withTimeout(transport()).catch((error) => {
    console.error(error);
    return null;
  });

  if (!setup) {
    return { customer: false, managers: false, mode: "outbox", previews: [] };
  }

  const previews: string[] = [];
  let customer = false;
  let managersOk = false;
  try {
    const info = await withTimeout(setup.transporter.sendMail({
      from: fromAddress(),
      to: booking.email,
      subject: customerSubject,
      text: textBody(booking, "customer"),
      html: htmlBody(booking, "customer"),
    }));
    customer = true;
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) previews.push(preview);
  } catch (error) {
    console.error("Customer email failed", error);
  }

  if (managers.length) {
    try {
      const info = await withTimeout(setup.transporter.sendMail({
        from: fromAddress(),
        to: managers,
        replyTo: booking.email,
        subject: managerSubject,
        text: textBody(booking, "manager"),
        html: htmlBody(booking, "manager"),
      }));
      managersOk = true;
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) previews.push(preview);
    } catch (error) {
      console.error("Manager email failed", error);
    }
  }

  return { customer, managers: managersOk, mode: setup.mode, previews };
}

export async function sendContactEmail(message: {
  name: string;
  email: string;
  phone: string;
  text: string;
}) {
  const managers = managerList();
  const subject = `Message from ${message.name}`;
  const text = [
    "New message from the website.",
    "",
    `Name: ${message.name}`,
    `Email: ${message.email}`,
    `Phone: ${message.phone || "Not given"}`,
    "",
    message.text,
  ].join("\n");
  writeOutbox(`message-${Date.now()}.json`, { to: managers, subject, text });
  const setup = await withTimeout(transport()).catch(() => null);
  if (!setup || !managers.length) {
    return { sent: false, mode: "outbox" };
  }
  await withTimeout(
    setup.transporter.sendMail({
      from: fromAddress(),
      to: managers,
      replyTo: message.email,
      subject,
      text,
    }),
  );
  return { sent: true, mode: setup.mode };
}
