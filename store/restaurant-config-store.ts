import { create } from "zustand";

export type RestaurantTheme = {
  primary?: string;
  accent?: string;
  background?: string;
  text?: string;
  font?: string;
};

export type RestaurantPublicConfig = {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  customDomain?: string;
  logoUrl?: string;
  theme?: RestaurantTheme;
  timezone?: string;
  currency?: string;
  status?: "active" | "suspended";
};

type State = {
  restaurant: RestaurantPublicConfig | null;
  setRestaurant: (r: RestaurantPublicConfig) => void;
};

export const useRestaurantConfigStore = create<State>((set) => ({
  restaurant: null,
  setRestaurant: (restaurant) => set({ restaurant })
}));

