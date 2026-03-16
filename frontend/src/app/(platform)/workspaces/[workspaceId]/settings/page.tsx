'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Zap, Check, Upload, Link2, Users, Bell, Blocks, CreditCard, Settings, Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { useProModal } from '@/hooks/use-pro-modal';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useWorkspace, useUpdateWorkspace, useWorkspaceMembers, useInviteMember, useRemoveWorkspaceMember, useDeleteWorkspace } from '@/hooks/use-workspaces';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { resolveAvatarUrl } from '@/lib/utils';
import { paymentsApi } from '@/api/payments';
import { useI18n } from '@/hooks/use-i18n';
export default function WorkspaceSettingsPage({
  params
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const isEn = locale === 'en';
  const { workspaceId } = use(params);
  const { user } = useAuthStore();

  const { data: workspace, isLoading: isLoadingWs } = useWorkspace(workspaceId);
  const { data: members = [], isLoading: isLoadingMembers } = useWorkspaceMembers(workspaceId);

  // Redirect if not owner
  useEffect(() => {
    if (!isLoadingWs && workspace && user && workspace.ownerId !== user.id) {
      toast.error("Bạn không có quyền truy cập vào cài đặt của Workspace này.");
      router.push(`/workspaces/${workspaceId}`);
    }
  }, [workspace, user, isLoadingWs, router, workspaceId]);

  const updateMutation = useUpdateWorkspace();
  const deleteWorkspaceMutation = useDeleteWorkspace();

  const onOpen = useProModal((state) => state.onOpen);
  const isPro = user?.planType === 'PRO';
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const { url } = await paymentsApi.createPortalSession();
      window.location.href = url;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể mở cổng quản lý thanh toán.');
    } finally {
      setIsPortalLoading(false);
    }
  };

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    if (workspace) {
      setName(workspace.name || '');
      setSlug(workspace.slug || '');
    }
  }, [workspace]);

  const inviteMutation = useInviteMember();
  const removeMemberMutation = useRemoveWorkspaceMember();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [memberPendingRemove, setMemberPendingRemove] = useState<{ userId: string; name?: string } | null>(null);
  const [isDeleteWorkspaceOpen, setIsDeleteWorkspaceOpen] = useState(false);
  const [deleteWorkspaceConfirmName, setDeleteWorkspaceConfirmName] = useState('');

  const handleUpdate = () => {
    updateMutation.mutate({
      id: workspaceId,
      payload: { name, slug }
    });
  };

  const handleInvite = () => {
    if (!inviteEmail) return;
    inviteMutation.mutate({
      id: workspaceId,
      payload: { email: inviteEmail }
    }, {
      onSuccess: () => {
        toast.success("Đã gửi lời mời thành công! Người tham gia sẽ có quyền Member.");
        setInviteEmail('');
        setIsInviteOpen(false);
      },
      onError: (err: any) => {
        const rawMessage = err?.response?.data?.message;
        const errorMessage = Array.isArray(rawMessage)
          ? rawMessage.join(', ')
          : rawMessage || err?.message || "Email không chính xác hoặc không tồn tại trong hệ thống";
        toast.error(errorMessage);
      }
    });
  };

  const handleRemoveMember = () => {
    if (!memberPendingRemove) return;

    removeMemberMutation.mutate(
      { id: workspaceId, memberId: memberPendingRemove.userId },
      {
        onSuccess: () => {
          toast.success('Đã xóa thành viên khỏi workspace');
          setMemberPendingRemove(null);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Không thể xóa thành viên');
        },
      },
    );
  };

  const handleDeleteWorkspace = () => {
    if (!workspace) return;

    if (deleteWorkspaceConfirmName.trim() !== workspace.name) {
      toast.error('Vui lòng nhập đúng tên workspace để xác nhận xóa.');
      return;
    }

    deleteWorkspaceMutation.mutate(workspaceId, {
      onSuccess: () => {
        toast.success(isEn ? 'Workspace deleted successfully.' : 'Đã xóa workspace thành công.');
        setIsDeleteWorkspaceOpen(false);
        setDeleteWorkspaceConfirmName('');
        router.push('/workspaces');
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || (isEn ? 'Unable to delete workspace' : 'Không thể xóa workspace'));
      },
    });
  };

  const roleLabelMap: Record<string, string> = {
    OWNER: 'Owner',
    MEMBER: 'Member',
    ADMIN: 'Admin',
    OBSERVER: 'Observer',
  };

  return (
    <div className="mx-auto mt-8 max-w-6xl space-y-8 pb-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('workspaceSettings.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('workspaceSettings.subtitle')}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => router.push(`/workspaces/${workspaceId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.exit')}
        </Button>
      </div>

      {isLoadingWs ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="general" orientation="vertical" className="flex flex-col md:flex-row gap-8 w-full">
          {/* Sidebar Nav (Vertical Tabs) */}
          <TabsList className="md:w-64 flex flex-row md:flex-col justify-start bg-transparent h-auto p-0 space-y-1 space-x-2 md:space-x-0 overflow-x-auto md:overflow-visible shrink-0 pb-2 md:pb-0">
            <TabsTrigger
              value="general"
              className="w-full justify-start gap-2 px-4 py-2 text-muted-foreground data-[state=active]:bg-muted/60 data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/40 hover:text-foreground rounded-md transition-colors"
            >
              <Settings className="w-4 h-4 shrink-0" /> {t('common.general')}
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="w-full justify-start gap-2 px-4 py-2 text-muted-foreground data-[state=active]:bg-muted/60 data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/40 hover:text-foreground rounded-md transition-colors"
            >
              <Users className="w-4 h-4 shrink-0" /> {t('common.members')}
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="w-full justify-start gap-2 px-4 py-2 text-muted-foreground data-[state=active]:bg-muted/60 data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/40 hover:text-foreground rounded-md transition-colors"
            >
              <Bell className="w-4 h-4 shrink-0" /> {t('common.notifications')}
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="w-full justify-start gap-2 px-4 py-2 text-muted-foreground data-[state=active]:bg-muted/60 data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/40 hover:text-foreground rounded-md transition-colors"
            >
              <Blocks className="w-4 h-4 shrink-0" /> {t('common.integrations')}
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className="w-full justify-start gap-2 px-4 py-2 text-muted-foreground data-[state=active]:bg-muted/60 data-[state=active]:text-foreground data-[state=active]:shadow-none hover:bg-muted/40 hover:text-foreground rounded-md transition-colors"
            >
              <CreditCard className="w-4 h-4 shrink-0" /> {t('common.billing')}
            </TabsTrigger>
          </TabsList>

          {/* Content Area */}
          <div className="flex-1 w-full max-w-3xl">

            {/* ── GENERAL TAB ── */}
            <TabsContent value="general" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>{isEn ? 'Workspace Info' : 'Thông tin Workspace'}</CardTitle>
                  <CardDescription>
                    {isEn ? 'Update your workspace details and branding.' : 'Cập nhật thông tin và nhận diện của workspace.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="h-20 w-20 rounded-md bg-muted flex border-2 border-dashed items-center justify-center text-muted-foreground cursor-pointer hover:bg-accent transition-colors shrink-0">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{isEn ? 'Workspace Logo' : 'Logo Workspace'}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{isEn ? 'Recommended size: 256x256px (PNG, JPG).' : 'Kích thước đề xuất: 256x256px (PNG, JPG).'}</p>
                      <Button variant="outline" size="sm">{isEn ? 'Upload new image' : 'Tải ảnh mới'}</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">{isEn ? 'Workspace Name' : 'Tên Workspace'}</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isEn ? 'Enter workspace name' : 'Nhập tên workspace'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">{isEn ? 'Workspace URL (Slug)' : 'Đường dẫn Workspace (Slug)'}</Label>
                    <div className="flex items-center">
                      <span className="bg-muted px-3 py-2 text-sm text-muted-foreground border border-r-0 rounded-l-md truncate">kanban.com/</span>
                      <Input
                        id="slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder={isEn ? 'workspace-slug' : 'duong-dan-workspace'}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 border-t py-4">
                  <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {isEn ? 'Save Changes' : 'Lưu thay đổi'}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-destructive/40 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-destructive">{isEn ? 'Delete Workspace' : 'Xóa Workspace'}</CardTitle>
                  <CardDescription>
                    {isEn
                      ? 'This action cannot be undone. All boards, lists, cards, and related data will be permanently removed.'
                      : 'Hành động này không thể hoàn tác. Toàn bộ bảng, danh sách, thẻ và dữ liệu liên quan sẽ bị xóa vĩnh viễn.'}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="bg-destructive/5 border-t py-4">
                  <Dialog
                    open={isDeleteWorkspaceOpen}
                    onOpenChange={(open) => {
                      setIsDeleteWorkspaceOpen(open);
                      if (!open) setDeleteWorkspaceConfirmName('');
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        {isEn ? 'Delete workspace' : 'Xóa workspace'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{isEn ? 'Confirm workspace deletion' : 'Xác nhận xóa workspace'}</DialogTitle>
                        <DialogDescription>
                          {isEn
                            ? <>Type the exact workspace name <span className="font-semibold text-foreground">{workspace?.name}</span> to confirm.</>
                            : <>Nhập chính xác tên workspace <span className="font-semibold text-foreground">{workspace?.name}</span> để xác nhận.</>}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2 py-2">
                        <Label htmlFor="delete-workspace-name">{isEn ? 'Workspace name' : 'Tên workspace'}</Label>
                        <Input
                          id="delete-workspace-name"
                          value={deleteWorkspaceConfirmName}
                          onChange={(e) => setDeleteWorkspaceConfirmName(e.target.value)}
                          placeholder={workspace?.name || (isEn ? 'Type workspace name' : 'Nhập tên workspace')}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDeleteWorkspaceOpen(false)}
                          disabled={deleteWorkspaceMutation.isPending}
                        >
                          {isEn ? 'Cancel' : 'Hủy'}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteWorkspace}
                          disabled={deleteWorkspaceMutation.isPending}
                        >
                          {deleteWorkspaceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          {isEn ? 'Delete permanently' : 'Xóa vĩnh viễn'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* ── MEMBERS TAB ── */}
            <TabsContent value="members" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 pb-6">
                  <div className="space-y-1">
                    <CardTitle>{isEn ? 'Members' : 'Thành viên'}</CardTitle>
                    <CardDescription>
                      {isEn ? 'Manage who has access to this workspace.' : 'Quản lý quyền truy cập vào workspace này.'}
                    </CardDescription>
                  </div>

                  <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 w-full sm:w-auto">
                        <Users className="w-4 h-4" />
                        Thêm thành viên
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Mời thành viên</DialogTitle>
                        <DialogDescription>
                          Họ sẽ nhận được email chứa đường dẫn để tham gia Workspace này.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="user@example.com"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Người tham gia mới sẽ luôn được gán quyền <span className="font-medium text-foreground">Member</span>.
                        </p>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleInvite}
                          disabled={inviteMutation.isPending || !inviteEmail}
                        >
                          {inviteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Gửi lời mời
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                </CardHeader>
                <CardContent>
                  {isLoadingMembers ? (
                    <div className="flex p-8 items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="rounded-md border bg-card">
                      {members.map((member, i) => (
                        <div key={member.id} className={`flex items-center justify-between p-4 ${i !== members.length - 1 ? 'border-b' : ''}`}>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={resolveAvatarUrl(member.user?.avatarUrl)} />
                              <AvatarFallback>{member.user?.username?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <p className="text-sm font-medium leading-none mb-1">{member.user?.username}</p>
                              <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'}>
                              {roleLabelMap[member.role] || member.role}
                            </Badge>
                            {member.role !== 'OWNER' && member.userId !== workspace?.ownerId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  setMemberPendingRemove({ userId: member.userId, name: member.user?.username })
                                }
                                disabled={removeMemberMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Dialog open={!!memberPendingRemove} onOpenChange={(open) => !open && setMemberPendingRemove(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Xác nhận xóa thành viên</DialogTitle>
                    <DialogDescription>
                      {`Bạn có chắc muốn xóa ${memberPendingRemove?.name || 'thành viên này'} khỏi workspace?`}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setMemberPendingRemove(null)}>
                      Hủy
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRemoveMember}
                      disabled={removeMemberMutation.isPending}
                    >
                      {removeMemberMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Xóa thành viên
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* ── NOTIFICATIONS TAB ── */}
            <TabsContent value="notifications" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>{isEn ? 'Notifications' : 'Thông báo'}</CardTitle>
                  <CardDescription>
                    {isEn ? 'Configure how you receive alerts and summaries.' : 'Cấu hình cách bạn nhận cảnh báo và bản tóm tắt.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">{isEn ? 'Email Preferences' : 'Tùy chọn Email'}</h4>

                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 shadow-sm bg-card">
                      <div className="flex flex-col space-y-1">
                        <Label htmlFor="due-date" className="font-medium">{isEn ? 'Due Date Reminders' : 'Nhắc hạn thẻ'}</Label>
                        <span className="text-sm text-muted-foreground">{isEn ? 'Email me when a card is due soon (24h).' : 'Gửi email khi thẻ sắp đến hạn (24h).'}</span>
                      </div>
                      <Switch id="due-date" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 shadow-sm bg-card">
                      <div className="flex flex-col space-y-1">
                        <Label htmlFor="mentions" className="font-medium">{isEn ? 'Mentions' : 'Đề cập'}</Label>
                        <span className="text-sm text-muted-foreground">{isEn ? 'Email me when someone mentions me in a comment.' : 'Gửi email khi có người @nhắc đến tôi trong bình luận.'}</span>
                      </div>
                      <Switch id="mentions" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 shadow-sm bg-card">
                      <div className="flex flex-col space-y-1">
                        <Label htmlFor="digest" className="font-medium">{isEn ? 'Weekly Digest' : 'Tổng hợp tuần'}</Label>
                        <span className="text-sm text-muted-foreground">{isEn ? 'Receive a weekly summary of workspace activity.' : 'Nhận tổng hợp hoạt động workspace theo tuần.'}</span>
                      </div>
                      <Switch id="digest" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── INTEGRATIONS TAB ── */}
            <TabsContent value="integrations" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>{isEn ? 'Integrations' : 'Tích hợp'}</CardTitle>
                  <CardDescription>
                    {isEn ? 'Connect your workspace with third-party tools via webhooks.' : 'Kết nối workspace với công cụ bên thứ ba qua webhook.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Slack/Discord Mockup */}
                  <div className="flex flex-col gap-4 rounded-lg border p-6 shadow-sm relative overflow-hidden bg-card">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <Blocks className="h-24 w-24" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-100 dark:bg-indigo-950/40 p-3 rounded-xl text-indigo-600 dark:text-indigo-300">
                        <Link2 className="h-6 w-6" />
                      </div>
                      <div className="z-10">
                        <h4 className="text-lg font-semibold">{isEn ? 'Custom Webhooks' : 'Webhook tùy chỉnh'}</h4>
                        <p className="text-sm text-muted-foreground">{isEn ? 'Send card updates directly to Discord or Slack channels.' : 'Gửi cập nhật thẻ trực tiếp đến Discord hoặc Slack.'}</p>
                      </div>
                    </div>

                    <div className="pt-2 space-y-3 z-10 w-full max-w-md">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endpoint URL</Label>
                        <Input placeholder="https://discord.com/api/webhooks/..." className="bg-background" />
                      </div>
                      <Button variant="secondary" className="w-fit">{isEn ? 'Add Webhook' : 'Thêm Webhook'}</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── BILLING TAB ── */}
            <TabsContent value="billing" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Thanh toán & Gói đăng ký</CardTitle>
                  <CardDescription>
                    Quản lý thông tin thanh toán và nâng cấp gói của bạn.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Current Plan Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border bg-card p-6 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold leading-none">{isPro ? 'Kanban Pro' : 'Free Plan'}</p>
                        {isPro && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            <Zap className="h-3 w-3" /> PRO
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground pt-1">
                        {isPro
                          ? `Gói Pro đang hoạt động${user?.expiredAt ? ` — hết hạn ${new Date(user.expiredAt).toLocaleDateString('vi-VN')}` : ''}`
                          : 'Quản lý dự án cơ bản cho cá nhân và nhóm nhỏ.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isPro ? 'default' : 'secondary'}
                        className="font-semibold uppercase tracking-wider h-7 px-3"
                      >
                        {isPro ? 'Pro' : 'Free'}
                      </Badge>
                      {isPro && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleManageSubscription}
                          disabled={isPortalLoading}
                        >
                          {isPortalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                          {isEn ? 'Manage plan' : 'Quản lý gói'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {!isPro && (
                    <div className="pt-2">
                      {/* Upgrade Pitch Card */}
                      <div className="relative rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-amber-900/10 p-6 sm:p-8 shadow-sm overflow-hidden">
                        <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-5 pointer-events-none">
                          <Zap className="h-64 w-64 text-amber-500 fill-amber-500" />
                        </div>

                        <div className="relative z-10">
                          <div className="mb-6 flex items-center justify-between">
                            <div>
                              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-200 mb-3">
                                <Zap className="h-3.5 w-3.5" /> PRO
                              </div>
                              <h3 className="text-2xl font-bold text-amber-950 dark:text-amber-100">Mở khóa toàn bộ tiềm năng</h3>
                              <p className="text-amber-800/80 dark:text-amber-200/80 mt-1">Nâng cấp lên Pro để sử dụng đầy đủ các tính năng.</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <ul className="space-y-4 text-sm text-amber-900/90 dark:text-amber-100/90">
                              <li className="flex items-center gap-x-3">
                                <div className="bg-amber-100 dark:bg-amber-900/40 rounded-full p-1"><Check className="h-3 w-3 text-amber-600 dark:text-amber-300" /></div>
                                <span className="font-medium">Không giới hạn</span> bảng & danh sách
                              </li>
                              <li className="flex items-center gap-x-3">
                                <div className="bg-amber-100 dark:bg-amber-900/40 rounded-full p-1"><Check className="h-3 w-3 text-amber-600 dark:text-amber-300" /></div>
                                Thành viên <span className="font-medium">không giới hạn</span>
                              </li>
                            </ul>
                            <ul className="space-y-4 text-sm text-amber-900/90 dark:text-amber-100/90">
                              <li className="flex items-center gap-x-3">
                                <div className="bg-amber-100 dark:bg-amber-900/40 rounded-full p-1"><Check className="h-3 w-3 text-amber-600 dark:text-amber-300" /></div>
                                Tệp đính kèm tới <span className="font-medium">250MB</span>
                              </li>
                              <li className="flex items-center gap-x-3">
                                <div className="bg-amber-100 dark:bg-amber-900/40 rounded-full p-1"><Check className="h-3 w-3 text-amber-600 dark:text-amber-300" /></div>
                                <span className="font-medium">Hỗ trợ ưu tiên</span> 24/7
                              </li>
                            </ul>
                          </div>

                          <Button
                            onClick={onOpen}
                            size="lg"
                            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-semibold text-white shadow-md focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 border-0"
                          >
                            {isEn ? 'Upgrade $9/month' : 'Nâng cấp $9/tháng'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </div>
        </Tabs>
      )}
    </div>
  );
}
