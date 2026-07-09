import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, setTokenGetter } from '../api.js';

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  role: string;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: AuthTokens, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,

      login: (tokens, user) =>
        set({
          tokens,
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      setTokens: (tokens) => set({ tokens }),

      clearUser: () =>
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Wire the token getter so api.ts can automatically inject tokens
setTokenGetter(() => {
  const state = useAuthStore.getState();
  return state.tokens?.accessToken;
});

export const authAPI = {
  async login(email: string, password: string) {
    const result = await api.auth.login({ email, password });
    return result.data;
  },

  async register(email: string, password: string, name: string, phone?: string) {
    const result = await api.auth.register({ email, password, name, phone });
    return result.data;
  },

  async logout(_accessToken: string) {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  async getCurrentUser(_accessToken: string) {
    const result = await api.auth.me();
    return result.data;
  },

  async refreshToken(refreshToken: string) {
    const result = await api.auth.refresh(refreshToken);
    return result.data;
  },
};
