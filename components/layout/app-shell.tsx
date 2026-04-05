import { AppShellClient } from "@/components/layout/app-shell-client";
import { getSession } from "@/lib/auth/get-session";
import { getRestaurantBundle } from "@/server/repositories/mongo-repository";
import { redirect } from "next/navigation";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const data = await getRestaurantBundle(session.restaurantId);

  // Gate onboarding: if required flags are missing, redirect to onboarding
  const needsOnboarding =
    !data.restaurant ||
    !((data as any).restaurant?.settings) || // settings exist but we also check restaurant for onboarding flags if present
    !((data as any).restaurant?.onboarding?.menuImported && (data as any).restaurant?.onboarding?.receiptTemplateSaved);
  // Allow onboarding page to render itself; consumers using AppShell wrap onboarding too,
  // so rely on caller path. If not available, always allow onboarding route.
  // Since we are in a server component without pathname, rely on a soft heuristic: children of onboarding page won't need redirect here.
  if (needsOnboarding) {
    // Pass rid for better UX
    const rid = (data.restaurant?.id as string) || session.restaurantId;
    redirect(`/onboarding?rid=${encodeURIComponent(rid)}`);
  }

  // Count active kitchen orders for badge
  const kitchenOrders = data.orders.filter(
    (o) => o.status === "placed" || o.status === "preparing" || o.status === "ready"
  ).length;

  const navigation = [
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
    {
      href: "/kitchen",
      label: "Kitchen",
      badge: `${kitchenOrders}`
    },
    {
      href: "/menu",
      label: "Menu",
      badge: `${data.menuItems.filter((item) => item.isAvailable).length}`
    },
    {
      href: "/inventory",
      label: "Inventory",
      badge: ""
    },
    {
      href: "/payments",
      label: "Payments",
      badge: `${data.payments.length}`
    },
    {
      href: "/crm",
      label: "CRM",
      badge: ""
    },
    {
      href: "/insights",
      label: "Insights",
      badge: ""
    },
    {
      href: "/whatsapp",
      label: "WhatsApp",
      badge: ""
    },
    {
      href: "/reports",
      label: "Reports",
      badge: ""
    },
    {
      href: "/templates",
      label: "Templates",
      badge: "6"
    }
  ] as const;

  return (
    <AppShellClient
      navigation={navigation}
      restaurantName={data.restaurant?.name ?? "Restaurant"}
      restaurantSlug={data.restaurant?.slug ?? "workspace"}
      userName={session.name}
      userRole={session.role}
    >
      {children}
    </AppShellClient>
  );
}
