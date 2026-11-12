import type { ClientSession } from "mongoose";

import { eachNight } from "@/lib/hotel/dates";
import { roundPaise, sumPaise } from "@/lib/hotel/money";
import { nightTax, normalizeSlabs, type GstSlab } from "@/lib/hotel/tax";
import { RatePlan, RoomType } from "@/models";

export type NightRate = { date: string; ratePaise: number; planId?: string; planName?: string };

export type StayQuote = {
  nights: NightRate[];
  nightlyFromPaise: number;
  roomTotalPaise: number;
  extraAdultPaise: number;
  childPaise: number;
  mealPlanPaise: number;
  discountPaise: number;
  totalPaise: number;
  taxPaise: number;
  taxPercent: number;
  planId?: string;
  planName?: string;
  discountCode?: string;
  mealPlan?: string;
  /** True when no rate plan matched and the room type base rate was used. */
  fallback: boolean;
};

export type QuoteInput = {
  restaurantId: string;
  roomTypeId?: string | null;
  checkIn: Date;
  checkOut: Date;
  adults?: number;
  children?: number;
  discountCode?: string | null;
  slabs?: GstSlab[] | null;
  session?: ClientSession | null;
};

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

/** Most specific plan wins: room-type match, then priority, then latest start date. */
function pickPlan(
  plans: Array<Record<string, any>>,
  night: Date,
  nights: number,
  roomTypeId?: string | null
) {
  const weekday = night.getUTCDay();
  const candidates = plans.filter((plan) => {
    if (!plan.active) return false;
    if (plan.roomTypeId && roomTypeId && String(plan.roomTypeId) !== String(roomTypeId)) return false;
    if (plan.roomTypeId && !roomTypeId) return false;
    if (plan.dateFrom && night < new Date(plan.dateFrom)) return false;
    if (plan.dateTo && night > new Date(plan.dateTo)) return false;
    if (Array.isArray(plan.weekdays) && plan.weekdays.length && !plan.weekdays.includes(weekday)) return false;
    if ((plan.minNights ?? 1) > nights) return false;
    return true;
  });

  return candidates.sort((a, b) => {
    const specificity = Number(Boolean(b.roomTypeId)) - Number(Boolean(a.roomTypeId));
    if (specificity !== 0) return specificity;
    const priority = (b.priority ?? 0) - (a.priority ?? 0);
    if (priority !== 0) return priority;
    return new Date(b.dateFrom ?? 0).getTime() - new Date(a.dateFrom ?? 0).getTime();
  })[0];
}

/**
 * Price a stay night by night. Every night is priced independently (season,
 * weekday, plan) and the returned `ratePaise` is the final nightly tariff that is
 * stored on the `RoomNight` row.
 */
export async function quoteStay(input: QuoteInput): Promise<StayQuote> {
  const nights = eachNight(input.checkIn, input.checkOut);
  const adults = Math.max(1, input.adults ?? 2);
  const children = Math.max(0, input.children ?? 0);
  const code = (input.discountCode || "").trim().toUpperCase();
  const session = input.session ?? null;

  const [plans, roomType] = await Promise.all([
    RatePlan.find({ restaurantId: input.restaurantId, active: true }).session(session).lean(),
    input.roomTypeId ? RoomType.findById(input.roomTypeId).session(session).lean() : Promise.resolve(null)
  ]);

  const discountPlan = code
    ? (plans as any[]).find(
        (plan) => (plan.discountCode || "").toUpperCase() === code && (plan.discountPercent ?? 0) > 0
      )
    : undefined;

  let roomTotal = 0;
  let extraAdult = 0;
  let childCharge = 0;
  let meal = 0;
  let fallback = !roomType;
  let planId: string | undefined;
  let planName: string | undefined;
  let mealPlan: string | undefined;

  const nightRates: NightRate[] = nights.map((night) => {
    const plan = pickPlan(plans as any[], night, nights.length, input.roomTypeId);
    const base = plan ? plan.baseRatePaise ?? 0 : roundPaise((roomType?.baseRate ?? 0) * 100);
    if (!plan) fallback = true;

    if (plan) {
      planId = String(plan._id);
      planName = plan.name;
      mealPlan = plan.mealPlan;
      const includedAdults = plan.includedAdults ?? 2;
      const includedChildren = plan.includedChildren ?? 0;
      extraAdult += Math.max(0, adults - includedAdults) * (plan.extraAdultPaise ?? 0);
      childCharge += Math.max(0, children - includedChildren) * (plan.childPaise ?? 0);
      meal += plan.mealPlanPaise ?? 0;
    }

    roomTotal += base;
    return {
      date: dayKey(night),
      ratePaise: roundPaise(base),
      planId: plan ? String(plan._id) : undefined,
      planName: plan?.name
    };
  });

  const discountPercent = discountPlan?.discountPercent ?? 0;
  const gross = sumPaise([roomTotal, extraAdult, childCharge, meal]);
  const discount = roundPaise((gross * discountPercent) / 100);
  const total = Math.max(0, roundPaise(gross - discount));

  // Spread extras/discount across the nights so RoomNight holds the final tariff.
  const perNight = nights.length ? Math.round((extraAdult + childCharge + meal - discount) / nights.length) : 0;
  if (perNight !== 0) {
    for (const night of nightRates) night.ratePaise = Math.max(0, roundPaise(night.ratePaise + perNight));
  }

  const slabs = normalizeSlabs(input.slabs);
  const taxPaise = sumPaise(nightRates.map((night) => nightTax(night.ratePaise, slabs).taxPaise));
  const taxPercent = nightRates.length ? nightTax(nightRates[0].ratePaise, slabs).percent : 0;

  return {
    nights: nightRates,
    nightlyFromPaise: nightRates.length ? Math.min(...nightRates.map((night) => night.ratePaise)) : 0,
    roomTotalPaise: roundPaise(roomTotal),
    extraAdultPaise: roundPaise(extraAdult),
    childPaise: roundPaise(childCharge),
    mealPlanPaise: roundPaise(meal),
    discountPaise: discount,
    totalPaise: total,
    taxPaise,
    taxPercent,
    planId,
    planName,
    discountCode: discountPercent ? code : undefined,
    mealPlan,
    fallback
  };
}

/** Nightly tariff per room type for a date range (availability grid / public page). */
export async function ratesByRoomType(params: {
  restaurantId: string;
  checkIn: Date;
  checkOut: Date;
  adults?: number;
  session?: ClientSession | null;
}): Promise<Map<string, number>> {
  const types = await RoomType.find({ restaurantId: params.restaurantId })
    .select("_id baseRate")
    .session(params.session ?? null)
    .lean();

  const out = new Map<string, number>();
  for (const type of types) {
    const quote = await quoteStay({
      restaurantId: params.restaurantId,
      roomTypeId: String(type._id),
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      adults: params.adults,
      session: params.session
    });
    out.set(String(type._id), quote.nightlyFromPaise);
  }
  return out;
}
