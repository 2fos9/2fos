import { create } from "zustand";
import { type Source } from "../../types/domain";
import {
  fetchAllSources,
  createSource,
  updateSource,
  deleteSource,
  type SourceFormInput,
} from "./sourceService";

export type SourceKindFilter = "all" | Source["kind"];

interface LibraryState {
  sources: Source[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedKind: SourceKindFilter;
  activeSourceForModal: Source | null;
  isModalOpen: boolean;
  selectedSourceForView: Source | null;

  loadSources: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedKind: (kind: SourceKindFilter) => void;
  openCreateModal: () => void;
  openEditModal: (source: Source) => void;
  closeModal: () => void;
  setSelectedSourceForView: (source: Source | null) => void;
  saveSource: (input: SourceFormInput) => Promise<void>;
  removeSource: (id: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  sources: [],
  isLoading: false,
  error: null,
  searchQuery: "",
  selectedKind: "all",
  activeSourceForModal: null,
  isModalOpen: false,
  selectedSourceForView: null,

  loadSources: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchAllSources();
      set({ sources: data, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "تعذر تحميل المصادر";
      set({ error: message, isLoading: false });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setSelectedKind: (kind: SourceKindFilter) => {
    set({ selectedKind: kind });
  },

  openCreateModal: () => {
    set({ activeSourceForModal: null, isModalOpen: true });
  },

  openEditModal: (source: Source) => {
    set({ activeSourceForModal: source, isModalOpen: true });
  },

  closeModal: () => {
    set({ activeSourceForModal: null, isModalOpen: false });
  },

  setSelectedSourceForView: (source: Source | null) => {
    set({ selectedSourceForView: source });
  },

  saveSource: async (input: SourceFormInput) => {
    set({ isLoading: true, error: null });
    try {
      const active = get().activeSourceForModal;
      if (active) {
        await updateSource(active.id, input);
      } else {
        await createSource(input);
      }
      await get().loadSources();
      set({ isModalOpen: false, activeSourceForModal: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "فشلت عملية حفظ المصدر";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  removeSource: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteSource(id);
      if (get().selectedSourceForView?.id === id) {
        set({ selectedSourceForView: null });
      }
      await get().loadSources();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "فشل حذف المصدر";
      set({ error: message, isLoading: false });
      throw err;
    }
  },
}));