'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  // Refresh user info so planType becomes 'PRO' in the store
  useEffect(() => {
    authApi.getMe().then((user) => setUser(user)).catch(() => null);
  }, [setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle2 className="h-20 w-20 text-green-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Thanh toán thành công!</h1>
          <p className="text-gray-500">
            Chào mừng bạn đến với <strong>Kanban Pro</strong>. Tất cả tính năng Pro đã được mở khóa cho tài khoản của bạn.
          </p>
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={() => router.push('/dashboard')}
        >
          Quay lại Dashboard
        </Button>
      </div>
    </div>
  );
}
