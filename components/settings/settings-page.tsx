"use client";

import { BillCloneSettingsCard } from "@/components/settings/bill-clone-settings-card";
import { RestaurantProfileCard } from "@/components/settings/restaurant-profile-card";
import { TaxSettingsPage } from "@/components/settings/tax-settings-page";
import { WhatsAppSettingsCard } from "@/components/settings/whatsapp-settings-card";

export function SettingsPageClient({ restaurant }: { restaurant: any }) {
  return (
    <div className="space-y-6">
      <RestaurantProfileCard restaurant={restaurant} />
      <TaxSettingsPage restaurant={restaurant} />
      <WhatsAppSettingsCard restaurant={restaurant} />
      <BillCloneSettingsCard restaurantName={restaurant?.name ?? "Restaurant"} restaurantId={restaurant?._id ?? restaurant?.id} />
    </div>
  );
}
