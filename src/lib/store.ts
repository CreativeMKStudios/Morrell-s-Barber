import fs from "node:fs";
import path from "node:path";

export type PaymentChoice = "salon" | "online";

export type Booking = {
  ref: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  ends: string;
  durationMin: number;
  notes: string;
  stylist: string;
  payment: PaymentChoice;
  paymentStatus: "pay_in_salon" | "online_requested" | "paid";
  emailsSent: boolean;
};

const file = path.join(process.cwd(), "data", "bookings.json");

export function readBookings(): Booking[] {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as Booking[];
  } catch {
    return [];
  }
}

export function saveBooking(booking: Booking) {
  const all = readBookings();
  all.push(booking);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(all, null, 2));
  fs.renameSync(tmp, file);
}

export function findBooking(ref: string) {
  return readBookings().find((booking) => booking.ref === ref) ?? null;
}

export function updateBooking(ref: string, patch: Partial<Booking>) {
  const all = readBookings();
  const next = all.map((booking) => (booking.ref === ref ? { ...booking, ...patch } : booking));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(next, null, 2));
}

export function countSlot(date: string, time: string) {
  return readBookings().filter((booking) => booking.date === date && booking.time === time).length;
}

export function newRef() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let code = "";
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return `MR-${code}`;
}
