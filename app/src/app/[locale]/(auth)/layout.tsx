import { AuthShell } from '@app/features/auth/AuthShell';
import { AUTH_MESSAGE_NAMESPACES } from '@app/features/auth/authMessageNamespaces';
import { hasGuideIndex } from '@app/features/guides/indexAlternates';
import { ClientMessages } from '@app/i18n/ClientMessages';
import type { Locale } from '@shared/types';
import type { ReactNode } from 'react';

interface LocaleAuthLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleAuthLayout({ children, params }: LocaleAuthLayoutProps) {
  const { locale } = await params;
  return (
    <ClientMessages namespaces={AUTH_MESSAGE_NAMESPACES}>
      <AuthShell locale={locale as Locale} enEnabled guideIndex={hasGuideIndex(locale as Locale)}>
        {children}
      </AuthShell>
    </ClientMessages>
  );
}
