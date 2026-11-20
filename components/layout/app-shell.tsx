import { redirect } from "next/navigation";

import { AppShellClient } from "@/components/layout/app-shell-client";
import type { NavigationItem } from "@/components/layout/app-shell-client";
import { getSession } from "@/lib/auth/get-session";
import { connectToDatabase } from "@/lib/db/connect";
import { enabledModulesOf } from "@/lib/modules";
import { MenuItem, Order, Payment, ReceiptTemplate, Restaurant } from "@/models";

/**
 * The shell renders on EVERY dashboard page, so it must stay cheap: one
 * restaurant read plus a few indexed counts. It must never load the full POS
 * bundle (all orders / payments / menu) — doing that made every page load a
 * full-collection scan that got slower as the data grew.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  await connectToDatabase();

  // One parallel wave: the restaurant document + the POS badge counts.
  // Counts are indexed and cast the tenant id for us; results are ignored for
  // non-POS tenants so they never pay a second round trip.
  const [restaurant, activeOrders, openOrders, kitchen, menuAvailable, payments] = await Promise.all([
    Restaurant.findById(session.restaurantId).select("name slug enabledModules onboarding").lean(),
    Order.countDocuments({ restaurantId: session.restaurantId, status: { $ne: "cancelled" } }),
    Order.countDocuments({ restaurantId: session.restaurantId, status: { $ne: "completed" } }),
    Order.countDocuments({
      restaurantId: session.restaurantId,
      status: { $in: ["placed", "preparing", "ready"] }
    }),
    MenuItem.countDocuments({ restaurantId: session.restaurantId, isActive: true, isAvailable: true }),
    Payment.countDocuments({ restaurantId: session.restaurantId })
  ]);

  if (!restaurant) {
    redirect(`/onboarding?rid=${encodeURIComponent(session.restaurantId)}`);
  }

  const modules = enabledModulesOf(restaurant as { enabledModules?: string[] | null });
  const posEnabled = modules.includes("pos");
  const onboarding =
    (restaurant as { onboarding?: { menuImported?: boolean; receiptTemplateSaved?: boolean } }).onboarding ?? {};

  let menuImported = Boolean(onboarding.menuImported);
  let receiptTemplateSaved = Boolean(onboarding.receiptTemplateSaved);

  /**
   * POS tenants must finish onboarding. When the flags say "not done", verify the
   * real data once and heal the flags — never trust old flags blindly (that
   * caused redirect loops) and never load the whole menu to check.
   */
  if (posEnabled && !(menuImported && receiptTemplateSaved)) {
    const [hasMenu, hasTemplate] = await Promise.all([
      menuImported
        ? Promise.resolve(true)
        : MenuItem.exists({ restaurantId: session.restaurantId, isActive: true }),
      receiptTemplateSaved
        ? Promise.resolve(true)
        : ReceiptTemplate.exists({ restaurantId: session.restaurantId })
    ]);

    menuImported = menuImported || Boolean(hasMenu);
    receiptTemplateSaved = receiptTemplateSaved || Boolean(hasTemplate);

    const set: Record<string, unknown> = {};
    if (menuImported && !onboarding.menuImported) set["onboarding.menuImported"] = true;
    if (receiptTemplateSaved && !onboarding.receiptTemplateSaved) set["onboarding.receiptTemplateSaved"] = true;

    if (Object.keys(set).length) {
      Restaurant.findByIdAndUpdate(session.restaurantId, {
        $set: set,
        $currentDate: { "onboarding.completedAt": { $type: "date" } as never }
      }).catch(() => {});
    }
  }

  if (posEnabled && !(menuImported && receiptTemplateSaved)) {
    redirect(`/onboarding?rid=${encodeURIComponent(session.restaurantId)}`);
  }

  const badge = posEnabled
    ? { activeOrders, openOrders, kitchen, menuAvailable, payments }
    : { activeOrders: 0, openOrders: 0, kitchen: 0, menuAvailable: 0, payments: 0 };

  const navigation: NavigationItem[] = [
    ...(posEnabled
      ? ([
          {
            href: "/dashboard",
            label: "Dashboard",
            badge: `${badge.activeOrders}`
          },
          {
            href: "/orders",
            label: "Orders",
            badge: `${badge.openOrders}`
          },
          { href: "/kitchen", label: "Kitchen", badge: `${badge.kitchen}` },
          {
            href: "/menu",
            label: "Menu",
            badge: `${badge.menuAvailable}`
          },
          { href: "/inventory", label: "Inventory", badge: "" },
          { href: "/payments", label: "Payments", badge: `${badge.payments}` },
          { href: "/crm", label: "CRM", badge: "" },
          { href: "/insights", label: "Insights", badge: "" },
          { href: "/whatsapp", label: "WhatsApp", badge: "" },
          { href: "/reports", label: "Reports", badge: "" },
          { href: "/templates", label: "Templates", badge: "6" }
        ] satisfies NavigationItem[])
      : []),
    ...(modules.includes("rooms") ? [{ href: "/hotel", label: "Hotel", badge: "" } satisfies NavigationItem] : []),
    ...(modules.includes("banquet")
      ? [{ href: "/banquet", label: "Banquet", badge: "" } satisfies NavigationItem]
      : [])
  ];

  const hotelNavigation: NavigationItem[] = [
    { href: "/hotel", label: "Overview", badge: "" },
    { href: "/rooms", label: "Rooms", badge: "" },
    { href: "/housekeeping", label: "Housekeeping", badge: "" },
    { href: "/hotel/maintenance", label: "Maintenance", badge: "" },
    { href: "/hotel/rates", label: "Rates", badge: "" },
    { href: "/hotel/reports", label: "Reports", badge: "" },
    { href: "/rooms/setup", label: "Setup", badge: "" },
    ...(modules.includes("banquet")
      ? [{ href: "/banquet", label: "Banquet", badge: "" } satisfies NavigationItem]
      : []),
    ...(posEnabled ? [{ href: "/dashboard", label: "POS", badge: "" } satisfies NavigationItem] : [])
  ];

  const banquetNavigation: NavigationItem[] = [
    { href: "/banquet", label: "Calendar", badge: "" },
    { href: "/banquet/halls", label: "Halls", badge: "" },
    ...(modules.includes("rooms")
      ? [{ href: "/hotel", label: "Hotel", badge: "" } satisfies NavigationItem]
      : []),
    ...(posEnabled ? [{ href: "/dashboard", label: "POS", badge: "" } satisfies NavigationItem] : [])
  ];

  return (
    <AppShellClient
      navigation={navigation}
      hotelNavigation={hotelNavigation}
      banquetNavigation={banquetNavigation}
      restaurantName={restaurant.name}
      restaurantSlug={restaurant.slug}
      userName={session.name}
      userRole={session.role}
    >
      {children}
    </AppShellClient>
  );
}
