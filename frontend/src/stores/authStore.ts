import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setAccessToken: (accessToken) => {
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        } else {
          localStorage.removeItem('accessToken');
        }
        set({ accessToken });
      },
      
      login: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        set({ user, accessToken, isAuthenticated: true, isLoading: false });
      },
      
      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
      
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
