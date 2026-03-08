'use client';

import { useState } from 'react';
import { Header, Sidebar } from '@/components/layout';
import { ModalProvider } from '@/components/providers/modal-provider';

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header onMenuClick={handleMenuClick} />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

      {/* Main Content */}
      <main className="pt-14 md:pl-64">
        <div className="container mx-auto p-6">{children}</div>
      </main>
      <ModalProvider />
    </div>
  );
}
