'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Camera,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  PenLine,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { usersApi, type RecentActivity } from '@/api/users';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

function SaveFeedback({ saved }: { saved: boolean }) {
  if (!saved) return null;

  return (
    <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-left-2">
      <CheckCircle2 className="h-4 w-4" />
      Đã lưu
    </span>
  );
}

type ActivityKind = 'card' | 'board' | 'account';

const ENTITY_ICON: Record<ActivityKind, React.ElementType> = {
  card: PenLine,
  board: LayoutDashboard,
  account: CreditCard,
};

const ENTITY_COLOR: Record<ActivityKind, string> = {
  card: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  board: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  account: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
};

function getActivityKind(activity: RecentActivity): ActivityKind {
  if (activity.cardId) return 'card';
  if (activity.boardId) return 'board';
  return 'account';
}

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [username, setUsername] = useState(user?.username || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUsername(user?.username || '');
    setAvatarPreview(user?.avatarUrl || '');
  }, [user?.username, user?.avatarUrl]);

  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['profile', 'activities'],
    queryFn: usersApi.getRecentActivity,
    refetchInterval: 15000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setProfileSaved(true);
      toast.success('Đã cập nhật username');
      window.setTimeout(() => setProfileSaved(false), 2500);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật hồ sơ');
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: usersApi.uploadAvatar,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setAvatarPreview(updatedUser.avatarUrl || '');
      toast.success('Đã cập nhật ảnh đại diện');
    },
    onError: (error: any) => {
      setAvatarPreview(user?.avatarUrl || '');
      toast.error(error?.response?.data?.message || 'Không thể cập nhật ảnh đại diện');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => {
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setPwSaved(true);
      toast.success('Đổi mật khẩu thành công');
      window.setTimeout(() => setPwSaved(false), 2500);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể đổi mật khẩu');
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: usersApi.deleteAccount,
    onSuccess: () => {
      logout();
      toast.success('Tài khoản đã được xóa');
      router.push('/login');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể xóa tài khoản');
    },
  });

  const strength = useMemo(
    () =>
      Math.min(
        4,
        [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/, /.{8}/].filter((rx) => rx.test(newPw)).length,
      ),
    [newPw],
  );

  const displayName = user?.username || 'Người dùng';

  const handleSaveProfile = () => {
    const trimmed = username.trim();
    if (!trimmed) {
      toast.error('Username không được để trống');
      return;
    }

    updateProfileMutation.mutate({ username: trimmed });
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
    uploadAvatarMutation.mutate(file);
  };

  const handleChangePassword = () => {
    if (!currentPw || !newPw || !confirmPw) {
      toast.error('Vui lòng nhập đầy đủ thông tin mật khẩu');
      return;
    }

    if (newPw !== confirmPw) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu chưa khớp');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: currentPw,
      newPassword: newPw,
    });
  };

  const handleDeleteAccount = () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.')) {
      return;
    }

    deleteAccountMutation.mutate();
  };

  return (
    <div className="mx-auto mt-10 max-w-3xl px-4 pb-16">
      <div className="mb-8 flex items-center gap-4">
        <Avatar className="h-16 w-16 ring-4 ring-primary/20 shadow-md">
          <AvatarImage src={avatarPreview || undefined} alt={displayName} />
          <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
            {displayName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            {user?.email || 'user@example.com'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Hồ sơ
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Bảo mật
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Hoạt động
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Cập nhật username và ảnh đại diện của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <Avatar className="h-24 w-24 shadow-sm">
                    <AvatarImage src={avatarPreview || undefined} alt={displayName} />
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                      {displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                    aria-label="Đổi ảnh đại diện"
                  >
                    {uploadAvatarMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <div className="space-y-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAvatarMutation.isPending}
                  >
                    {uploadAvatarMutation.isPending ? 'Đang tải ảnh...' : 'Đổi ảnh đại diện'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, GIF, WEBP · tối đa 2MB
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      chỉ đọc
                    </Badge>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" value={user?.email || ''} disabled className="pl-9" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t bg-muted/20 py-4">
              <SaveFeedback saved={profileSaved} />
              <Button
                onClick={handleSaveProfile}
                disabled={!username.trim() || updateProfileMutation.isPending}
                className="ml-auto"
              >
                {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-4 w-4" />
                Vùng nguy hiểm
              </CardTitle>
              <CardDescription>
                Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan.
              </CardDescription>
            </CardHeader>
            <CardFooter className="border-t bg-destructive/5 py-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleteAccountMutation.isPending}
              >
                {deleteAccountMutation.isPending ? 'Đang xóa...' : 'Xóa tài khoản'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Đổi mật khẩu
              </CardTitle>
              <CardDescription>
                Sử dụng mật khẩu mạnh với ít nhất 8 ký tự.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-pw">Mật khẩu hiện tại</Label>
                <Input
                  id="current-pw"
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-pw">Mật khẩu mới</Label>
                  <Input
                    id="new-pw"
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-pw">Xác nhận mật khẩu mới</Label>
                  <Input
                    id="confirm-pw"
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {newPw && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Độ mạnh mật khẩu</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          'h-1.5 flex-1 rounded-full transition-colors',
                          level <= strength
                            ? strength <= 1
                              ? 'bg-red-500'
                              : strength === 2
                                ? 'bg-amber-500'
                                : strength === 3
                                  ? 'bg-yellow-400'
                                  : 'bg-green-500'
                            : 'bg-muted',
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t bg-muted/20 py-4">
              <SaveFeedback saved={pwSaved} />
              <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending} className="ml-auto">
                {changePasswordMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Các hoạt động gần đây của bạn được cập nhật theo dữ liệu thực tế.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingActivities ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : activities.length === 0 ? (
                <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                  Chưa có hoạt động nào gần đây.
                </div>
              ) : (
                <ol className="relative ml-3 space-y-0 border-l border-border/60">
                  {activities.map((activity, index) => {
                    const kind = getActivityKind(activity);
                    const Icon = ENTITY_ICON[kind];
                    const colorCls = ENTITY_COLOR[kind];
                    const target = activity.card?.title || activity.board?.title;
                    const isLast = index === activities.length - 1;

                    return (
                      <li key={activity.id} className={cn('relative pl-7', !isLast && 'pb-6')}>
                        <span
                          className={cn(
                            'absolute -left-[18px] flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-background',
                            colorCls,
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>

                        <div className="flex flex-wrap items-baseline gap-2">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">{activity.content}</span>
                            {target ? <span className="font-semibold"> · {target}</span> : null}
                          </p>
                          <time className="shrink-0 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.createdAt), {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </time>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
