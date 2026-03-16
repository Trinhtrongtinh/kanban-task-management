'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';
import { useI18n } from '@/hooks/use-i18n';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const { setUser } = useAuthStore();

  // Refresh user info so planType becomes 'PRO' in the store
  useEffect(() => {
    authApi.getMe().then((user) => setUser(user)).catch(() => null);
  }, [setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-emerald-950/40 dark:to-background">
      <div className="bg-card rounded-2xl shadow-xl p-10 max-w-md w-full text-center space-y-6 border">
        <div className="flex justify-center">
          <CheckCircle2 className="h-20 w-20 text-green-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {locale === 'en' ? 'Payment successful!' : 'Thanh toán thành công!'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'en'
              ? 'Welcome to Kanban Pro. All Pro features are now unlocked for your account.'
              : 'Chào mừng bạn đến với Kanban Pro. Tất cả tính năng Pro đã được mở khóa cho tài khoản của bạn.'}
          </p>
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={() => router.push('/dashboard')}
        >
          {locale === 'en' ? 'Back to Dashboard' : 'Quay lại Dashboard'}
        </Button>
      </div>
    </div>
  );
}
