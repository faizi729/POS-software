/* ──────────────────────────────────────────────────────────────────────────────
   Minimal Aesthetic Cafe Template — Type Definitions
   ────────────────────────────────────────────────────────────────────────── */

// ─── Theme ───────────────────────────────────────────────────────────────────
export interface CafeTheme {
  background: string;
  primary: string;
  accent: string;
  text: string;
}

// ─── Section Config ──────────────────────────────────────────────────────────
export type CafeSectionType =
  | "hero"
  | "menu"
  | "space"
  | "subscription"
  | "events"
  | "gift";

export interface CafeSectionConfig {
  type: CafeSectionType;
  variant: string;
}

// ─── Template Config ─────────────────────────────────────────────────────────
export interface CafeTemplateConfig {
  template: string;
  theme: CafeTheme;
  sections: CafeSectionConfig[];
}

// ─── Menu Item ───────────────────────────────────────────────────────────────
export interface CafeMenuItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  tags: string[]; // "Vegan", "GF", "Oat", "Seasonal"
  ingredientStory?: string;
  category?: string;
}

export interface CafeMenuData {
  items: CafeMenuItem[];
}

// ─── Space Images ────────────────────────────────────────────────────────────
export interface SpaceImage {
  id: string;
  src: string;
  alt: string;
  zone: string; // "window-seat", "couch", "bar"
}

// ─── Subscription Plans ──────────────────────────────────────────────────────
export interface SubscriptionPlan {
  id: string;
  tier: string;
  price: number;
  currency: string;
  period: string;
  benefits: string[];
  highlighted?: boolean;
}

// ─── Events ──────────────────────────────────────────────────────────────────
export interface CafeEvent {
  id: string;
  name: string;
  date: string;
  time?: string;
  description: string;
  image?: string;
}

// ─── Instagram ───────────────────────────────────────────────────────────────
export interface InstagramImage {
  id: string;
  src: string;
  alt: string;
  link?: string;
}

// ─── Gift Card ───────────────────────────────────────────────────────────────
export interface GiftCardPayload {
  amount: number;
  recipientEmail: string;
  senderName?: string;
  message?: string;
}

export type GiftCardHandler = (payload: GiftCardPayload) => void | Promise<void>;

// ─── Restaurant Data ─────────────────────────────────────────────────────────
export interface CafeRestaurantData {
  name: string;
  tagline: string;
  heroImage: string;
  todayBrew: string;
  workspaceInfo: string;
  followers: string;
  spaceImages: SpaceImage[];
  subscriptionPlans: SubscriptionPlan[];
  events: CafeEvent[];
  instagramImages: InstagramImage[];
  instagramHandle?: string;
  giftCardAmounts: number[];
  giftCurrency: string;
}

// ─── Component Props ─────────────────────────────────────────────────────────
export interface CafeTemplateProps {
  restaurantData: CafeRestaurantData;
  menuData: CafeMenuData;
  config: CafeTemplateConfig;
  onGiftCard?: GiftCardHandler;
}

export interface CafeSectionProps {
  restaurantData: CafeRestaurantData;
  menuData: CafeMenuData;
  theme: CafeTheme;
  onGiftCard?: GiftCardHandler;
}
