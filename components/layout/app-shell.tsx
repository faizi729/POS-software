import { AppShellClient } from "@/components/layout/app-shell-client";
import { getSession } from "@/lib/auth/get-session";
import { getRestaurantBundle } from "@/server/repositories/mongo-repository";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const data = await getRestaurantBundle(session.restaurantId);

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
