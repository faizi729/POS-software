import { create } from "zustand";

type UiState = {
  routeLoading: boolean;
  startRouteLoading: () => void;
  stopRouteLoading: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  routeLoading: false,
  startRouteLoading: () => set({ routeLoading: true }),
  stopRouteLoading: () => set({ routeLoading: false })
}));

