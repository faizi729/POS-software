/**
 * Cancellation policy math. Self-contained (no imports) so `node --test` can load it.
 *
 * Free until `freeUntilHours` before check-in, then `chargeNights` nights or
 * `chargePercent` of the stay — whichever the tenant configured (larger wins).
 */
const round = (value: number) => Math.round(Number(value) || 0);

export type CancellationPolicy = {
  freeUntilHours: number;
  chargeNights: number;
  chargePercent: number;
};

export const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = {
  freeUntilHours: 24,
  chargeNights: 1,
  chargePercent: 0
};

export type CancellationInput = {
  policy: CancellationPolicy;
  /** Whole nights in the stay. */
  nights: number;
  /** Nightly rate in paise (the first night is what gets charged). */
  nightlyPaise: number;
  /** Total stay value in paise (room charges only). */
  stayPaise: number;
  /** Hours between "now" and check-in; negative once check-in has passed. */
  hoursToCheckIn: number;
};

export type CancellationResult = {
  /** Amount the property keeps (penalty), in paise. */
  penaltyPaise: number;
  /** Amount to refund from collected payments, in paise. */
  refundablePaise: number;
  /** True when the cancellation falls inside the free window. */
  isFree: boolean;
};

export function computeCancellation(input: CancellationInput, paidPaise: number): CancellationResult {
  const nights = Math.max(0, Math.round(input.nights));
  const stay = Math.max(0, round(input.stayPaise));
  const free = input.hoursToCheckIn >= Math.max(0, input.policy.freeUntilHours);

  let penalty = 0;
  if (!free) {
    const byNights = round(
      Math.min(nights, Math.max(0, input.policy.chargeNights)) * Math.max(0, round(input.nightlyPaise))
    );
    const byPercent = round((stay * Math.max(0, input.policy.chargePercent)) / 100);
    penalty = Math.min(stay, Math.max(byNights, byPercent));
  }

  const paid = Math.max(0, round(paidPaise));
  return {
    penaltyPaise: penalty,
    refundablePaise: Math.max(0, Math.min(paid, round(paid - penalty))),
    isFree: free
  };
}

/** Hours from now until a UTC-midnight date (+ optional local check-in hour). */
export function hoursUntil(date: Date, checkInHour = 14, now = new Date()): number {
  const target = new Date(date.getTime() + Math.max(0, checkInHour) * 60 * 60 * 1000);
  return (target.getTime() - now.getTime()) / (60 * 60 * 1000);
}
