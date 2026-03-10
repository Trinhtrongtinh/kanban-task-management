'use client';

import { useEffect, useState } from 'react';
import { ProModal } from '@/components/modals/pro-modal';
import { WorkspaceModal } from '@/components/modals/workspace-modal';

export function GlobalModalProvider() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <ProModal />
      <WorkspaceModal />
    </>
  );
}
