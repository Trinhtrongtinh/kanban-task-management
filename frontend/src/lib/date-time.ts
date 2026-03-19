import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const hasTimezone = (input: string) => /([zZ]|[+-]\d{2}:\d{2})$/.test(input);

export function parseApiDate(value: string | Date): Date {
  if (value instanceof Date) return value;

  const normalized = value.includes(' ') ? value.replace(' ', 'T') : value;
  const input = hasTimezone(normalized) ? normalized : `${normalized}Z`;
  return new Date(input);
}

export function formatDateTimeVN(value: string | Date): string {
  const date = parseApiDate(value);

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).format(date);
}

export function formatDateTimeByLocale(value: string | Date, locale: 'vi' | 'en' = 'vi'): string {
  const date = parseApiDate(value);

  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).format(date);
}

export function formatRelativeVN(value: string | Date): string {
  return formatDistanceToNow(parseApiDate(value), {
    addSuffix: true,
    locale: vi,
  });
}
