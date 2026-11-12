import type { ClientSession } from "mongoose";

import { InvoiceCounter } from "@/models";
import { financialYear, formatInvoiceNumber } from "@/lib/hotel/invoice-format";

export { financialYear, formatInvoiceNumber };

export type InvoiceNumber = { invoiceNumber: string; fy: string; seq: number };

/**
 * Atomically reserves the next invoice number for a tenant + financial year.
 * Never reused: the counter only increments inside the checkout transaction.
 */
export async function nextInvoiceNumber(params: {
  restaurantId: string;
  scope?: "hotel" | "banquet";
  date?: Date;
  prefix?: string;
  session?: ClientSession | null;
}): Promise<InvoiceNumber> {
  const fy = financialYear(params.date ?? new Date());
  const scope = params.scope ?? "hotel";
  const prefix = (params.prefix || "INV").trim().toUpperCase() || "INV";

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const counter = await InvoiceCounter.findOneAndUpdate(
        { restaurantId: params.restaurantId, scope, fy },
        { $inc: { seq: 1 } },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          ...(params.session ? { session: params.session } : {})
        }
      ).lean();

      const seq = counter?.seq ?? 1;
      return { invoiceNumber: formatInvoiceNumber(prefix, fy, seq), fy, seq };
    } catch (error) {
      const duplicate = typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
      if (!duplicate || attempt === 1) throw error;
    }
  }

  throw new Error("Could not allocate an invoice number");
}
