import { connectToDatabase } from "@/lib/db/connect";
import { Restaurant, User } from "@/models";

type SeedContext = {
  restaurantId: string;
  userId: string;
};

export async function ensureSeedData(): Promise<SeedContext> {
  await connectToDatabase();

  let restaurant = await Restaurant.findOne({ slug: "amber-yard" });

  if (!restaurant) {
    restaurant = await Restaurant.create({
      name: "Amber Yard",
      slug: "amber-yard",
      timezone: "Asia/Calcutta",
      currency: "INR",
      status: "active",
      settings: {
        taxMode: "exclusive",
        gstEnabled: true,
        gstRatePercent: 5,
        serviceChargeEnabled: false,
        orderPrefix: "POS",
        defaultPaymentMethods: ["cash", "card", "upi"]
      },
      contact: {
        phone: "+91 98765 43210",
        email: "ops@amberyard.com",
        address: "12 Market Street"
      }
    });
  }

  let user = await User.findOne({
    restaurantId: restaurant._id,
    email: "manager@amberyard.com"
  });

  if (!user) {
    user = await User.create({
      restaurantId: restaurant._id,
      name: "Alex Kim",
      email: "manager@amberyard.com",
      passwordHash: "seeded-password-hash-placeholder-restaurant-pos",
      role: "owner",
      status: "active"
    });
  }

  return {
    restaurantId: restaurant._id.toString(),
    userId: user._id.toString()
  };
}
