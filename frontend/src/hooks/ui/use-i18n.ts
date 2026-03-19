import { useMemo } from 'react';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { messages, type Locale, type MessageSchema } from '@/i18n/messages';

function getByPath(obj: Record<string, any>, path: string): string | undefined {
  return path.split('.').reduce<any>((acc, part) => (acc ? acc[part] : undefined), obj);
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

export function useI18n() {
  const language = usePreferencesStore((s) => s.language);
  const locale: Locale = language === 'en' ? 'en' : 'vi';

  const dictionary = useMemo(() => messages[locale], [locale]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const exact = getByPath(dictionary as Record<string, any>, key);
    if (typeof exact === 'string') return interpolate(exact, params);

    const fallback = getByPath(messages.vi as unknown as Record<string, any>, key);
    if (typeof fallback === 'string') return interpolate(fallback, params);

    return interpolate(key, params);
  };

  return { t, locale, dictionary: dictionary as MessageSchema };
}
