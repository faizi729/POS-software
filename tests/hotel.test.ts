import test from "node:test";
import assert from "node:assert/strict";

import { computeCancellation, DEFAULT_CANCELLATION_POLICY, hoursUntil } from "../lib/hotel/cancellation.ts";
import { addDays, eachNight, nightsBetween, overlaps, toUtcDate } from "../lib/hotel/dates.ts";
import { financialYear, formatInvoiceNumber } from "../lib/hotel/invoice-format.ts";
import { percentOf, roundPaise, sumPaise, toPaise, toRupees } from "../lib/hotel/money.ts";
import { DEFAULT_GST_SLABS, nightTax, normalizeSlabs, slabPercentFor, stayTax } from "../lib/hotel/tax.ts";

test("money: paise <-> rupees round-trips without drift", () => {
  assert.equal(toPaise(3000), 300_000);
  assert.equal(toPaise(0.1 + 0.2), 30);
  assert.equal(toRupees(300_000), 3000);
  assert.equal(percentOf(300_000, 12), 36_000);
  assert.equal(sumPaise([10, 20, 30.4]), 60);
  assert.equal(roundPaise(10.4), 10);
});

test("dates: same-day turnaround is zero nights", () => {
  const day = toUtcDate("2026-11-20");
  assert.equal(nightsBetween(day, day), 0);
  assert.deepEqual(eachNight(day, day), []);
  assert.equal(nightsBetween(day, addDays(day, 2)), 2);
  assert.deepEqual(
    eachNight(day, addDays(day, 2)).map((d) => d.toISOString().slice(0, 10)),
    ["2026-11-20", "2026-11-21"]
  );
});

test("dates: overlap is half-open (checkout day is free)", () => {
  const a1 = toUtcDate("2026-11-20");
  const a2 = addDays(a1, 2);
  // Another stay that starts exactly when the first ends → no clash.
  assert.equal(overlaps(a1, a2, a2, addDays(a2, 1)), false);
  // One night shaved off the front → clash.
  assert.equal(overlaps(a1, a2, addDays(a1, 1), addDays(a2, 1)), true);
});

test("tax: slab is chosen per night, not per stay", () => {
  const slabs = normalizeSlabs(DEFAULT_GST_SLABS);
  assert.equal(slabPercentFor(700_000, slabs), 12); // ₹7,000
  assert.equal(slabPercentFor(750_000, slabs), 12); // boundary inclusive
  assert.equal(slabPercentFor(750_100, slabs), 18); // ₹7,501
  assert.equal(nightTax(300_000, slabs).taxPaise, 36_000);
  // 2 × ₹5,000 (12%) + 1 × ₹10,000 (18%) = 1200 + 1800
  assert.equal(stayTax([500_000, 500_000, 1_000_000], slabs), 300_000);
});

test("tax: custom tenant slabs override the defaults", () => {
  const slabs = normalizeSlabs([{ uptoPaise: 1_000_000, percent: 5 }]);
  assert.equal(slabPercentFor(900_000, slabs), 5);
  assert.equal(nightTax(900_000, slabs).taxPaise, 45_000);
});

test("cancellation: free window refunds everything collected", () => {
  const result = computeCancellation(
    {
      policy: DEFAULT_CANCELLATION_POLICY,
      nights: 2,
      nightlyPaise: 300_000,
      stayPaise: 600_000,
      hoursToCheckIn: 48
    },
    600_000
  );
  assert.equal(result.isFree, true);
  assert.equal(result.penaltyPaise, 0);
  assert.equal(result.refundablePaise, 600_000);
});

test("cancellation: late cancel charges the configured nights", () => {
  const result = computeCancellation(
    {
      policy: DEFAULT_CANCELLATION_POLICY,
      nights: 2,
      nightlyPaise: 300_000,
      stayPaise: 600_000,
      hoursToCheckIn: 2
    },
    600_000
  );
  assert.equal(result.isFree, false);
  assert.equal(result.penaltyPaise, 300_000); // 1 night
  assert.equal(result.refundablePaise, 300_000);
});

test("cancellation: percent policy wins when it is larger, capped at the stay", () => {
  const result = computeCancellation(
    {
      policy: { freeUntilHours: 24, chargeNights: 0, chargePercent: 50 },
      nights: 3,
      nightlyPaise: 200_000,
      stayPaise: 600_000,
      hoursToCheckIn: 0
    },
    100_000
  );
  assert.equal(result.penaltyPaise, 300_000);
  assert.equal(result.refundablePaise, 0); // never refunds more than was collected
});

test("cancellation: hoursUntil follows the UTC date + check-in hour", () => {
  const now = new Date("2026-11-20T02:00:00Z");
  const hours = hoursUntil(toUtcDate("2026-11-21"), 14, now);
  assert.equal(Math.round(hours), 36);
});

test("invoice: financial year flips in April", () => {
  assert.equal(financialYear(new Date("2026-03-31T00:00:00Z")), "2025-26");
  assert.equal(financialYear(new Date("2026-04-01T00:00:00Z")), "2026-27");
  assert.equal(financialYear(new Date("2026-11-12T00:00:00Z")), "2026-27");
});

test("invoice: numbers are zero-padded and monotonic", () => {
  assert.equal(formatInvoiceNumber("INV", "2026-27", 1), "INV/2026-27/00001");
  assert.equal(formatInvoiceNumber("INV", "2026-27", 42), "INV/2026-27/00042");
  assert.notEqual(formatInvoiceNumber("INV", "2026-27", 1), formatInvoiceNumber("INV", "2026-27", 2));
});
