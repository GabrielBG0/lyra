import { create } from "zustand";
import { tauriApi } from "../lib/tauri";
import { tourSteps } from "../lib/tourSteps";

interface TourStore {
  active: boolean;
  currentStep: number;
  start: () => void;
  next: () => void;
  back: () => void;
  dismiss: () => void;
}

export const useTourStore = create<TourStore>((set, get) => ({
  active: false,
  currentStep: 0,
  start: () => set({ active: true, currentStep: 0 }),
  next: () => {
    const { currentStep, dismiss } = get();
    if (currentStep >= tourSteps.length - 1) {
      dismiss();
    } else {
      set({ currentStep: currentStep + 1 });
    }
  },
  back: () => {
    const { currentStep } = get();
    if (currentStep > 0) set({ currentStep: currentStep - 1 });
  },
  dismiss: () => {
    set({ active: false });
    tauriApi.config
      .get()
      .then((cfg) => tauriApi.config.set({ ...cfg, tutorial_completed: true }))
      .catch(console.error);
  },
}));
