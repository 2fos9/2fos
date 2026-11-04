import { create } from "zustand";

type TimelineStore = {
  search: string;
  investigationFilter: string;
  order: "asc" | "desc";
  setSearch: (value: string) => void;
  setInvestigationFilter: (value: string) => void;
  toggleOrder: () => void;
};

export const useTimelineStore = create<TimelineStore>((set) => ({
  search: "",
  investigationFilter: "all",
  order: "asc",
  setSearch: (search) => set({ search }),
  setInvestigationFilter: (investigationFilter) => set({ investigationFilter }),
  toggleOrder: () =>
    set((state) => ({ order: state.order === "asc" ? "desc" : "asc" })),
}));