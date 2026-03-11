'use client';

import { useState } from 'react';
import { useProModal } from '@/hooks/use-pro-modal';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2, Zap } from 'lucide-react';
import { paymentsApi } from '@/api/payments';
import { toast } from 'sonner';

export function ProModal() {
  const { isOpen, onClose } = useProModal();
  const [isLoading, setIsLoading] = useState(false);

  const onUpgrade = async () => {
    setIsLoading(true);
    try {
      const { url } = await paymentsApi.createCheckoutSession();
      window.location.href = url;
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Không thể khởi tạo thanh toán. Vui lòng thử lại.';
      toast.error(msg);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <div className="bg-white rounded-xl overflow-hidden text-center p-6 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800 mb-2">
              <Zap className="h-4 w-4" /> Nâng cấp tài khoản
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Nâng cấp lên Kanban Pro</h2>
            <p className="text-muted-foreground">Mở khóa các tính năng mạnh mẽ để quản lý dự án hiệu quả hơn.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Free Plan */}
            <Card className="border-border/50 shadow-sm flex flex-col justify-between">
              <div>
                <CardHeader>
                  <CardTitle className="text-xl">Free</CardTitle>
                  <CardDescription>Cho cá nhân mới bắt đầu</CardDescription>
                  <div className="mt-4 font-bold text-4xl">$0<span className="text-lg font-normal text-muted-foreground">/tháng</span></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-primary" /> Tối đa 3 bảng mỗi workspace</li>
                    <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-primary" /> Danh sách & thẻ cơ bản</li>
                    <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-primary" /> Tối đa 5 thành viên/workspace</li>
                    <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-primary" /> Tệp đính kèm tối đa 5MB</li>
                  </ul>
                </CardContent>
              </div>
              <CardFooter>
                <Button className="w-full" variant="outline" disabled>Gói hiện tại</Button>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="border-primary shadow-lg ring-2 ring-primary/20 flex flex-col justify-between relative">
              <div className="absolute top-0 right-6 translate-y-[-50%] bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                ĐỀ XUẤT
              </div>
              <div>
                <CardHeader>
                  <CardTitle className="text-xl">Pro</CardTitle>
                  <CardDescription>Dành cho người dùng chuyên nghiệp & nhóm</CardDescription>
                  <div className="mt-4 font-bold text-4xl">$9<span className="text-lg font-normal text-muted-foreground">/tháng</span></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-primary" /> <strong>Không giới hạn</strong> bảng</li>
                    <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-primary" /> Thành viên không giới hạn</li>
                    <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-primary" /> Tệp đính kèm tới 250MB</li>
                    <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-primary" /> Tính năng bảo mật & quản trị</li>
                    <li className="flex items-center gap-x-2"><Check className="h-4 w-4 text-primary" /> Hỗ trợ ưu tiên 24/7</li>
                  </ul>
                </CardContent>
              </div>
              <CardFooter>
                <Button className="w-full" onClick={onUpgrade} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                  {isLoading ? 'Đang chuyển hướng…' : 'Nâng cấp $9/tháng'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}