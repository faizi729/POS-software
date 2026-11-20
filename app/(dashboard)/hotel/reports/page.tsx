import Link from "next/link";
import { redirect } from "next/navigation";

import { HotelTabs } from "@/components/hotel/hotel-tabs";
import { NightAuditButton } from "@/components/hotel/night-audit-button";
import { requireSession } from "@/lib/auth/guards";
import { connectToDatabase } from "@/lib/db/connect";
import { addDays, toUtcDate } from "@/lib/hotel/availability";
import { businessDateTotals, buildHotelReport } from "@/lib/hotel/reports";
import { formatCurrency } from "@/lib/utils/format";
import { hasModule } from "@/lib/modules";
import { BusinessDate, Restaurant } from "@/models";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await requireSession();
  await connectToDatabase();

  const restaurant = await Restaurant.findById(session.restaurantId).select("enabledModules").lean();
  if (!hasModule(restaurant, "rooms")) redirect("/dashboard");

  const to = addDays(toUtcDate(new Date()), 1);
  const from = addDays(to, -30);
  const report = await buildHotelReport(session.restaurantId, { from, to });

  const auditDate = addDays(toUtcDate(new Date()), -1);
  const auditDateKey = auditDate.toISOString().slice(0, 10);
  const [audit, closed] = await Promise.all([
    businessDateTotals(session.restaurantId, auditDate),
    BusinessDate.findOne({ restaurantId: session.restaurantId, date: auditDate, status: "closed" }).lean()
  ]);

  const kpis = [
    { label: "Occupancy", value: `${report.occupancyPercent}%` },
    { label: "ADR", value: formatCurrency(report.adr / 100) },
    { label: "RevPAR", value: formatCurrency(report.revpar / 100) },
    { label: "Room revenue", value: formatCurrency(report.roomRevenue / 100) },
    { label: "F&B", value: formatCurrency(report.fnbRevenue / 100) },
    { label: "Banquet", value: formatCurrency(report.banquetRevenue / 100) }
  ];

  return (
    <main className="section-shell space-y-4">
      <HotelTabs modules={(restaurant?.enabledModules ?? []) as string[]} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-text-primary">Reports</h1>
        <Link
          className="text-sm font-medium text-text-secondary underline"
          href={`/api/hotel/reports?from=${report.from}&to=${report.to}&format=csv`}
        >
          Download CSV
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="surface-card p-3">
            <p className="text-xs uppercase tracking-wide text-text-muted">{kpi.label}</p>
            <p className="mt-1 text-lg font-semibold text-text-primary">{kpi.value}</p>
          </div>
        ))}
      </section>
      {/* BODY */}
      <section className="surface-card overflow-x-auto p-4">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-text-muted">
              <th className="pb-2">Date</th>
              <th className="pb-2">Rooms</th>
              <th className="pb-2">F&B</th>
              <th className="pb-2">Extras</th>
              <th className="pb-2">Tax</th>
              <th className="pb-2">Collected</th>
            </tr>
          </thead>
          <tbody>
            {report.daily.slice(-7).map((row) => (
              <tr key={row.date} className="border-t border-border-subtle">
                <td className="py-2 font-medium text-text-primary">{row.date}</td>
                <td className="py-2 text-text-secondary">{formatCurrency(row.room / 100)}</td>
                <td className="py-2 text-text-secondary">{formatCurrency(row.fnb / 100)}</td>
                <td className="py-2 text-text-secondary">{formatCurrency(row.extra / 100)}</td>
                <td className="py-2 text-text-secondary">{formatCurrency(row.tax / 100)}</td>
                <td className="py-2 text-text-secondary">{formatCurrency(row.collected / 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="surface-card p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Payments</p>
          <ul className="mt-2 space-y-1 text-sm">
            {report.byMethod.length === 0 ? <li className="text-text-muted">No payments</li> : null}
            {report.byMethod.map((row) => (
              <li key={row.method} className="flex justify-between">
                <span className="capitalize text-text-secondary">{row.method}</span>
                <span className="text-text-primary">
                  {formatCurrency(row.collected / 100)}
                  {row.refunded ? ` − ${formatCurrency(row.refunded / 100)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Sources</p>
          <ul className="mt-2 space-y-1 text-sm">
            {report.bySource.length === 0 ? <li className="text-text-muted">No reservations</li> : null}
            {report.bySource.map((row) => (
              <li key={row.source} className="flex justify-between">
                <span className="capitalize text-text-secondary">{row.source.replace("_", " ")}</span>
                <span className="text-text-primary">
                  {row.reservations} · {formatCurrency(row.revenue / 100)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Night audit · {auditDateKey}</p>
          <p className="mt-1 text-sm text-text-secondary">
            Room {formatCurrency(audit.totals.roomPaise / 100)} · F&B{" "}
            {formatCurrency(audit.totals.fnbPaise / 100)} · Collected{" "}
            {formatCurrency(audit.totals.collectedPaise / 100)}
          </p>
        </div>
        <NightAuditButton closed={Boolean(closed)} date={auditDateKey} />
      </section>
    </main>
  );
}
