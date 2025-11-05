'use client';

import { ReactNode } from 'react';

interface MessagesLayoutProps {
  children: ReactNode;
}

export default function MessagesLayout({ children }: MessagesLayoutProps) {
  return (
    <div className="h-[calc(100vh-4rem)] bg-white">
      {children}
    </div>
  );
}
