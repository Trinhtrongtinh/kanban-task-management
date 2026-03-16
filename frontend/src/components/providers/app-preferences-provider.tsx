'use client';

import { useEffect } from 'react';
import { usePreferencesStore } from '@/stores/preferencesStore';

const DENSITY_CLASSES = ['density-compact', 'density-comfortable', 'density-spacious'];

export function AppPreferencesProvider() {
  const theme = usePreferencesStore((s) => s.theme);
  const language = usePreferencesStore((s) => s.language);
  const density = usePreferencesStore((s) => s.density);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      root.classList.toggle('dark', isDark);
    };

    applyTheme();

    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }

    return undefined;
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...DENSITY_CLASSES);
    root.classList.add(`density-${density}`);
  }, [density]);

  return null;
}
