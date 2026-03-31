import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, type AuthUser } from '@/api/auth';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: AuthUser | null) => void;
  login: (user: AuthUser) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  /** Gọi khi app khởi động — xác thực session bằng auth cookie */
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: (user) => {
        set({ user, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      setLoading: (isLoading) => set({ isLoading }),

      initAuth: async () => {
        try {
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
