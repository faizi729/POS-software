import { NextRequest, NextResponse } from "next/server";

import { handleRouteError, ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { connectToDatabase } from "@/lib/db/connect";
import { addDays, toUtcDate } from "@/lib/hotel/availability";
import { toRupees } from "@/lib/hotel/money";
import { buildHotelReport, reportToCsv } from "@/lib/hotel/reports";
import { requireModuleForTenant } from "@/lib/modules";

export async function GET(request: NextRequest) {
  try {
    return withAuth<any>(["owner", "manager", "front_desk", "cashier"], async (req, _ctx, session) => {
      await requireModuleForTenant(session.restaurantId, "rooms");
      await connectToDatabase();

      const url = new URL(req.url);
      const to = addDays(toUtcDate(url.searchParams.get("to") || new Date()), 1);
      const from = toUtcDate(url.searchParams.get("from") || addDays(to, -30));
      const report = await buildHotelReport(session.restaurantId, { from, to });

      if (url.searchParams.get("format") === "csv") {
        return new NextResponse(reportToCsv(report), {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="hotel-${report.from}_${report.to}.csv"`,
            "Cache-Control": "no-store"
          }
        });
      }

      return ok({
        ...report,
        adr: toRupees(report.adr),
        revpar: toRupees(report.revpar),
        roomRevenue: toRupees(report.roomRevenue),
        fnbRevenue: toRupees(report.fnbRevenue),
        extraRevenue: toRupees(report.extraRevenue),
        banquetRevenue: toRupees(report.banquetRevenue),
        tax: toRupees(report.tax),
        collected: toRupees(report.collected),
        refunded: toRupees(report.refunded),
        bySource: report.bySource.map((row) => ({ ...row, revenue: toRupees(row.revenue) })),
        byMethod: report.byMethod.map((row) => ({
          ...row,
          collected: toRupees(row.collected),
          refunded: toRupees(row.refunded)
        })),
        daily: report.daily.map((row) => ({
          ...row,
          room: toRupees(row.room),
          fnb: toRupees(row.fnb),
          extra: toRupees(row.extra),
          tax: toRupees(row.tax),
          collected: toRupees(row.collected)
        }))
      });
    })(request, {});
  } catch (error) {
    return handleRouteError(error);
  }
}
