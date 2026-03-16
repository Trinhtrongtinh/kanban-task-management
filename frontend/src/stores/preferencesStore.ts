import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppTheme = 'system' | 'light' | 'dark';
export type AppLanguage = 'vi' | 'en';
export type AppDensity = 'compact' | 'comfortable' | 'spacious';

interface PreferencesState {
  theme: AppTheme;
  language: AppLanguage;
  density: AppDensity;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (language: AppLanguage) => void;
  setDensity: (density: AppDensity) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'vi',
      density: 'comfortable',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setDensity: (density) => set({ density }),
    }),
    {
      name: 'app-preferences',
    },
  ),
);
