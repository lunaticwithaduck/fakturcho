import { getFeatureFlags } from '@app/feature-flags';
import { AuthShell } from '@app/features/auth/AuthShell';
import type { ReactNode } from 'react';

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const flags = await getFeatureFlags();
  return <AuthShell enEnabled={flags.EN_LOCALE}>{children}</AuthShell>;
}
