import { NextRequest, NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { loadBanquetDocument } from "@/lib/hotel/banquet";
import { renderBanquetDocument } from "@/lib/hotel/banquet-html";
import { loadHotelSettings } from "@/lib/hotel/booking";
import { nextInvoiceNumber } from "@/lib/hotel/invoice";
import { requireModuleForTenant } from "@/lib/modules";
import { BanquetBooking } from "@/models";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Printable documents: `?doc=quotation` (default), `invoice`, `run_sheet`.
 * An invoice number is issued once and persisted, so reprints keep it.
 */
export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    return withAuth<Ctx>(["owner", "manager", "front_desk", "cashier"], async (req, context, session) => {
      await requireModuleForTenant(session.restaurantId, "banquet");
      await connectToDatabase();
      const { id } = await context.params;
      const kindParam = new URL(req.url).searchParams.get("doc") || "quotation";
      const kind = (["quotation", "invoice", "run_sheet"].includes(kindParam) ? kindParam : "quotation") as
        | "quotation"
        | "invoice"
        | "run_sheet";

      let documentNumber: string | undefined;

      if (kind === "invoice") {
        const booking = await BanquetBooking.findOne({
          _id: id,
          restaurantId: session.restaurantId
        }).lean();
        if (!booking) return new NextResponse("Not found", { status: 404 });

        if (booking.invoiceNumber) {
          documentNumber = booking.invoiceNumber;
        } else {
          const settings = await loadHotelSettings(session.restaurantId);
          const { invoiceNumber } = await nextInvoiceNumber({
            restaurantId: session.restaurantId,
            scope: "banquet",
            prefix: settings.invoicePrefix
          });
          await BanquetBooking.updateOne(
            { _id: id, restaurantId: session.restaurantId },
            { $set: { invoiceNumber, invoiceIssuedAt: new Date() } }
          );
          documentNumber = invoiceNumber;
        }
      }

      const doc = await loadBanquetDocument({
        restaurantId: session.restaurantId,
        bookingId: id,
        kind,
        documentNumber
      });
      if (!doc) return new NextResponse("Not found", { status: 404 });

      return new NextResponse(renderBanquetDocument(doc), {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
      });
    })(request, ctx);
  } catch (error) {
    return handleRouteError(error);
  }
}
