'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function GlobalSettingsPage() {
  return (
    <div className="mx-auto mt-8 max-w-4xl space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt Toàn cục</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý tài khoản cá nhân, mật khẩu và ưu tiên hiển thị.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Hồ sơ cá nhân</CardTitle>
            <CardDescription>
              Cập nhật tên và ảnh đại diện của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src="https://i.pravatar.cc/150?u=current_user" />
                <AvatarFallback>UN</AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm" className="mb-2">Thay đổi Avatar</Button>
                <p className="text-sm text-muted-foreground">JPG, GIF hoặc PNG tối đa 2MB.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullname">Họ và Tên</Label>
              <Input id="fullname" defaultValue="Người Dùng Hiện Tại" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="user@example.com" disabled />
              <p className="text-xs text-muted-foreground">Email không thể thay đổi lúc này.</p>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 border-t py-4">
            <Button>Lưu thay đổi</Button>
          </CardFooter>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Bảo mật & Mật khẩu</CardTitle>
            <CardDescription>
              Đảm bảo tài khoản của bạn được an toàn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-pw">Mật khẩu hiện tại</Label>
              <Input id="current-pw" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">Mật khẩu mới</Label>
              <Input id="new-pw" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pw">Xác nhận mật khẩu</Label>
              <Input id="confirm-pw" type="password" />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 border-t py-4">
            <Button>Cập nhật Mật khẩu</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
