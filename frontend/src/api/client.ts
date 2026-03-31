import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const target = `${name}=`;
  const segments = document.cookie.split(';');
  for (const segment of segments) {
    const cookie = segment.trim();
    if (cookie.startsWith(target)) {
      return decodeURIComponent(cookie.substring(target.length));
    }
  }

  return null;
}

function shouldAttachCsrfHeader(method?: string): boolean {
  if (!method) return false;
  const normalized = method.toUpperCase();
  return !['GET', 'HEAD', 'OPTIONS'].includes(normalized);
}

let refreshPromise: Promise<void> | null = null;

function shouldSkipRefresh(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/verify-reset-token') ||
    url.includes('/auth/reset-password')
  );
}

async function refreshSessionIfNeeded(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = apiClient.post('/auth/refresh').then(() => undefined).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  if (shouldAttachCsrfHeader(config.method)) {
    const csrfToken = getCookieValue('csrf_token');
    if (csrfToken) {
      config.headers.set('x-csrf-token', csrfToken);
    }
  }

  return config;
});

// ── Response interceptor — auto logout khi 401, toast khi 429 ─────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config as (typeof error.config & {
      _retry?: boolean;
    });

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest.url)
    ) {
      originalRequest._retry = true;
      try {
        await refreshSessionIfNeeded();
        return apiClient(originalRequest);
      } catch {
        // Fall through to logout + redirect
      }
    }

    if (status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    } else if (status === 429) {
      const retryAfter: number | undefined = error.response.data?.retryAfter;
      const description = retryAfter && retryAfter > 0
        ? `Vui lòng thử lại sau ${retryAfter} giây.`
        : 'Vui lòng thử lại sau.';
      toast.error('Quá nhiều yêu cầu', {
        description,
        duration: Math.min((retryAfter ?? 5) * 1000, 10_000),
      });
    }

    return Promise.reject(error);
  }
);
