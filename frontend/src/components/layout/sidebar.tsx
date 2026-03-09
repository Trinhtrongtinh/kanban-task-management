'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Settings, ChevronLeft, Layers, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useProModal } from '@/hooks/use-pro-modal';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  {
    title: 'Bảng điều khiển',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Cài đặt Toàn cục',
    href: '/settings',
    icon: Settings,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
      <Icon className="h-4 w-4" />
      <span>{item.title}</span>
    </Link>
  );
}

// Desktop Sidebar
function DesktopSidebar() {
  const onOpen = useProModal((state) => state.onOpen);

  return (
    <aside className="fixed left-0 top-14 z-40 hidden h-[calc(100vh-3.5rem)] w-64 border-r bg-background md:block">
      <div className="flex h-full flex-col">
        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Upgrade Addon */}
        <div className="px-4 pb-4">
          <Button 
            onClick={onOpen}
            className="w-full justify-start gap-2 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white shadow-md border-0"
          >
            <Zap className="h-4 w-4 fill-white" />
            Upgrade to Pro
          </Button>
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">
            © 2026 Kanban App
          </p>
        </div>
      </div>
    </aside>
  );
}

// Mobile Sidebar (Sheet)
function MobileSidebar({ isOpen, onClose }: SidebarProps) {
  const onOpen = useProModal((state) => state.onOpen);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">K</span>
              </div>
              <span className="font-semibold">Kanban</span>
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} onClick={onClose} />
          ))}
        </nav>

        {/* Upgrade Addon */}
        <div className="px-4 pb-4 mt-auto">
          <Button 
            onClick={() => {
              onClose();
              onOpen();
            }}
            className="w-full justify-start gap-2 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white shadow-md border-0"
          >
            <Zap className="h-4 w-4 fill-white" />
            Upgrade to Pro
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <DesktopSidebar />
      <MobileSidebar isOpen={isOpen} onClose={onClose} />
    </>
  );
}
