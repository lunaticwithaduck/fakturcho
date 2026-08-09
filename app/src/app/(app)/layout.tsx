import { RequireAuth } from '@app/auth';
import { AppShell } from '@app/features/shell/AppShell';
import type { ReactNode } from 'react';

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
