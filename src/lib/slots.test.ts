import assert from "node:assert/strict";
import test from "node:test";
import { addDays, hoursFor, londonNow, slotsFor, weekdayOf } from "./slots.ts";

test("Wednesday on the Google listing closes at 4pm", () => {
  assert.deepEqual(hoursFor("2026-11-04"), { open: "09:00", close: "16:00" });
  assert.equal(weekdayOf("2026-11-04"), 3);
});

test("Monday, Thursday and Sunday are closed", () => {
  assert.equal(hoursFor("2026-11-02"), null);
  assert.equal(hoursFor("2026-11-05"), null);
  assert.equal(hoursFor("2026-11-08"), null);
});

test("a 45 minute cut on Saturday cannot start after 3pm", () => {
  const slots = slotsFor("2026-11-07", 45, new Date("2026-11-01T12:00:00Z"));
  assert.equal(slots[0], "08:30");
  assert.equal(slots.at(-1), "15:00");
  assert.equal(slots.includes("15:30"), false);
});

test("colour must finish by closing", () => {
  const slots = slotsFor("2026-11-04", 150, new Date("2026-11-01T12:00:00Z"));
  assert.equal(slots.at(-1), "13:30");
});

test("same-day slots need 30 minutes notice in London", () => {
  const now = new Date("2026-11-06T12:10:00Z");
  const london = londonNow(now);
  assert.equal(london.iso, "2026-11-06");
  assert.equal(london.hour, 12);
  const slots = slotsFor("2026-11-06", 30, now);
  assert.equal(slots[0], "13:00");
});

test("bookings stop 8 weeks ahead", () => {
  const now = new Date("2026-11-06T12:00:00Z");
  const tooFar = addDays("2026-11-06", 57);
  assert.deepEqual(slotsFor(tooFar, 30, now), []);
});
