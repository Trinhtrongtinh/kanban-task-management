import { useMemo } from 'react';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { messages, type Locale, type MessageSchema } from '@/i18n/messages';

function getByPath(obj: Record<string, any>, path: string): string | undefined {
  return path.split('.').reduce<any>((acc, part) => (acc ? acc[part] : undefined), obj);
}

export function useI18n() {
  const language = usePreferencesStore((s) => s.language);
  const locale: Locale = language === 'en' ? 'en' : 'vi';

  const dictionary = useMemo(() => messages[locale], [locale]);

  const t = (key: string): string => {
    const exact = getByPath(dictionary as Record<string, any>, key);
    if (typeof exact === 'string') return exact;

    const fallback = getByPath(messages.vi as unknown as Record<string, any>, key);
    if (typeof fallback === 'string') return fallback;

    return key;
  };

  return { t, locale, dictionary: dictionary as MessageSchema };
}
