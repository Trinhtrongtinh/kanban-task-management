import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function WorkspaceSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt Workspace</h1>
        <p className="text-muted-foreground">
          Quản lý cài đặt workspace của bạn
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin chung</CardTitle>
          <CardDescription>
            Cập nhật thông tin workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên Workspace</Label>
            <Input id="name" placeholder="Nhập tên workspace" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" placeholder="workspace-slug" />
          </div>
          <Button>Lưu thay đổi</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Vùng nguy hiểm</CardTitle>
          <CardDescription>
            Các hành động không thể hoàn tác
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Xóa Workspace</Button>
        </CardContent>
      </Card>
    </div>
  );
}
