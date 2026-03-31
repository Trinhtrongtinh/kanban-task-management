'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';
import { paymentsApi } from '@/api/payments';
import { useI18n } from '@/hooks/ui/use-i18n';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const { setUser } = useAuthStore();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    async function verifyAndRefresh() {
      try {
        // If we have a session_id, call verify-session so the backend can
        // confirm payment with Stripe and upgrade the user immediately — this
        // handles the race condition where the webhook hasn't arrived yet.
        if (sessionId) {
          await paymentsApi.verifySession(sessionId);
        }
      } catch {
        // Non-fatal: webhook may have already processed the upgrade
      } finally {
        // Refresh user data so planType reflects PRO in the store
        try {
          const user = await authApi.getMe();
          setUser(user);
        } catch {
          // ignore
        }
        setVerifying(false);
      }
    }

    verifyAndRefresh();
  }, [searchParams, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-emerald-950/40 dark:to-background">
      <div className="bg-card rounded-2xl shadow-xl p-10 max-w-md w-full text-center space-y-6 border">
        <div className="flex justify-center">
          {verifying ? (
            <Loader2 className="h-20 w-20 text-green-500 animate-spin" />
          ) : (
            <CheckCircle2 className="h-20 w-20 text-green-500" />
          )}
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {locale === 'en' ? 'Payment successful!' : 'Thanh toán thành công!'}
          </h1>
          <p className="text-muted-foreground">
            {verifying
              ? (locale === 'en' ? 'Activating your Pro plan…' : 'Đang kích hoạt gói Pro…')
              : (locale === 'en'
                ? 'Welcome to Kanban Pro. All Pro features are now unlocked for your account.'
                : 'Chào mừng bạn đến với Kanban Pro. Tất cả tính năng Pro đã được mở khóa cho tài khoản của bạn.')}
          </p>
        </div>
        <Button
          size="lg"
          className="w-full"
          disabled={verifying}
          onClick={() => router.push('/dashboard')}
        >
          {locale === 'en' ? 'Back to Dashboard' : 'Quay lại Dashboard'}
        </Button>
      </div>
    </div>
  );
}

