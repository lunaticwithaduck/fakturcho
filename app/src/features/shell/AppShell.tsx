import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface md:flex-row">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 px-4 pt-4 pb-20 sm:px-6 md:pb-6 lg:px-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
