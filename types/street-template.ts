/* ──────────────────────────────────────────────────────────────────────────────
   Fast Casual Street Template — Type Definitions
   ────────────────────────────────────────────────────────────────────────── */

// ─── Theme ───────────────────────────────────────────────────────────────────
export interface StreetTheme {
  background: string;
  primary: string;
  accent: string;
  text: string;
}

// ─── Section Config ──────────────────────────────────────────────────────────
export type StreetSectionType =
  | "hero"
  | "menu"
  | "builder"
  | "social"
  | "rewards"
  | "location";

export interface StreetSectionConfig {
  type: StreetSectionType;
  variant: string;
}

// ─── Template Config ─────────────────────────────────────────────────────────
export interface StreetTemplateConfig {
  template: string;
  theme: StreetTheme;
  sections: StreetSectionConfig[];
}

// ─── Order Mode ──────────────────────────────────────────────────────────────
export type OrderMode = "dine-in" | "takeaway" | "delivery";

// ─── Menu Item ───────────────────────────────────────────────────────────────
export interface StreetMenuItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  category: string;
  tags: string[]; // "veg", "non-veg", "bestseller"
  spiceLevel: number; // 0-5
  calories?: number;
  allergens?: string[];
  description?: string;
}

export interface StreetMenuData {
  items: StreetMenuItem[];
}

// ─── Builder ─────────────────────────────────────────────────────────────────
export interface BuilderOption {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export interface BuilderStep {
  id: string;
  label: string;
  options: BuilderOption[];
  multi?: boolean; // allow multiple selections (toppings)
}

// ─── Social ──────────────────────────────────────────────────────────────────
export interface SocialImage {
  id: string;
  src: string;
  alt: string;
  link?: string;
}

// ─── Rewards ─────────────────────────────────────────────────────────────────
export interface RewardsData {
  current: number;
  total: number;
  rewardText: string;
}

// ─── Location ────────────────────────────────────────────────────────────────
export interface LocationData {
  address: string;
  phone: string;
  mapEmbedUrl?: string;
  coordinates?: { lat: number; lng: number };
  hours: { day: string; open: string; close: string }[];
  isOpen: boolean;
}

// ─── Cart Item ───────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// ─── Restaurant Data ─────────────────────────────────────────────────────────
export interface StreetRestaurantData {
  name: string;
  tagline: string;
  subheading?: string;
  heroImage: string;
  waitTime: string;
  loyaltyText: string;
  socialImages: SocialImage[];
  rewards: RewardsData;
  location: LocationData;
  builderSteps: BuilderStep[];
}

// ─── Component Props ─────────────────────────────────────────────────────────
export interface StreetTemplateProps {
  restaurantData: StreetRestaurantData;
  menuData: StreetMenuData;
  config: StreetTemplateConfig;
}

export interface StreetSectionProps {
  restaurantData: StreetRestaurantData;
  menuData: StreetMenuData;
  theme: StreetTheme;
  cart: CartItem[];
  onAddToCart: (item: StreetMenuItem) => void;
  onRemoveFromCart: (itemId: string) => void;
  onAddBuilderItem: (item: CartItem) => void;
  orderMode: OrderMode;
  onOrderModeChange: (mode: OrderMode) => void;
}
