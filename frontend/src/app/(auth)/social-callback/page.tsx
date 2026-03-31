'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function SocialCallbackPage() {
  const router = useRouter();
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    const run = async () => {
      await initAuth();
      const state = useAuthStore.getState();

      if (state.isAuthenticated) {
        router.replace('/dashboard');
        return;
      }

      router.replace('/login?error=social_auth_failed');
    };

    run();
  }, [initAuth, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Đang hoàn tất đăng nhập...</span>
      </div>
    </div>
  );
}
