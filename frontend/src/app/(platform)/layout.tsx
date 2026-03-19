'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header, Sidebar } from '@/components/layout';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';


import { GlobalModalProvider } from '@/components/providers/global-modal-provider';
import { SocketProvider } from '@/components/providers/socket-provider';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient();

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const initAuth = useAuthStore(s => s.initAuth);
  const isLoading = useAuthStore(s => s.isLoading);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <GlobalModalProvider />
        <Toaster richColors closeButton position="top-right" />
        <div className="min-h-screen bg-background">
          {/* Header */}
          <Header onMenuClick={handleMenuClick} />

          {/* Sidebar */}
          <Sidebar
            isOpen={sidebarOpen}
            onClose={handleSidebarClose}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleSidebarToggle}
          />

          {/* Main Content */}
          <main className={`pt-14 ${isSidebarCollapsed ? 'md:pl-0' : 'md:pl-60'}`}>
            <div className="container mx-auto p-6">{children}</div>
          </main>
        </div>
      </SocketProvider>
    </QueryClientProvider>
  );
}
