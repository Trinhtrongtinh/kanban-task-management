'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { workspacesApi } from '@/api/workspaces';
import { useQueryClient } from '@tanstack/react-query';
import { workspaceKeys } from '@/hooks/data/use-workspaces';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AcceptInvitePage({
    params,
}: {
    params: Promise<{ workspaceId: string }>;
}) {
    const { workspaceId } = use(params);
    const searchParams = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const router = useRouter();
    const queryClient = useQueryClient();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMsg('Link mời không hợp lệ (thiếu token).');
            return;
        }

        workspacesApi
            .acceptInvite(workspaceId, token)
            .then(() => {
                // Invalidate workspace list + members so sidebar refreshes
                queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
                queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
                setStatus('success');
                // Redirect after short delay
                setTimeout(() => {
                    router.push(`/workspaces/${workspaceId}`);
                }, 2000);
            })
            .catch((err: any) => {
                setStatus('error');
                setErrorMsg(
                    err?.response?.data?.message || 'Không thể chấp nhận lời mời. Link có thể đã hết hạn.'
                );
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspaceId, token]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
            <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg text-center space-y-5">
                {status === 'loading' && (
                    <>
                        <Loader2 className="mx-auto h-14 w-14 animate-spin text-primary" />
                        <h1 className="text-xl font-semibold">Đang xác nhận lời mời…</h1>
                        <p className="text-muted-foreground text-sm">Vui lòng chờ trong giây lát.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
                        <h1 className="text-xl font-semibold">Tham gia thành công!</h1>
                        <p className="text-muted-foreground text-sm">
                            Bạn đã gia nhập workspace. Đang chuyển hướng…
                        </p>
                        <Button asChild className="w-full">
                            <Link href={`/workspaces/${workspaceId}`}>Đến Workspace ngay</Link>
                        </Button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="mx-auto h-14 w-14 text-destructive" />
                        <h1 className="text-xl font-semibold">Lời mời không hợp lệ</h1>
                        <p className="text-muted-foreground text-sm">{errorMsg}</p>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/workspaces">Về trang Workspaces</Link>
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
