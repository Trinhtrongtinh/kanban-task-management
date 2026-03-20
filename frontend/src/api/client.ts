import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// ── Request interceptor — gắn Bearer token ────────────────────────────
apiClient.interceptors.request.use((config) => {
  // Đọc trực tiếp từ Zustand state (không cần hook)
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — auto logout khi 401, toast khi 429 ─────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      // Redirect về login nếu đang ở platform
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 429) {
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
