'use client';

import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <XCircle className="h-20 w-20 text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Thanh toán bị hủy</h1>
          <p className="text-gray-500">
            Không có khoản phí nào bị trừ. Bạn có thể nâng cấp bất kỳ lúc nào từ trang cài đặt.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/dashboard')}
          >
            Quay lại Dashboard
          </Button>
          <Button
            className="flex-1"
            onClick={() => router.back()}
          >
            Thử lại
          </Button>
        </div>
      </div>
    </div>
  );
}
