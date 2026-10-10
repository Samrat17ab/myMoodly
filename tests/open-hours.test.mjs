import assert from "node:assert/strict";
import test from "node:test";
import { openHoursState } from "../app/lib/openHours.ts";

// Builds an epoch for a wall-clock time in IST (UTC+5:30).
const ist = (y, m, d, h, min = 0, s = 0) => Date.UTC(y, m - 1, d, h, min, s) - 330 * 60_000;
const iso = (ms) => new Date(ms).toISOString();

test("open from 9 PM to 3 AM IST, closed otherwise", () => {
  const cases = [
    [ist(2026, 10, 10, 20, 59, 59), false],
    [ist(2026, 10, 10, 21, 0, 0), true],
    [ist(2026, 10, 10, 23, 59, 59), true],
    [ist(2026, 10, 11, 0, 0, 0), true],
    [ist(2026, 10, 11, 2, 59, 59), true],
    [ist(2026, 10, 11, 3, 0, 0), false],
    [ist(2026, 10, 11, 12, 0, 0), false],
  ];
  for (const [now, open] of cases) assert.equal(openHoursState(now, true).open, open, iso(now));
});

test("reports the current or next night's start and end", () => {
  // Daytime: tonight's window.
  let s = openHoursState(ist(2026, 10, 10, 14, 0), true);
  assert.equal(s.opensAt, ist(2026, 10, 10, 21, 0));
  assert.equal(s.closesAt, ist(2026, 10, 11, 3, 0));
  // Evening, open: the window already running.
  s = openHoursState(ist(2026, 10, 10, 22, 30), true);
  assert.equal(s.opensAt, ist(2026, 10, 10, 21, 0));
  assert.equal(s.closesAt, ist(2026, 10, 11, 3, 0));
  // After midnight, still open: the window that started yesterday evening.
  s = openHoursState(ist(2026, 10, 11, 1, 15), true);
  assert.equal(s.opensAt, ist(2026, 10, 10, 21, 0));
  assert.equal(s.closesAt, ist(2026, 10, 11, 3, 0));
  // Just after closing: the next evening.
  s = openHoursState(ist(2026, 10, 11, 3, 0), true);
  assert.equal(s.opensAt, ist(2026, 10, 11, 21, 0));
  // Across a month boundary.
  s = openHoursState(ist(2026, 10, 31, 23, 0), true);
  assert.equal(s.closesAt, ist(2026, 11, 1, 3, 0));
});

test("9 PM IST is 15:30 UTC and 9:15 PM in Nepal", () => {
  const s = openHoursState(Date.UTC(2026, 9, 10, 8, 0), true);
  assert.equal(new Date(s.opensAt).toISOString(), "2026-10-10T15:30:00.000Z");
  const nepal = new Date(s.opensAt).toLocaleTimeString("en-US", { timeZone: "Asia/Kathmandu", hour: "numeric", minute: "2-digit" });
  assert.equal(nepal, "9:15 PM");
});

test("with the switch off, matching is always open", () => {
  for (const h of [3, 12, 20, 21, 2]) {
    const s = openHoursState(ist(2026, 10, 10, h, 0), false);
    assert.equal(s.open, true);
    assert.equal(s.enabled, false);
  }
});
