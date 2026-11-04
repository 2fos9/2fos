import { create } from "zustand";

type RelationsViewState = {
  search: string;
  kind: "all" | "person" | "organization" | "place" | "other";
  setSearch: (value: string) => void;
  setKind: (value: RelationsViewState["kind"]) => void;
};

export const useRelationsView = create<RelationsViewState>((set) => ({
  search: "",
  kind: "all",
  setSearch: (search) => set({ search }),
  setKind: (kind) => set({ kind }),
}));