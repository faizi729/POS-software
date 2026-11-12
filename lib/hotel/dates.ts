/** Pure date helpers (no imports) — safe to unit-test and reuse anywhere. */
const NIGHT_MS = 24 * 60 * 60 * 1000;

/** "2026-11-20" (or any parseable date) → UTC midnight of that calendar date. */
export function toUtcDate(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
  if (match) return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  const parsed = new Date(value);
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * NIGHT_MS);
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / NIGHT_MS));
}

/** Nights occupied by the stay: [checkIn, checkOut) — same-day turnaround is 0 nights. */
export function eachNight(checkIn: Date, checkOut: Date): Date[] {
  const nights: Date[] = [];
  for (let d = toUtcDate(checkIn); d < checkOut; d = addDays(d, 1)) nights.push(d);
  return nights;
}

/** Half-open overlap: [aStart, aEnd) ∩ [bStart, bEnd) ≠ ∅ */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}
