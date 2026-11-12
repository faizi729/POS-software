/**
 * GST slabs per tenant. Self-contained (no imports) so it can be unit-tested by
 * `node --test`; app code uses `toPaise`/`roundPaise` from `@/lib/hotel/money`.
 *
 * `uptoPaise` is the night tariff ceiling (inclusive); the last slab acts as the
 * fallback. NOTE: configurable defaults, **not** tax advice — verify the rates
 * against the current GST notification for hotel accommodation before go-live.
 */
export type GstSlab = { uptoPaise: number; percent: number };

const round = (value: number) => Math.round(Number(value) || 0);

export const DEFAULT_GST_SLABS: GstSlab[] = [
  { uptoPaise: 750_000, percent: 12 }, // up to ₹7,500 per night
  { uptoPaise: 9_999_999_999, percent: 18 } // above ₹7,500
];

/** Normalises a tenant's slab table; falls back to the defaults. */
export function normalizeSlabs(slabs?: Array<{ uptoPaise?: number; percent?: number }> | null): GstSlab[] {
  const cleaned = (slabs ?? [])
    .filter((slab) => Number.isFinite(slab?.percent))
    .map((slab) => ({
      uptoPaise: round(Number(slab.uptoPaise) || 0),
      percent: Number(slab.percent) || 0
    }))
    .filter((slab) => slab.uptoPaise > 0)
    .sort((a, b) => a.uptoPaise - b.uptoPaise);

  return cleaned.length ? cleaned : DEFAULT_GST_SLABS;
}

/** Rate that applies to a single night at `nightlyPaise`. */
export function slabPercentFor(nightlyPaise: number, slabs: GstSlab[]): number {
  const table = slabs.length ? slabs : DEFAULT_GST_SLABS;
  const match = table.find((slab) => round(nightlyPaise) <= slab.uptoPaise);
  return match ? match.percent : table[table.length - 1].percent;
}

/** Tax for one night at its own tariff slab. */
export function nightTax(nightlyPaise: number, slabs: GstSlab[]): { percent: number; taxPaise: number } {
  const percent = slabPercentFor(nightlyPaise, slabs);
  return { percent, taxPaise: round((round(nightlyPaise) * percent) / 100) };
}

/** Tax across several nights, each taxed at its own slab. */
export function stayTax(nightlyPaise: number[], slabs: GstSlab[]): number {
  return round(nightlyPaise.reduce((total, rate) => total + nightTax(rate, slabs).taxPaise, 0));
}
