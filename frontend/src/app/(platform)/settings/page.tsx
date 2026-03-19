'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun, Globe, Monitor, CheckCircle2, ArrowLeft } from 'lucide-react';
import { usePreferencesStore, type AppLanguage, type AppTheme } from '@/stores/preferencesStore';
import { useI18n } from '@/hooks/ui/use-i18n';
import { toast } from 'sonner';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/stores/authStore';

const COPY: Record<
  AppLanguage,
  {
    title: string;
    description: string;
    appearanceTitle: string;
    appearanceDescription: string;
    theme: string;
    language: string;
    density: string;
    themeOptions: Record<AppTheme, string>;
    densityOptions: Record<'compact' | 'comfortable' | 'spacious', string>;
    notificationsTitle: string;
    notificationsDescription: string;
    notificationsHint: string;
    dueDateTitle: string;
    dueDateDescription: string;
    mentionTitle: string;
    mentionDescription: string;
    saved: string;
    saveError: string;
  }
> = {
  vi: {
    title: 'Tùy chỉnh ứng dụng',
    description: 'Tùy chỉnh giao diện, ngôn ngữ và mật độ hiển thị cho toàn bộ ứng dụng.',
    appearanceTitle: 'Hiển thị',
    appearanceDescription: 'Các thay đổi được áp dụng ngay lập tức và tự động lưu.',
    theme: 'Chế độ màu',
    language: 'Ngôn ngữ',
    density: 'Mật độ hiển thị',
    themeOptions: {
      system: 'Theo hệ thống',
      light: 'Sáng',
      dark: 'Tối',
    },
    densityOptions: {
      compact: 'Gọn',
      comfortable: 'Tiêu chuẩn',
      spacious: 'Rộng',
    },
    notificationsTitle: 'Thông báo email cá nhân',
    notificationsDescription: 'Các tùy chọn này áp dụng cho riêng bạn, không phụ thuộc vai trò owner/member của workspace.',
    notificationsHint: 'Các thay đổi được lưu ngay và email sẽ đi qua SMTP hiện tại, nên bạn có thể kiểm tra bằng Mailtrap.',
    dueDateTitle: 'Nhắc hạn thẻ',
    dueDateDescription: 'Gửi email khi thẻ được giao cho tôi sắp đến hạn trong 24 giờ.',
    mentionTitle: 'Được nhắc trong bình luận',
    mentionDescription: 'Gửi email khi có người @nhắc đến tôi trong bình luận của thẻ.',
    saved: 'Đã lưu tùy chọn thông báo',
    saveError: 'Không thể lưu tùy chọn thông báo',
  },
  en: {
    title: 'App Preferences',
    description: 'Customize theme, language, and display density for the entire app.',
    appearanceTitle: 'Appearance',
    appearanceDescription: 'Changes apply instantly and are saved automatically.',
    theme: 'Theme',
    language: 'Language',
    density: 'Display density',
    themeOptions: {
      system: 'System',
      light: 'Light',
      dark: 'Dark',
    },
    densityOptions: {
      compact: 'Compact',
      comfortable: 'Comfortable',
      spacious: 'Spacious',
    },
    notificationsTitle: 'Personal Email Notifications',
    notificationsDescription: 'These preferences apply to your account only, not to workspace owners or members globally.',
    notificationsHint: 'Changes are saved instantly and emails use the current SMTP setup, so you can verify them with Mailtrap.',
    dueDateTitle: 'Due date reminders',
    dueDateDescription: 'Send me an email when a card assigned to me is due within 24 hours.',
    mentionTitle: 'Comment mentions',
    mentionDescription: 'Send me an email when someone @mentions me in a card comment.',
    saved: 'Notification preferences saved',
    saveError: 'Unable to save notification preferences',
  },
};

type NotificationPreferenceState = {
  notifyDueDateEmail: boolean;
  notifyMentionEmail: boolean;
};

function getNotificationPreferenceState(
  user: ReturnType<typeof useAuthStore.getState>['user'],
): NotificationPreferenceState {
  return {
    notifyDueDateEmail: user?.notifyDueDateEmail ?? true,
    notifyMentionEmail: user?.notifyMentionEmail ?? true,
  };
}

export default function AppSettingsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [exitTargetPath] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return (
      window.sessionStorage.getItem('kanban:returnPath') ||
      window.sessionStorage.getItem('kanban:lastBoardPath')
    );
  });

  const theme = usePreferencesStore((s) => s.theme);
  const language = usePreferencesStore((s) => s.language);
  const density = usePreferencesStore((s) => s.density);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const setLanguage = usePreferencesStore((s) => s.setLanguage);
  const setDensity = usePreferencesStore((s) => s.setDensity);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferenceState>(() => getNotificationPreferenceState(useAuthStore.getState().user));
  const [savingPreference, setSavingPreference] = useState<keyof NotificationPreferenceState | null>(null);

  const copy = COPY[language] ?? COPY.en;

  const THEME_OPTIONS = [
    { value: 'system' as const, icon: Monitor },
    { value: 'light' as const, icon: Sun },
    { value: 'dark' as const, icon: Moon },
  ];

  useEffect(() => {
    setNotificationPreferences(getNotificationPreferenceState(user));
  }, [user]);

  const updateNotificationPreference = async (
    key: keyof NotificationPreferenceState,
    checked: boolean,
  ) => {
    const previous = notificationPreferences;
    const next = {
      ...notificationPreferences,
      [key]: checked,
    };

    setNotificationPreferences(next);
    setSavingPreference(key);

    try {
      const updatedUser = await usersApi.updateNotificationPreferences(next);
      setUser(updatedUser);
      toast.success(copy.saved);
    } catch {
      setNotificationPreferences(previous);
      toast.error(copy.saveError);
    } finally {
      setSavingPreference(null);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-8 px-4 pb-16">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
          </div>

          {exitTargetPath && (
            <Button variant="outline" className="gap-2" onClick={() => router.push(exitTargetPath)}>
              <ArrowLeft className="h-4 w-4" />
              {t('common.exit')}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            {copy.appearanceTitle}
          </CardTitle>
          <CardDescription>{copy.appearanceDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{copy.theme}</Label>
            <div className="grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:border-primary/60 ${
                    theme === value
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${theme === value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${theme === value ? 'text-primary' : 'text-muted-foreground'}`}>
                    {copy.themeOptions[value]}
                  </span>
                  {theme === value && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                {copy.language}
              </Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as AppLanguage)}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="density">{copy.density}</Label>
              <Select value={density} onValueChange={(v) => setDensity(v as 'compact' | 'comfortable' | 'spacious')}>
                <SelectTrigger id="density">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">{copy.densityOptions.compact}</SelectItem>
                  <SelectItem value="comfortable">{copy.densityOptions.comfortable}</SelectItem>
                  <SelectItem value="spacious">{copy.densityOptions.spacious}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.notificationsTitle}</CardTitle>
          <CardDescription>{copy.notificationsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{copy.notificationsHint}</p>

          <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
            <div className="space-y-1">
              <Label htmlFor="notify-due-date">{copy.dueDateTitle}</Label>
              <p className="text-sm text-muted-foreground">{copy.dueDateDescription}</p>
            </div>
            <Switch
              id="notify-due-date"
              checked={notificationPreferences.notifyDueDateEmail}
              disabled={savingPreference !== null}
              onCheckedChange={(checked) => updateNotificationPreference('notifyDueDateEmail', checked)}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
            <div className="space-y-1">
              <Label htmlFor="notify-mention">{copy.mentionTitle}</Label>
              <p className="text-sm text-muted-foreground">{copy.mentionDescription}</p>
            </div>
            <Switch
              id="notify-mention"
              checked={notificationPreferences.notifyMentionEmail}
              disabled={savingPreference !== null}
              onCheckedChange={(checked) => updateNotificationPreference('notifyMentionEmail', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
