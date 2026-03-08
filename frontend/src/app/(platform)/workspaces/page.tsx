import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function WorkspacesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground">
            Quản lý các workspace của bạn
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tạo Workspace
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Chưa có workspace</CardTitle>
            <CardDescription>
              Tạo workspace đầu tiên để bắt đầu quản lý công việc
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Tạo Workspace mới
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
