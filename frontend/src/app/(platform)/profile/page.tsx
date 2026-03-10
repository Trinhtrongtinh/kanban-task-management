'use client';

import { useState, useRef } from 'react';
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
  User,
  Shield,
  Activity,
  Camera,
  Lock,
  Mail,
  CheckCircle2,
  LayoutDashboard,
  Columns,
  CreditCard,
  Trash2,
  PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

// ── Types ─────────────────────────────────────────────────────────────

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityType: 'card' | 'board' | 'list' | 'workspace' | 'account';
  createdAt: string;
}

// ── Mock data ─────────────────────────────────────────────────────────

const MOCK_ACTIVITIES: ActivityLog[] = [
  {
    id: 'a1',
    action: 'Updated card',
    entity: 'Login UI Redesign',
    entityType: 'card',
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: 'a2',
    action: 'Created board',
    entity: 'Project X – Q2',
    entityType: 'board',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'a3',
    action: 'Moved card',
    entity: 'API Integration',
    entityType: 'card',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'a4',
    action: 'Added comment to',
    entity: 'Database Schema v2',
    entityType: 'card',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'a5',
    action: 'Renamed list',
    entity: 'In Progress → Review',
    entityType: 'list',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'a6',
    action: 'Created workspace',
    entity: 'Dự án cá nhân',
    entityType: 'workspace',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'a7',
    action: 'Archived card',
    entity: 'Old Feature Spec',
    entityType: 'card',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const ENTITY_ICON: Record<ActivityLog['entityType'], React.ElementType> = {
  card: PenLine,
  board: LayoutDashboard,
  list: Columns,
  workspace: CreditCard,
  account: User,
};

const ENTITY_COLOR: Record<ActivityLog['entityType'], string> = {
  card: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  board: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  list: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
  workspace: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  account: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

// ── Shared form feedback state ────────────────────────────────────────

function SaveFeedback({ saved }: { saved: boolean }) {
  if (!saved) return null;
  return (
    <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-left-2">
      <CheckCircle2 className="h-4 w-4" />
      Saved!
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  // ── Profile form ──────────────────────────────────────────────────
  const [fullName, setFullName] = useState(user?.fullName || user?.username || '');
  const [avatarSrc, setAvatarSrc] = useState(user?.avatarUrl || `https://i.pravatar.cc/150?u=${user?.id || 'guest'}`);
  const [profileSaved, setProfileSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarSrc(URL.createObjectURL(file));
  };

  const handleSaveProfile = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // ── Security form ─────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');

  const handleUpdatePassword = () => {
    if (!currentPw || !newPw || !confirmPw) {
      setPwError('Please fill in all fields.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.');
      return;
    }
    if (newPw.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    setPwError('');
    setPwSaved(true);
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setTimeout(() => setPwSaved(false), 3000);
  };

  return (
    <div className="mx-auto max-w-3xl mt-10 pb-16 px-4">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-8 flex items-center gap-4">
        <Avatar className="h-16 w-16 ring-4 ring-primary/20 shadow-md">
          <AvatarImage src={avatarSrc} alt={fullName} />
          <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
            {fullName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{fullName || 'Chưa cập nhật tên'}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Mail className="h-3.5 w-3.5" />
            {user?.email || 'user@example.com'}
          </p>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <Tabs defaultValue="profile">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════
            TAB 1 — Profile
        ══════════════════════════════════════════════════ */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your display name and avatar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar row */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  <Avatar className="h-24 w-24 shadow-sm">
                    <AvatarImage src={avatarSrc} alt={fullName} />
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                      {fullName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                    aria-label="Change avatar"
                  >
                    <Camera className="h-4 w-4" />
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
                  >
                    Change Avatar
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, GIF or PNG · max 2MB
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Full Name</Label>
                  <Input
                    id="fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      read-only
                    </Badge>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t bg-muted/20 py-4">
              <SaveFeedback saved={profileSaved} />
              <Button
                onClick={handleSaveProfile}
                disabled={!fullName.trim()}
                className="ml-auto"
              >
                Save Changes
              </Button>
            </CardFooter>
          </Card>

          {/* Danger zone */}
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardFooter className="border-t bg-destructive/5 py-4">
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════
            TAB 2 — Security
        ══════════════════════════════════════════════════ */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Use a strong password of at least 8 characters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-pw">Current Password</Label>
                <Input
                  id="current-pw"
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-pw">New Password</Label>
                  <Input
                    id="new-pw"
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pw">Confirm New Password</Label>
                  <Input
                    id="confirm-pw"
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Password strength indicator */}
              {newPw && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Password strength</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => {
                      const strength = Math.min(
                        4,
                        [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/, /.{8}/].filter(
                          (rx) => rx.test(newPw)
                        ).length
                      );
                      return (
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
                              : 'bg-muted'
                          )}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {pwError && (
                <p className="text-sm text-destructive">{pwError}</p>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t bg-muted/20 py-4">
              <SaveFeedback saved={pwSaved} />
              <Button onClick={handleUpdatePassword} className="ml-auto">
                Update Password
              </Button>
            </CardFooter>
          </Card>

          {/* Active sessions card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Sessions</CardTitle>
              <CardDescription>
                Devices currently signed in to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {[
                { device: 'MacBook Pro — Chrome', location: 'Ho Chi Minh City, VN', current: true },
                { device: 'iPhone 15 — Safari', location: 'Ho Chi Minh City, VN', current: false },
              ].map((session, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{session.device}</p>
                    <p className="text-xs text-muted-foreground">{session.location}</p>
                  </div>
                  {session.current ? (
                    <Badge variant="secondary" className="text-[10px]">Current</Badge>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive">
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════
            TAB 3 — Activity
        ══════════════════════════════════════════════════ */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your last {MOCK_ACTIVITIES.length} actions across all workspaces.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative border-l border-border/60 ml-3 space-y-0">
                {MOCK_ACTIVITIES.map((log, i) => {
                  const Icon = ENTITY_ICON[log.entityType];
                  const colorCls = ENTITY_COLOR[log.entityType];
                  const isLast = i === MOCK_ACTIVITIES.length - 1;
                  return (
                    <li
                      key={log.id}
                      className={cn('relative pl-7', !isLast && 'pb-6')}
                    >
                      {/* Timeline dot */}
                      <span
                        className={cn(
                          'absolute -left-[18px] flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-background',
                          colorCls
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>

                      {/* Content */}
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="text-sm">
                          <span className="font-medium">{log.action}</span>{' '}
                          <span className="font-semibold text-foreground">
                            &ldquo;{log.entity}&rdquo;
                          </span>
                        </p>
                        <time className="text-xs text-muted-foreground shrink-0">
                          {timeAgo(log.createdAt)}
                        </time>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
