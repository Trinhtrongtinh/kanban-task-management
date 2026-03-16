'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Moon, Sun, Globe, Monitor, CheckCircle2 } from 'lucide-react';
import { usePreferencesStore, type AppLanguage, type AppTheme } from '@/stores/preferencesStore';

function SaveFeedback({ saved, label }: { saved: boolean; label: string }) {
  if (!saved) return null;
  return (
    <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-left-2">
      <CheckCircle2 className="h-4 w-4" />
      {label}
    </span>
  );
}

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
    save: string;
    saved: string;
    themeOptions: Record<AppTheme, string>;
    densityOptions: Record<'compact' | 'comfortable' | 'spacious', string>;
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
    save: 'Lưu tùy chỉnh',
    saved: 'Đã lưu',
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
  },
  en: {
    title: 'App Preferences',
    description: 'Customize theme, language, and display density for the entire app.',
    appearanceTitle: 'Appearance',
    appearanceDescription: 'Changes apply instantly and are saved automatically.',
    theme: 'Theme',
    language: 'Language',
    density: 'Display density',
    save: 'Save Preferences',
    saved: 'Saved!',
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
  },
};

export default function AppSettingsPage() {
  const [appearanceSaved, setAppearanceSaved] = useState(false);

  const theme = usePreferencesStore((s) => s.theme);
  const language = usePreferencesStore((s) => s.language);
  const density = usePreferencesStore((s) => s.density);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const setLanguage = usePreferencesStore((s) => s.setLanguage);
  const setDensity = usePreferencesStore((s) => s.setDensity);

  const copy = COPY[language] ?? COPY.en;

  const handleSaveAppearance = () => {
    setAppearanceSaved(true);
    setTimeout(() => setAppearanceSaved(false), 2500);
  };

  const THEME_OPTIONS = [
    { value: 'system' as const, icon: Monitor },
    { value: 'light' as const, icon: Sun },
    { value: 'dark' as const, icon: Moon },
  ];

  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-8 px-4 pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
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
        <CardFooter className="flex items-center justify-between border-t bg-muted/20 py-4">
          <SaveFeedback saved={appearanceSaved} label={copy.saved} />
          <Button onClick={handleSaveAppearance} className="ml-auto">
            {copy.save}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
