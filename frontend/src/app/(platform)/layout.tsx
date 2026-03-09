'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header, Sidebar } from '@/components/layout';


import { GlobalModalProvider } from '@/components/providers/global-modal-provider';

const queryClient = new QueryClient();

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalModalProvider />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <Header onMenuClick={handleMenuClick} />

        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

        {/* Main Content */}
        <main className="pt-14 md:pl-60">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </QueryClientProvider>
  );
}
