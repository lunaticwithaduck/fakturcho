import { RequireAuth, RequireSubscription } from '@app/auth';
import { AppShell } from '@app/features/shell/AppShell';
import type { ReactNode } from 'react';

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <RequireSubscription>
        <AppShell>{children}</AppShell>
      </RequireSubscription>
    </RequireAuth>
  );
}
