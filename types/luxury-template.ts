/* ──────────────────────────────────────────────────────────────────────────────
   Luxury Fine Dining Template — Type Definitions
   ────────────────────────────────────────────────────────────────────────── */

// ─── Theme ───────────────────────────────────────────────────────────────────
export interface TemplateTheme {
  primary: string;
  background: string;
  text: string;
}

// ─── Section Config ──────────────────────────────────────────────────────────
export type SectionType =
  | "hero"
  | "signatureDishes"
  | "chefStory"
  | "gallery"
  | "testimonials"
  | "reservation";

export interface SectionConfig {
  type: SectionType;
  variant: string;
}

// ─── Template Config ─────────────────────────────────────────────────────────
export interface TemplateConfig {
  template: string;
  theme: TemplateTheme;
  sections: SectionConfig[];
}

// ─── Chef ────────────────────────────────────────────────────────────────────
export interface ChefData {
  name: string;
  title: string;
  image: string;
  quote: string;
  bio?: string;
}

// ─── Review ──────────────────────────────────────────────────────────────────
export interface ReviewData {
  id: string;
  author: string;
  rating: number;
  text: string;
  source: string; // e.g. "Google", "TripAdvisor"
  date?: string;
  avatar?: string;
}

// ─── Award / Badge ───────────────────────────────────────────────────────────
export interface AwardBadge {
  label: string;
  icon?: string;
}

// ─── Restaurant Data ─────────────────────────────────────────────────────────
export interface RestaurantData {
  name: string;
  tagline: string;
  heroVideo: string;
  heroPoster?: string; // poster image for video
  availability: string;
  nextAvailable: string;
  award?: AwardBadge;
  chef: ChefData;
  gallery: GalleryImage[];
  reviews: ReviewData[];
  phone?: string;
  address?: string;
}

// ─── Gallery ─────────────────────────────────────────────────────────────────
export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  span?: "tall" | "wide" | "normal"; // masonry hint
}

// ─── Menu / Featured Items ───────────────────────────────────────────────────
export interface FeaturedItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  tag?: string; // e.g. "Chef's Pick", "New"
}

export interface MenuData {
  featuredItems: FeaturedItem[];
}

// ─── Reservation ─────────────────────────────────────────────────────────────
export interface ReservationPayload {
  date: string;
  time: string;
  guests: number;
  occasion: string;
  name?: string;
  email?: string;
  phone?: string;
}

export type ReservationHandler = (payload: ReservationPayload) => void | Promise<void>;

// ─── Component Props ─────────────────────────────────────────────────────────
export interface LuxuryTemplateProps {
  restaurantData: RestaurantData;
  menuData: MenuData;
  config: TemplateConfig;
  onReserve?: ReservationHandler;
}

export interface LuxurySectionProps {
  restaurantData: RestaurantData;
  menuData: MenuData;
  theme: TemplateTheme;
  onReserve?: ReservationHandler;
}
