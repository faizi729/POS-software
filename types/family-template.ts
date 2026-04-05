/* ──────────────────────────────────────────────────────────────────────────────
   Family Comfort Restaurant Template — Type Definitions
   ────────────────────────────────────────────────────────────────────────── */

// ─── Theme ───────────────────────────────────────────────────────────────────
export interface FamilyTheme {
  primary: string;
  background: string;
  accent: string;
  text: string;
}

// ─── Section Config ──────────────────────────────────────────────────────────
export type FamilySectionType =
  | "hero"
  | "todaySpecial"
  | "story"
  | "menu"
  | "catering"
  | "community";

export interface FamilySectionConfig {
  type: FamilySectionType;
  variant: string;
}

// ─── Template Config ─────────────────────────────────────────────────────────
export interface FamilyTemplateConfig {
  template: string;
  theme: FamilyTheme;
  sections: FamilySectionConfig[];
}

// ─── Today's Special ─────────────────────────────────────────────────────────
export interface TodaySpecialData {
  name: string;
  image: string;
  story: string;
  price: number;
  currency: string;
}

// ─── Story Timeline ──────────────────────────────────────────────────────────
export interface TimelineItem {
  id: string;
  year: string;
  image: string;
  description: string;
  annotation?: string; // handwritten-style note
}

// ─── Menu Item ───────────────────────────────────────────────────────────────
export interface FamilyMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  occasion: string; // "sunday-lunch" | "kids" | "birthday" | "catering"
}

export interface FamilyMenuData {
  items: FamilyMenuItem[];
}

// ─── Community Event ─────────────────────────────────────────────────────────
export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  image: string;
  date?: string;
  tag?: string; // "Event", "Class", "Loyalty"
}

// ─── Catering Inquiry ────────────────────────────────────────────────────────
export interface CateringPayload {
  name: string;
  phone: string;
  eventSize: string;
  message: string;
}

export type CateringHandler = (payload: CateringPayload) => void | Promise<void>;

// ─── Restaurant Data ─────────────────────────────────────────────────────────
export interface FamilyRestaurantData {
  name: string;
  tagline: string;
  heroImage: string;
  trustText: string;
  todaySpecial: TodaySpecialData;
  storyTimeline: TimelineItem[];
  community: CommunityEvent[];
  phone: string;
  whatsapp?: string;
  address?: string;
}

// ─── Component Props ─────────────────────────────────────────────────────────
export interface FamilyTemplateProps {
  restaurantData: FamilyRestaurantData;
  menuData: FamilyMenuData;
  config: FamilyTemplateConfig;
  onCateringInquiry?: CateringHandler;
}

export interface FamilySectionProps {
  restaurantData: FamilyRestaurantData;
  menuData: FamilyMenuData;
  theme: FamilyTheme;
  onCateringInquiry?: CateringHandler;
}
