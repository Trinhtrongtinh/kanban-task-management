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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Moon,
  Sun,
  Globe,
  Bell,
  Monitor,
  CheckCircle2,
} from 'lucide-react';

function SaveFeedback({ saved }: { saved: boolean }) {
  if (!saved) return null;
  return (
    <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-left-2">
      <CheckCircle2 className="h-4 w-4" />
      Saved!
    </span>
  );
}

export default function AppSettingsPage() {
  const [appearanceSaved, setAppearanceSaved] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // Appearance state
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [language, setLanguage] = useState('vi');
  const [density, setDensity] = useState('comfortable');

  // Notification state
  const [dueDateReminder, setDueDateReminder] = useState(true);
  const [mentionAlert, setMentionAlert] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [boardUpdates, setBoardUpdates] = useState(true);

  const handleSaveAppearance = () => {
    setAppearanceSaved(true);
    setTimeout(() => setAppearanceSaved(false), 3000);
  };

  const handleSaveNotif = () => {
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  };

  const THEME_OPTIONS = [
    { value: 'system', label: 'System default', icon: Monitor },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl mt-10 pb-16 px-4 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">App Preferences</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Customize appearance, language, and notification behavior across the app.
        </p>
      </div>

      {/* ── Appearance ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Choose how the app looks and feels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme picker — visual tiles */}
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
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
                    {label}
                  </span>
                  {theme === value && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                Language
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                  <SelectItem value="zh">🇨🇳 中文</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="density">Display density</Label>
              <Select value={density} onValueChange={setDensity}>
                <SelectTrigger id="density">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t bg-muted/20 py-4">
          <SaveFeedback saved={appearanceSaved} />
          <Button onClick={handleSaveAppearance} className="ml-auto">
            Save Preferences
          </Button>
        </CardFooter>
      </Card>

      {/* ── Notifications ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            <Badge variant="secondary" className="ml-auto text-[10px]">
              App-level
            </Badge>
          </CardTitle>
          <CardDescription>
            Control when and how you receive alerts. Workspace-specific notifications can be
            configured per workspace in{' '}
            <span className="font-medium text-foreground">Workspace → Settings → Notifications</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {[
            {
              id: 'due-date',
              label: 'Due Date Reminders',
              description: 'Notify me when a card I\'m assigned to is due within 24h.',
              value: dueDateReminder,
              onChange: setDueDateReminder,
            },
            {
              id: 'mentions',
              label: 'Mentions',
              description: 'Notify me when someone @mentions me in a comment.',
              value: mentionAlert,
              onChange: setMentionAlert,
            },
            {
              id: 'board-updates',
              label: 'Board Activity',
              description: 'Notify me when a card is moved or archived on boards I follow.',
              value: boardUpdates,
              onChange: setBoardUpdates,
            },
            {
              id: 'digest',
              label: 'Weekly Digest',
              description: 'Receive a weekly email summary of workspace activity.',
              value: weeklyDigest,
              onChange: setWeeklyDigest,
            },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 py-4">
              <div className="space-y-0.5">
                <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer">
                  {item.label}
                </Label>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                id={item.id}
                checked={item.value}
                onCheckedChange={item.onChange}
              />
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t bg-muted/20 py-4">
          <SaveFeedback saved={notifSaved} />
          <Button onClick={handleSaveNotif} className="ml-auto">
            Save Notifications
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
