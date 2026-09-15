import { AuthShell } from '@app/features/auth/AuthShell';
import type { ReactNode } from 'react';

export default function EnglishAuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthShell locale="en" enEnabled>
      {children}
    </AuthShell>
  );
}
