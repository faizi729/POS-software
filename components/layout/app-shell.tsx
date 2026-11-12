import { AppShellClient } from "@/components/layout/app-shell-client";
import type { NavigationItem } from "@/components/layout/app-shell-client";
import { getSession } from "@/lib/auth/get-session";
import { getRestaurantBundle } from "@/server/repositories/mongo-repository";
import { enabledModulesOf } from "@/lib/modules";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db/connect";
import { MenuItem, ReceiptTemplate, Restaurant } from "@/models";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const data = await getRestaurantBundle(session.restaurantId);

  /**
   * Gate onboarding.
   *
   * Important: we DO NOT solely trust `restaurant.onboarding.*` flags because:
   * - older tenants may have real data (menu/templates) but flags defaulted to false
   * - a previous write may have failed, causing an onboarding redirect loop
   *
   * So if flags indicate "not complete", we verify by checking existence of actual data
   * and backfill the flags to "heal" the tenant.
   */
  if (!data.restaurant) {
    redirect(`/onboarding?rid=${encodeURIComponent(session.restaurantId)}`);
  }

  const storedMenuImported = Boolean((data as any).restaurant?.onboarding?.menuImported);
  const storedReceiptSaved = Boolean((data as any).restaurant?.onboarding?.receiptTemplateSaved);

  let menuImported = storedMenuImported;
  let receiptTemplateSaved = storedReceiptSaved;

  // Fast-path: if both flags are already true, never hit DB again.
  if (!(menuImported && receiptTemplateSaved)) {
    // Menu existence can be derived from already-fetched bundle
    menuImported = menuImported || (Array.isArray(data.menuItems) && data.menuItems.length > 0);

    // Receipt templates are not in the bundle; do a lightweight count only when needed
    if (!receiptTemplateSaved) {
      await connectToDatabase();
      const templateCount = await ReceiptTemplate.countDocuments({ restaurantId: session.restaurantId });
      receiptTemplateSaved = templateCount > 0;
    }

    // If reality says onboarding is done, backfill flags to prevent future loops
    if (menuImported || receiptTemplateSaved) {
      const set: Record<string, any> = {};
      if (menuImported && !storedMenuImported) set["onboarding.menuImported"] = true;
      if (receiptTemplateSaved && !storedReceiptSaved) set["onboarding.receiptTemplateSaved"] = true;

      if (Object.keys(set).length) {
        // Best-effort backfill; never block render on it
        Restaurant.findByIdAndUpdate(session.restaurantId, {
          $set: set,
          $currentDate: { "onboarding.completedAt": { $type: "date" } as any }
        }).catch(() => {});
      }
    }
  }

  // Modules come from the Restaurant document — the dashboard bundle DTO does not carry them.
  await connectToDatabase();
  const moduleRow = await Restaurant.findById(session.restaurantId).select("enabledModules").lean();
  const modules = enabledModulesOf(moduleRow as any);
  const posEnabled = modules.includes("pos");

  // POS tenants must finish onboarding (menu + receipt template). Rooms/Banquet-only tenants have neither.
  const needsOnboarding = posEnabled && !(menuImported && receiptTemplateSaved);
  if (needsOnboarding) {
    const rid = (data.restaurant?.id as string) || session.restaurantId;
    redirect(`/onboarding?rid=${encodeURIComponent(rid)}`);
  }

  // Count active kitchen orders for badge
  const kitchenOrders = data.orders.filter(
    (o) => o.status === "placed" || o.status === "preparing" || o.status === "ready"
  ).length;

  const navigation: NavigationItem[] = [
    ...(posEnabled
      ? ([
          {
            href: "/dashboard",
            label: "Dashboard",
            badge: `${data.orders.filter((order) => order.status !== "cancelled").length}`
          },
          {
            href: "/orders",
            label: "Orders",
            badge: `${data.orders.filter((order) => order.status !== "completed").length}`
          },
          { href: "/kitchen", label: "Kitchen", badge: `${kitchenOrders}` },
          {
            href: "/menu",
            label: "Menu",
            badge: `${data.menuItems.filter((item) => item.isAvailable).length}`
          },
          { href: "/inventory", label: "Inventory", badge: "" },
          { href: "/payments", label: "Payments", badge: `${data.payments.length}` },
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
    { href: "/maintenance", label: "Maintenance", badge: "" },
    { href: "/rates", label: "Rates", badge: "" },
    { href: "/reports", label: "Reports", badge: "" },
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
      restaurantName={data.restaurant?.name ?? "Restaurant"}
      restaurantSlug={data.restaurant?.slug ?? "workspace"}
      userName={session.name}
      userRole={session.role}
    >
      {children}
    </AppShellClient>
  );
}
