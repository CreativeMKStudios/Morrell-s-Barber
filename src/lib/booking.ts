import { salon, serviceById } from "../data/salon.ts";
import { isoDateOk, slotsFor, slotEnds } from "./slots.ts";
import { countSlot, newRef, saveBooking, type Booking, type PaymentChoice } from "./store.ts";

export type BookingInput = {
  name: string;
  email: string;
  phone: string;
  serviceId: string;
  date: string;
  time: string;
  notes: string;
  stylist: string;
  payment: string;
  company: string;
};

export function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseBooking(raw: Record<string, unknown>): { error?: string; input?: BookingInput } {
  const input: BookingInput = {
    name: clean(raw.name, 80),
    email: clean(raw.email, 120).toLowerCase(),
    phone: clean(raw.phone, 30),
    serviceId: clean(raw.serviceId, 40),
    date: clean(raw.date, 10),
    time: clean(raw.time, 5),
    notes: clean(raw.notes, 500),
    stylist: clean(raw.stylist, 80),
    payment: clean(raw.payment, 12),
    company: clean(raw.company, 80),
  };
  if (input.company) return { error: "That booking could not be saved." };
  if (input.name.length < 2) return { error: "Please add your name." };
  if (!emailOk.test(input.email)) return { error: "Please add a real email address." };
  const digits = input.phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return { error: "Please add a phone number we can call." };
  if (!serviceById(input.serviceId)) return { error: "Please choose a service." };
  if (!isoDateOk(input.date)) return { error: "Please choose a date." };
  if (!/^\d{2}:\d{2}$/.test(input.time)) return { error: "Please choose a time." };
  if (input.payment !== "salon" && input.payment !== "online") {
    return { error: "Please choose pay in the salon or pay online." };
  }
  return { input };
}

export function createBooking(input: BookingInput, now = new Date()): { error?: string; booking?: Booking } {
  const service = serviceById(input.serviceId);
  if (!service) return { error: "Please choose a service." };
  const openSlots = slotsFor(input.date, service.minutes, now);
  if (!openSlots.includes(input.time)) {
    return { error: "That time is not free in the opening hours. Pick another." };
  }
  const chairs = Number(process.env.CHAIRS || salon.defaultChairs);
  if (countSlot(input.date, input.time) >= chairs) {
    return { error: "That time is full. Pick another." };
  }
  const payment = input.payment as PaymentChoice;
  const booking: Booking = {
    ref: newRef(),
    createdAt: now.toISOString(),
    name: input.name,
    email: input.email,
    phone: input.phone,
    serviceId: service.id,
    serviceName: service.name,
    date: input.date,
    time: input.time,
    ends: slotEnds(input.time, service.minutes),
    durationMin: service.minutes,
    notes: input.notes,
    stylist: input.stylist,
    payment,
    paymentStatus: payment === "salon" ? "pay_in_salon" : "online_requested",
    emailsSent: false,
  };
  saveBooking(booking);
  return { booking };
}
