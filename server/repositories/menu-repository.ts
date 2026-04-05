import { MenuCategory, MenuItem } from "@/models";

export async function getMenuItemsByRestaurant(restaurantId: string) {
  return MenuItem.find({ restaurantId }).sort({ sortOrder: 1, name: 1 }).lean();
}

export async function getMenuCategoriesByRestaurant(restaurantId: string) {
  return MenuCategory.find({ restaurantId, isActive: true }).sort({ sortOrder: 1 }).lean();
}
