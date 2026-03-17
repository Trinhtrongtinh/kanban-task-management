'use client';

import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/ui/use-i18n';

export default function PaymentCancelPage() {
  const router = useRouter();
  const { locale } = useI18n();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 dark:from-rose-950/40 dark:to-background">
      <div className="bg-card rounded-2xl shadow-xl p-10 max-w-md w-full text-center space-y-6 border">
        <div className="flex justify-center">
          <XCircle className="h-20 w-20 text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {locale === 'en' ? 'Payment cancelled' : 'Thanh toán bị hủy'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'en'
              ? 'No charge was made. You can upgrade anytime from the settings page.'
              : 'Không có khoản phí nào bị trừ. Bạn có thể nâng cấp bất kỳ lúc nào từ trang cài đặt.'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/dashboard')}
          >
            {locale === 'en' ? 'Back to Dashboard' : 'Quay lại Dashboard'}
          </Button>
          <Button
            className="flex-1"
            onClick={() => router.back()}
          >
            {locale === 'en' ? 'Try again' : 'Thử lại'}
          </Button>
        </div>
      </div>
    </div>
  );
}
