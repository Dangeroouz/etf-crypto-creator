import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:3333";

interface User {
  id: string;
  email: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  verifyToken: () => Promise<void>;
  clearError: () => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem("authToken") || null,
  isAuthenticated: !!localStorage.getItem("authToken"),
  isLoading: false,
  error: null,

  register: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
      });

      const { token, user } = response.data;
      localStorage.setItem("authToken", token);

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Registration failed";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;
      localStorage.setItem("authToken", token);

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Login failed";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("authToken");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  verifyToken: async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    try {
      set({ isLoading: true });
      const response = await axios.get(`${API_URL}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      set({
        user: response.data.user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem("authToken");
      set({
        isAuthenticated: false,
        token: null,
        user: null,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
