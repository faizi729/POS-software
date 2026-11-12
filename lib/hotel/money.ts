/**
 * Money is stored as integer **paise** in the database; rupees only exist at the
 * API/UI boundary. Never do arithmetic on floats.
 */
export type Paise = number;

export function toPaise(rupees: number): Paise {
  return Math.round((Number(rupees) || 0) * 100);
}

export function toRupees(paise: Paise): number {
  return Math.round(Number(paise) || 0) / 100;
}

/** Round a paise value to whole paise (guards against float drift). */
export function roundPaise(paise: number): Paise {
  return Math.round(Number(paise) || 0);
}

/** Percent of an amount, rounded to whole paise. */
export function percentOf(amount: Paise, percent: number): Paise {
  return roundPaise((roundPaise(amount) * (Number(percent) || 0)) / 100);
}

export function sumPaise(values: Array<number | null | undefined>): Paise {
  return roundPaise(values.reduce<number>((total, value) => total + (Number(value) || 0), 0));
}
