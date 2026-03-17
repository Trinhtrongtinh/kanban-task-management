'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { usersApi, type RecentActivity } from '@/api/users';
import { useAuthStore } from '@/stores/authStore';
import { cn, resolveAvatarUrl } from '@/lib/utils';
import { formatDateTimeVN } from '@/lib/date-time';
import { PasswordInput } from '@/components/ui/password-input';

/** Canvas-based circular crop helper */
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<File> {
  const image = new window.Image();
  image.crossOrigin = 'anonymous';
  image.src = imageSrc;
  await new Promise<void>((resolve) => {
    image.onload = () => resolve();
  });

  const size = Math.min(pixelCrop.width, pixelCrop.height);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Clip to circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  );

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas is empty'));
        resolve(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92,
    );
  });
}

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
  const queryClient = useQueryClient();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [username, setUsername] = useState(user?.username || '');
  const [avatarPreview, setAvatarPreview] = useState(resolveAvatarUrl(user?.avatarUrl) || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [cropSrc, setCropSrc] = useState('');
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, cropped: Area) => {
    setCroppedAreaPixels(cropped);
  }, []);

  const handleCloseCropDialog = () => {
    setIsCropOpen(false);
    if (cropSrc.startsWith('blob:')) URL.revokeObjectURL(cropSrc);
    setCropSrc('');
  };

  useEffect(() => {
    setUsername(user?.username || '');
    setAvatarPreview(resolveAvatarUrl(user?.avatarUrl) || '');
  }, [user?.username, resolveAvatarUrl(user?.avatarUrl)]);

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
      setAvatarPreview(resolveAvatarUrl(updatedUser.avatarUrl) || '');
      queryClient.invalidateQueries();
      toast.success('Đã cập nhật ảnh đại diện');
    },
    onError: (error: any) => {
      setAvatarPreview(resolveAvatarUrl(user?.avatarUrl) || '');
      toast.error(error?.response?.data?.message || 'Không thể cập nhật ảnh đại diện');
    },
  });

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      const file = await getCroppedImg(cropSrc, croppedAreaPixels);
      setIsCropOpen(false);
      // show blob preview while uploading
      setAvatarPreview(cropSrc);
      uploadAvatarMutation.mutate(file);
    } catch {
      toast.error('Không thể cắt ảnh, vui lòng thử lại');
    }
  };

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

  const deletePhrase = 'XOA TAI KHOAN';

  const displayName = user?.username || 'Người dùng';

  const handleSaveProfile = () => {
    const trimmed = username.trim();
    if (!trimmed) {
      toast.error('Username không được để trống');
      return;
    }

    if (trimmed.length < 3) {
      toast.error('Username phải có ít nhất 3 ký tự');
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      toast.error('Username chỉ được gồm chữ, số và các ký tự . _ -');
      return;
    }

    updateProfileMutation.mutate({ username: trimmed });
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    event.target.value = '';
    setCropSrc(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropOpen(true);
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

    if (newPw === currentPw) {
      toast.error('Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    if (strength < 3) {
      toast.error('Mật khẩu mới chưa đủ mạnh');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: currentPw,
      newPassword: newPw,
    });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText.trim().toUpperCase() !== deletePhrase) {
      toast.error(`Vui lòng nhập chính xác: ${deletePhrase}`);
      return;
    }

    deleteAccountMutation.mutate(undefined, {
      onSuccess: () => {
        setDeleteConfirmText('');
        setIsDeleteDialogOpen(false);
      },
    });
  };

  return (
    <div className="mx-auto mt-10 max-w-3xl px-4 pb-16">
      <div className="mb-8 flex items-center gap-4">
        <Avatar key={avatarPreview} className="h-16 w-16 ring-4 ring-primary/20 shadow-md">
          <AvatarImage src={resolveAvatarUrl(avatarPreview) || undefined} alt={displayName} />
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

      {/* Plan Info Card */}
      <Card className={cn('mb-6 border-2 overflow-hidden', user?.planType === 'PRO' ? 'border-amber-400/50 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20' : 'border-border')}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.planType === 'PRO' && <Zap className="h-5 w-5 text-amber-500" />}
              <CardTitle className={user?.planType === 'PRO' ? 'text-amber-900 dark:text-amber-100' : ''}>
                {user?.planType === 'PRO' ? 'Kanban Pro' : 'Free Plan'}
              </CardTitle>
            </div>
            <Badge
              className={cn(
                'px-3 py-1 font-semibold',
                user?.planType === 'PRO'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100'
              )}
            >
              {user?.planType}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Tình trạng</p>
              <p className="font-semibold flex items-center gap-2 mt-1">
                <CheckCircle2 className={`h-4 w-4 ${user?.planType === 'PRO' ? 'text-amber-500' : 'text-green-500'}`} />
                {user?.planType === 'PRO' ? 'Hoạt động' : 'Miễn phí'}
              </p>
            </div>
            {user?.planType === 'PRO' && user?.expiredAt && (
              <div>
                <p className="text-muted-foreground">Thời hạn Pro</p>
                <p className="font-semibold mt-1">{formatDateTimeVN(user.expiredAt)}</p>
              </div>
            )}
            {user?.planType === 'PRO' && !user?.expiredAt && (
              <div>
                <p className="text-muted-foreground">Thời hạn Pro</p>
                <p className="font-semibold mt-1">Đang cập nhật</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                  <Avatar key={avatarPreview} className="h-24 w-24 shadow-sm">
                    <AvatarImage src={resolveAvatarUrl(avatarPreview) || undefined} alt={displayName} />
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
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Xóa tài khoản
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-destructive">Xác nhận xóa tài khoản</DialogTitle>
                    <DialogDescription>
                      Hành động này không thể hoàn tác. Để xác nhận, nhập chính xác chuỗi bên dưới.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm font-medium tracking-wide">
                      {deletePhrase}
                    </div>
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Nhập chuỗi xác nhận"
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={
                        deleteAccountMutation.isPending ||
                        deleteConfirmText.trim().toUpperCase() !== deletePhrase
                      }
                    >
                      {deleteAccountMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa vĩnh viễn'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                <PasswordInput
                  id="current-pw"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-pw">Mật khẩu mới</Label>
                  <PasswordInput
                    id="new-pw"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-pw">Xác nhận mật khẩu mới</Label>
                  <PasswordInput
                    id="confirm-pw"
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
                            {formatDateTimeVN(activity.createdAt)}
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

      {/* Avatar Crop Dialog */}
      <Dialog open={isCropOpen} onOpenChange={(open) => { if (!open) handleCloseCropDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cắt ảnh đại diện</DialogTitle>
            <DialogDescription>
              Di chuyển và phóng to để chỉnh vùng ảnh muốn dùng.
            </DialogDescription>
          </DialogHeader>
          <div className="relative h-72 w-full overflow-hidden rounded-lg bg-muted">
            {cropSrc && (
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="flex items-center gap-3 px-1">
            <span className="text-xs text-muted-foreground w-8 shrink-0">Thu nhỏ</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-xs text-muted-foreground w-6 shrink-0">To</span>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseCropDialog}>
              Hủy
            </Button>
            <Button onClick={handleCropConfirm} disabled={!croppedAreaPixels || uploadAvatarMutation.isPending}>
              {uploadAvatarMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải...</>
              ) : (
                'Xác nhận và lưu'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
