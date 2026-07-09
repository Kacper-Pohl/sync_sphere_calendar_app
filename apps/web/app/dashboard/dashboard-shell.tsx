'use client';

import { Suspense } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';

function DashboardShellContent({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="scrollbar-hide flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      }
    >
      <DashboardShellContent>{children}</DashboardShellContent>
    </Suspense>
  );
}
