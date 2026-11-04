import { weekdayHours, weekdayNames, type Opening } from "../data/salon.ts";

const WEEKDAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type LondonNow = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
  iso: string;
};

export function londonNow(now = new Date()): LondonNow {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((part) => [part.type, part.value]),
  );
  const weekdayToken = parts.weekday.replace(".", "");
  const weekday = WEEKDAY[weekdayToken];
  if (weekday === undefined) {
    throw new Error(`Unexpected weekday token: ${parts.weekday}`);
  }
  const iso = `${parts.year}-${parts.month}-${parts.day}`;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday,
    iso,
  };
}

export function toMinutes(hhmm: string) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

export function fromMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function weekdayOf(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function addDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function hoursFor(iso: string): Opening {
  return weekdayHours[weekdayOf(iso)] ?? null;
}

export function isOpenDate(iso: string) {
  return hoursFor(iso) !== null;
}

/** Start times whose full service fits before closing. Same-day slots need 30 minutes' notice. */
export function slotsFor(iso: string, durationMin: number, now = new Date()) {
  const hours = hoursFor(iso);
  if (!hours) return [];
  const today = londonNow(now);
  if (iso < today.iso) return [];
  if (iso > addDays(today.iso, 56)) return [];

  const open = toMinutes(hours.open);
  const close = toMinutes(hours.close);
  const starts: string[] = [];
  for (let minute = open; minute + durationMin <= close; minute += 30) {
    starts.push(fromMinutes(minute));
  }
  if (iso !== today.iso) return starts;
  const earliest = today.hour * 60 + today.minute + 30;
  return starts.filter((start) => toMinutes(start) >= earliest);
}

export function slotEnds(start: string, durationMin: number) {
  return fromMinutes(toMinutes(start) + durationMin);
}

export function formatClock(hhmm: string) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const suffix = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 || 12;
  if (minutes === 0) return `${hour12}${suffix}`;
  return `${hour12}:${String(minutes).padStart(2, "0")}${suffix}`;
}

export function formatRange(start: string, durationMin: number) {
  return `${formatClock(start)}–${formatClock(slotEnds(start, durationMin))}`;
}

export function formatLongDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatHours(hours: Opening) {
  if (!hours) return "Closed";
  return `${formatClock(hours.open)} – ${formatClock(hours.close)}`;
}

export function monthLabel(year: number, month: number) {
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function calendarCells(year: number, month: number) {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const mondayIndex = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<{ iso: string; day: number } | null> = [];
  for (let i = 0; i < mondayIndex; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ iso, day });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function todayLabel(now = new Date()) {
  const nowParts = londonNow(now);
  const hours = weekdayHours[nowParts.weekday];
  const dayName = weekdayNames[nowParts.weekday];
  if (!hours) return `${dayName}: closed`;
  const minute = nowParts.hour * 60 + nowParts.minute;
  if (minute < toMinutes(hours.open)) {
    return `Opens ${formatClock(hours.open)} today`;
  }
  if (minute >= toMinutes(hours.close)) return "Closed for today";
  return `Open today until ${formatClock(hours.close)}`;
}

export function isoDateOk(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}
