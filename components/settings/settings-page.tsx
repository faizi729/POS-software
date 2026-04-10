"use client";

import Link from "next/link";

import { BillCloneSettingsCard } from "@/components/settings/bill-clone-settings-card";
import { RestaurantProfileCard } from "@/components/settings/restaurant-profile-card";
import { TaxSettingsPage } from "@/components/settings/tax-settings-page";
import { WhatsAppSettingsCard } from "@/components/settings/whatsapp-settings-card";
import { Button } from "@/components/ui/button";

export function SettingsPageClient({ restaurant }: { restaurant: any }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link href="/settings/tables">
          <Button variant="secondary">Tables</Button>
        </Link>
      </div>
      <RestaurantProfileCard restaurant={restaurant} />
      <TaxSettingsPage restaurant={restaurant} />
      <WhatsAppSettingsCard restaurant={restaurant} />
      <BillCloneSettingsCard restaurantName={restaurant?.name ?? "Restaurant"} restaurantId={restaurant?._id ?? restaurant?.id} />
    </div>
  );
}
