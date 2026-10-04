import { getFeatureFlags } from '@app/feature-flags';
import { AuthShell } from '@app/features/auth/AuthShell';
import { AUTH_MESSAGE_NAMESPACES } from '@app/features/auth/authMessageNamespaces';
import { hasGuideIndex } from '@app/features/guides/indexAlternates';
import { ClientMessages } from '@app/i18n/ClientMessages';
import type { ReactNode } from 'react';

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const flags = await getFeatureFlags();
  return (
    <ClientMessages namespaces={AUTH_MESSAGE_NAMESPACES}>
      <AuthShell enEnabled={flags.EN_LOCALE} guideIndex={hasGuideIndex('bg')}>
        {children}
      </AuthShell>
    </ClientMessages>
  );
}
