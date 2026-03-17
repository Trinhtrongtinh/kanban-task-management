'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceModal } from '@/hooks/ui/use-workspace-modal';
import { useCreateWorkspace } from '@/hooks/data/use-workspaces';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { WorkspaceType } from '@/api/workspaces';

export function WorkspaceModal() {
    const router = useRouter();
    const workspaceModal = useWorkspaceModal();
    const createWorkspace = useCreateWorkspace();

    const [name, setName] = useState('');
    const [type, setType] = useState<WorkspaceType>('Personal');

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createWorkspace.mutate(
            { name, type },
            {
                onSuccess: (newWorkspace) => {
                    workspaceModal.onClose();
                    setName('');
                    // Redirect to the new workspace
                    router.push(`/workspaces/${newWorkspace.id}`);
                },
                onError: (error: any) => {
                    alert('Không thể tạo Workspace: ' + (error.response?.data?.message || error.message));
                }
            }
        );
    };

    const handleClose = () => {
        if (!createWorkspace.isPending) {
            workspaceModal.onClose();
        }
    };

    return (
        <Dialog open={workspaceModal.isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tạo workspace mới</DialogTitle>
                    <DialogDescription>
                        Workspace là nơi quản lý mọi dự án và thành viên của bạn. Lưu ý: Mỗi người dùng chỉ được phép sở hữu tối đa 1 Workspace cá nhân.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="workspace-name">Tên workspace</Label>
                        <Input
                            id="workspace-name"
                            placeholder="VD: Dự án của tôi"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={createWorkspace.isPending}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="workspace-type">Loại workspace</Label>
                        <Select
                            value={type}
                            onValueChange={(val) => setType(val as WorkspaceType)}
                            disabled={createWorkspace.isPending}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn loại workspace" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Personal">Cá nhân</SelectItem>
                                <SelectItem value="Business">Doanh nghiệp</SelectItem>
                                <SelectItem value="Education">Giáo dục</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={createWorkspace.isPending}
                        >
                            Huỷ
                        </Button>
                        <Button
                            type="submit"
                            disabled={createWorkspace.isPending || !name.trim()}
                        >
                            {createWorkspace.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang tạo...
                                </>
                            ) : (
                                'Tạo workspace'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
