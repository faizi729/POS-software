/* ──────────────────────────────────────────────────────────────────────────────
   City Restaurant Template — Type Definitions
   A dark, premium, full-featured restaurant landing page.
   ────────────────────────────────────────────────────────────────────────── */

// ─── Theme ───────────────────────────────────────────────────────────────────
export interface CityRestaurantTheme {
  primary: string;
  accent: string;
  background: string;
  text: string;
}

// ─── Section Config ──────────────────────────────────────────────────────────
export type CityRestaurantSectionType =
  | "hero"
  | "stats"
  | "menu"
  | "about"
  | "gallery"
  | "testimonials"
  | "reservation"
  | "info";

export interface CityRestaurantSectionConfig {
  type: CityRestaurantSectionType;
  variant: string;
}

// ─── Template Config ─────────────────────────────────────────────────────────
export interface CityRestaurantTemplateConfig {
  template: string;
  theme: CityRestaurantTheme;
  sections: CityRestaurantSectionConfig[];
}

// ─── Restaurant Data ─────────────────────────────────────────────────────────
export interface CityRestaurantData {
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  gallery: string[];
  rating: number;
  reviews: number;
  established: string;
  location: string;
  phone: string;
  whatsapp: string;
  openingHours: {
    weekdays: string;
    weekends: string;
  };
  aboutImage: string;
  features: string[];
  stats: {
    customers: number;
    years: number;
    dishes: number;
  };
  testimonials: Testimonial[];
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  navLinks: NavLink[];
}

// ─── Menu Item ───────────────────────────────────────────────────────────────
export type MenuCategory = "starters" | "mains" | "desserts" | "drinks";

export interface CityMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  image: string;
  category: MenuCategory;
  badge?: "bestseller" | "chef";
}

export interface CityMenuData {
  items: CityMenuItem[];
}

// ─── Testimonial ─────────────────────────────────────────────────────────────
export interface Testimonial {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  text: string;
  date: string;
}

// ─── Nav Link ────────────────────────────────────────────────────────────────
export interface NavLink {
  label: string;
  href: string; // anchor like "#menu", "#about" etc.
}

// ─── Reservation ─────────────────────────────────────────────────────────────
export interface ReservationPayload {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  occasion: string;
}

export type ReservationHandler = (payload: ReservationPayload) => void | Promise<void>;

// ─── Component Props ─────────────────────────────────────────────────────────
export interface CityRestaurantTemplateProps {
  restaurantData: CityRestaurantData;
  menuData: CityMenuData;
  config: CityRestaurantTemplateConfig;
  onReserve?: ReservationHandler;
}

export interface CityRestaurantSectionProps {
  restaurantData: CityRestaurantData;
  menuData: CityMenuData;
  theme: CityRestaurantTheme;
  onReserve?: ReservationHandler;
}
