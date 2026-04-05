/* ──────────────────────────────────────────────────────────────────────────────
   Authentic Regional Cuisine Template — Type Definitions
   ────────────────────────────────────────────────────────────────────────── */

// ─── Theme ───────────────────────────────────────────────────────────────────
export interface RegionalTheme {
  primary: string;
  background: string;
  accent: string;
  highlight: string;
  text: string;
}

// ─── Section Config ──────────────────────────────────────────────────────────
export type RegionalSectionType =
  | "hero"
  | "heritage"
  | "signatureDishes"
  | "setMenu"
  | "events"
  | "chef";

export interface RegionalSectionConfig {
  type: RegionalSectionType;
  variant: string;
}

// ─── Template Config ─────────────────────────────────────────────────────────
export interface RegionalTemplateConfig {
  template: string;
  theme: RegionalTheme;
  sections: RegionalSectionConfig[];
}

// ─── Heritage Section ────────────────────────────────────────────────────────
export interface HeritageBlock {
  id: string;
  year?: string;
  heading: string;
  body: string;
  image: string;
  imageAlt: string;
}

// ─── Menu / Signature Items ──────────────────────────────────────────────────
export interface SignatureDish {
  id: string;
  name: string;
  origin: string;
  story: string;
  image: string;
  spiceLevel: 1 | 2 | 3 | 4 | 5;
  chefRecommended?: boolean;
  price?: number;
  currency?: string;
}

export interface RegionalMenuData {
  signatureItems: SignatureDish[];
}

// ─── Set Menu / Thali ────────────────────────────────────────────────────────
export interface SetMenuItem {
  id: string;
  name: string;
  description: string;
  image?: string;
  position?: string; // e.g. "top-left", "center" — for visual layout
}

export interface SetMenu {
  title: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  items: SetMenuItem[];
}

// ─── Events / Private Dining ─────────────────────────────────────────────────
export interface PrivateEvent {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface EventInquiryPayload {
  name: string;
  phone: string;
  eventType: string;
  guests: number;
  message?: string;
}

export type EventInquiryHandler = (payload: EventInquiryPayload) => void | Promise<void>;

// ─── Chef ────────────────────────────────────────────────────────────────────
export interface ChefProfile {
  name: string;
  title: string;
  quote: string;
  videoUrl: string;
  videoPoster?: string;
  credentials: string[];
  image: string;
}

// ─── Award ───────────────────────────────────────────────────────────────────
export interface Award {
  id: string;
  label: string;
  icon?: string; // emoji or icon class
}

// ─── Restaurant Data ─────────────────────────────────────────────────────────
export interface RegionalRestaurantData {
  name: string;
  tagline: string;
  nativeText: string;
  heroImage: string;
  awards: Award[];
  heritage: HeritageBlock[];
  setMenu: SetMenu;
  events: PrivateEvent[];
  chef: ChefProfile;
  whatsappNumber: string;
  whatsappMessage?: string;
}

// ─── Component Props ─────────────────────────────────────────────────────────
export interface RegionalTemplateProps {
  restaurantData: RegionalRestaurantData;
  menuData: RegionalMenuData;
  config: RegionalTemplateConfig;
  onReserve?: (payload?: Record<string, unknown>) => void;
  onEventInquiry?: EventInquiryHandler;
}

export interface RegionalSectionProps {
  restaurantData: RegionalRestaurantData;
  menuData: RegionalMenuData;
  theme: RegionalTheme;
  onReserve?: (payload?: Record<string, unknown>) => void;
  onEventInquiry?: EventInquiryHandler;
}
