'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Settings,
  ChevronLeft,
  Zap,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useProModal } from '@/hooks/use-pro-modal';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '@/hooks/use-i18n';

// ── Nav structure ────────────────────────────────────────────────────

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// ── Shared components ────────────────────────────────────────────────

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.title}</span>
    </Link>
  );
}

function NavGroupSection({
  group,
  onClick,
}: {
  group: NavGroup;
  onClick?: () => void;
}) {
  return (
    <div className="mb-4">
      <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {group.label}
      </p>
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavLink key={item.href} item={item} onClick={onClick} />
        ))}
      </div>
    </div>
  );
}

// ── Desktop Sidebar ──────────────────────────────────────────────────

function DesktopSidebar() {
  const onOpen = useProModal((state) => state.onOpen);
  const user = useAuthStore((state) => state.user);
  const isProUser = user?.planType === 'PRO';
  const { t } = useI18n();
  const NAV_GROUPS: NavGroup[] = [
    {
      label: t('sidebar.appGroup'),
      items: [
        {
          title: t('common.dashboard'),
          href: '/dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: t('sidebar.accountGroup'),
      items: [
        {
          title: t('common.profile'),
          href: '/profile',
          icon: UserCircle,
        },
        {
          title: t('common.appSettings'),
          href: '/settings',
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <aside className="fixed left-0 top-14 z-40 hidden h-[calc(100vh-3.5rem)] w-60 border-r bg-background md:flex flex-col">
      {/* Navigation groups */}
      <nav className="flex-1 overflow-y-auto px-3 pt-5">
        {NAV_GROUPS.map((group) => (
          <NavGroupSection key={group.label} group={group} />
        ))}
      </nav>

      {/* Upgrade CTA */}
      {!isProUser && (
        <div className="px-3 pb-4">
          <Button
            onClick={onOpen}
            className="w-full justify-start gap-2 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white shadow-md border-0 text-sm"
          >
            <Zap className="h-4 w-4 fill-white shrink-0" />
            {t('common.upgradeToPro')}
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="border-t px-3 py-3">
        <p className="text-[11px] text-muted-foreground">{t('sidebar.copyright')}</p>
      </div>
    </aside>
  );
}

// ── Mobile Sidebar ───────────────────────────────────────────────────

function MobileSidebar({ isOpen, onClose }: SidebarProps) {
  const onOpen = useProModal((state) => state.onOpen);
  const user = useAuthStore((state) => state.user);
  const isProUser = user?.planType === 'PRO';
  const { t } = useI18n();
  const NAV_GROUPS: NavGroup[] = [
    {
      label: t('sidebar.appGroup'),
      items: [
        {
          title: t('common.dashboard'),
          href: '/dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: t('sidebar.accountGroup'),
      items: [
        {
          title: t('common.profile'),
          href: '/profile',
          icon: UserCircle,
        },
        {
          title: t('common.appSettings'),
          href: '/settings',
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-60 p-0 flex flex-col">
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">
                  K
                </span>
              </div>
              <span className="font-semibold">Kanban</span>
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-3 pt-5">
          {NAV_GROUPS.map((group) => (
            <NavGroupSection key={group.label} group={group} onClick={onClose} />
          ))}
        </nav>

        {/* Upgrade CTA */}
        {!isProUser && (
          <div className="px-3 pb-4">
            <Button
              onClick={() => {
                onClose();
                onOpen();
              }}
              className="w-full justify-start gap-2 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white shadow-md border-0 text-sm"
            >
              <Zap className="h-4 w-4 fill-white shrink-0" />
              {t('common.upgradeToPro')}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Export ───────────────────────────────────────────────────────────

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <DesktopSidebar />
      <MobileSidebar isOpen={isOpen} onClose={onClose} />
    </>
  );
}
