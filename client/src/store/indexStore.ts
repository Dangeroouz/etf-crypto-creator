import { create } from "zustand";
import axios from "axios";
import { API_URL } from "../config";




interface Index {
  id: string;
  userId: string;
  name: string;
  selected: string[];
  weights: number[];
  initialInvestment: number;
  createdAt: string;
  updatedAt?: string;
}

interface IndexStore {
  indices: Index[];
  isLoading: boolean;
  error: string | null;
  fetchIndices: (token: string) => Promise<void>;
  createIndex: (token: string, indexData: Omit<Index, "id" | "userId" | "createdAt">) => Promise<Index>;
  updateIndex: (token: string, indexId: string, indexData: Partial<Index>) => Promise<Index>;
  deleteIndex: (token: string, indexId: string) => Promise<void>;
  getIndexById: (indexId: string) => Index | undefined;
  clearError: () => void;
}

export const useIndexStore = create<IndexStore>((set, get) => ({
  indices: [],
  isLoading: false,
  error: null,

  fetchIndices: async (token: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axios.get(`${API_URL}/api/indices`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      set({ indices: response.data, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to fetch indices";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  createIndex: async (token: string, indexData: Omit<Index, "id" | "userId" | "createdAt">) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axios.post(`${API_URL}/api/indices`, indexData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const newIndex = response.data.index;
      set((state) => ({
        indices: [...state.indices, newIndex],
        isLoading: false,
      }));
      return newIndex;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to create index";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateIndex: async (token: string, indexId: string, indexData: Partial<Index>) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axios.put(`${API_URL}/api/indices/${indexId}`, indexData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedIndex = response.data.index;
      set((state) => ({
        indices: state.indices.map((idx) => (idx.id === indexId ? updatedIndex : idx)),
        isLoading: false,
      }));
      return updatedIndex;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to update index";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteIndex: async (token: string, indexId: string) => {
    try {
      set({ isLoading: true, error: null });
      await axios.delete(`${API_URL}/api/indices/${indexId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      set((state) => ({
        indices: state.indices.filter((idx) => idx.id !== indexId),
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to delete index";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  getIndexById: (indexId: string) => {
    return get().indices.find((idx) => idx.id === indexId);
  },

  clearError: () => set({ error: null }),
}));
