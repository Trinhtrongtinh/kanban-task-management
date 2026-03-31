'use client';

import type { AxiosError } from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Zap, Check, Users, CreditCard, Settings, Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { useProModal } from '@/hooks/ui/use-pro-modal';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useWorkspace, useUpdateWorkspace, useWorkspaceMembers, useInviteMember, useRemoveWorkspaceMember, useDeleteWorkspace } from '@/hooks/data/use-workspaces';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getProExpiryDate, isProPlanActive } from '@/lib/plan';
import { resolveAvatarUrl } from '@/lib/utils';
import { paymentsApi } from '@/api/payments';
import { useI18n } from '@/hooks/ui/use-i18n';

type ApiErrorResponse = {
  message?: string;
};

function getApiErrorMessage(error: unknown): string | undefined {
  return (error as AxiosError<ApiErrorResponse>)?.response?.data?.message;
}

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
      toast.error(t('workspaceSettings.toast.noPermission'));
      router.push(`/workspaces/${workspaceId}`);
    }
  }, [workspace, user, isLoadingWs, router, workspaceId, t]);

  const updateMutation = useUpdateWorkspace();
  const deleteWorkspaceMutation = useDeleteWorkspace();

  const onOpen = useProModal((state) => state.onOpen);
  const isPro = isProPlanActive(user);
  const proExpiryDate = getProExpiryDate(user);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const { url } = await paymentsApi.createPortalSession();
      window.location.href = url;
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || t('workspaceSettings.toast.openPortalFailed'));
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
        toast.success(t('workspaceSettings.toast.inviteSuccess'));
        setInviteEmail('');
        setIsInviteOpen(false);
      },
      onError: (err: unknown) => {
        toast.error(getApiErrorMessage(err) || t('workspaceSettings.toast.invalidEmail'));
      }
    });
  };

  const handleRemoveMember = () => {
    if (!memberPendingRemove) return;

    removeMemberMutation.mutate(
      { id: workspaceId, memberId: memberPendingRemove.userId },
      {
        onSuccess: () => {
          toast.success(t('workspaceSettings.toast.memberRemoved'));
          setMemberPendingRemove(null);
        },
        onError: (err: unknown) => {
          toast.error(getApiErrorMessage(err) || t('workspaceSettings.toast.memberRemoveFailed'));
        },
      },
    );
  };

  const handleDeleteWorkspace = () => {
    if (!workspace) return;

    if (deleteWorkspaceConfirmName.trim() !== workspace.name) {
      toast.error(t('workspaceSettings.toast.workspaceNameConfirmMismatch'));
      return;
    }

    deleteWorkspaceMutation.mutate(workspaceId, {
      onSuccess: () => {
        toast.success(t('workspaceSettings.toast.workspaceDeleted'));
        setIsDeleteWorkspaceOpen(false);
        setDeleteWorkspaceConfirmName('');
        router.push('/workspaces');
      },
      onError: (err: unknown) => {
        toast.error(getApiErrorMessage(err) || t('workspaceSettings.toast.workspaceDeleteFailed'));
      },
    });
  };

  const roleLabelMap: Record<string, string> = {
    OWNER: t('workspaceSettings.role.owner'),
    MEMBER: t('workspaceSettings.role.member'),
    ADMIN: t('workspaceSettings.role.admin'),
    OBSERVER: t('workspaceSettings.role.observer'),
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
                  <CardTitle>{t('workspaceSettings.general.infoTitle')}</CardTitle>
                  <CardDescription>
                    {t('workspaceSettings.general.infoDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">


                  <div className="space-y-2">
                    <Label htmlFor="name">{t('workspaceSettings.general.nameLabel')}</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('workspaceSettings.general.namePlaceholder')}
                    />
                  </div>
                  
              
                </CardContent>
                <CardFooter className="bg-muted/20 border-t py-4">
                  <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {t('workspaceSettings.general.saveChanges')}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-destructive/40 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-destructive">{t('workspaceSettings.delete.title')}</CardTitle>
                  <CardDescription>
                    {t('workspaceSettings.delete.description')}
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
                        {t('workspaceSettings.delete.button')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('workspaceSettings.delete.dialogTitle')}</DialogTitle>
                        <DialogDescription>
                          {t('workspaceSettings.delete.dialogDescriptionPrefix')}{' '}
                          <span className="font-semibold text-foreground">{workspace?.name}</span>{' '}
                          {t('workspaceSettings.delete.dialogDescriptionSuffix')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2 py-2">
                        <Label htmlFor="delete-workspace-name">{t('workspaceSettings.delete.nameLabel')}</Label>
                        <Input
                          id="delete-workspace-name"
                          value={deleteWorkspaceConfirmName}
                          onChange={(e) => setDeleteWorkspaceConfirmName(e.target.value)}
                          placeholder={workspace?.name || t('workspaceSettings.delete.namePlaceholder')}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDeleteWorkspaceOpen(false)}
                          disabled={deleteWorkspaceMutation.isPending}
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteWorkspace}
                          disabled={deleteWorkspaceMutation.isPending}
                        >
                          {deleteWorkspaceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          {t('workspaceSettings.delete.confirm')}
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
                    <CardTitle>{t('workspaceSettings.members.title')}</CardTitle>
                    <CardDescription>
                      {t('workspaceSettings.members.description')}
                    </CardDescription>
                  </div>

                  <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 w-full sm:w-auto">
                        <Users className="w-4 h-4" />
                        {t('workspaceSettings.members.addMember')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('workspaceSettings.members.inviteTitle')}</DialogTitle>
                        <DialogDescription>
                          {t('workspaceSettings.members.inviteDescription')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>{t('workspaceSettings.members.emailLabel')}</Label>
                          <Input
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="user@example.com"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('workspaceSettings.members.inviteNotePrefix')}{' '}
                          <span className="font-medium text-foreground">{t('workspaceSettings.role.member')}</span>.
                        </p>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleInvite}
                          disabled={inviteMutation.isPending || !inviteEmail}
                        >
                          {inviteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          {t('workspaceSettings.members.sendInvite')}
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
                    <DialogTitle>{t('workspaceSettings.members.removeDialogTitle')}</DialogTitle>
                    <DialogDescription>
                      {t('workspaceSettings.members.removeDialogDescription', {
                        name: memberPendingRemove?.name || t('workspaceSettings.members.thisMember'),
                      })}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setMemberPendingRemove(null)}>
                      {t('common.cancel')}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRemoveMember}
                      disabled={removeMemberMutation.isPending}
                    >
                      {removeMemberMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t('workspaceSettings.members.removeMember')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            

            {/* ── BILLING TAB ── */}
            <TabsContent value="billing" className="mt-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>{t('workspaceSettings.billing.title')}</CardTitle>
                  <CardDescription>
                    {t('workspaceSettings.billing.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Current Plan Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border bg-card p-6 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold leading-none">{isPro ? t('workspaceSettings.billing.proPlan') : t('workspaceSettings.billing.freePlan')}</p>
                        {isPro && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            <Zap className="h-3 w-3" /> PRO
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground pt-1">
                        {isPro
                          ? `${t('workspaceSettings.billing.proActive')}${proExpiryDate ? ` — ${t('workspaceSettings.billing.expiresOn')} ${proExpiryDate.toLocaleDateString(isEn ? 'en-US' : 'vi-VN')}` : ''}`
                          : t('workspaceSettings.billing.freeDescription')}
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
                          {t('workspaceSettings.billing.managePlan')}
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
                              <h3 className="text-2xl font-bold text-amber-950 dark:text-amber-100">{t('workspaceSettings.billing.upgradeTitle')}</h3>
                              <p className="text-amber-800/80 dark:text-amber-200/80 mt-1">{t('workspaceSettings.billing.upgradeSubtitle')}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <ul className="space-y-4 text-sm text-amber-900/90 dark:text-amber-100/90">
                              <li className="flex items-center gap-x-3">
                                <div className="bg-amber-100 dark:bg-amber-900/40 rounded-full p-1"><Check className="h-3 w-3 text-amber-600 dark:text-amber-300" /></div>
                                {t('workspaceSettings.billing.featureBoards')}
                              </li>
                              <li className="flex items-center gap-x-3">
                                <div className="bg-amber-100 dark:bg-amber-900/40 rounded-full p-1"><Check className="h-3 w-3 text-amber-600 dark:text-amber-300" /></div>
                                {t('workspaceSettings.billing.featureMembers')}
                              </li>
                            </ul>
                            <ul className="space-y-4 text-sm text-amber-900/90 dark:text-amber-100/90">
                              <li className="flex items-center gap-x-3">
                                <div className="bg-amber-100 dark:bg-amber-900/40 rounded-full p-1"><Check className="h-3 w-3 text-amber-600 dark:text-amber-300" /></div>
                                {t('workspaceSettings.billing.featureAttachment')}
                              </li>
                              <li className="flex items-center gap-x-3">
                                <div className="bg-amber-100 dark:bg-amber-900/40 rounded-full p-1"><Check className="h-3 w-3 text-amber-600 dark:text-amber-300" /></div>
                                {t('workspaceSettings.billing.featureSupport')}
                              </li>
                            </ul>
                          </div>

                          <Button
                            onClick={onOpen}
                            size="lg"
                            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-semibold text-white shadow-md focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 border-0"
                          >
                            {t('workspaceSettings.billing.upgradeButton')}
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
