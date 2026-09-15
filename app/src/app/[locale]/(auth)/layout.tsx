import { AuthShell } from '@app/features/auth/AuthShell';
import type { Locale } from '@shared/types';
import type { ReactNode } from 'react';

interface LocaleAuthLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleAuthLayout({ children, params }: LocaleAuthLayoutProps) {
  const { locale } = await params;
  return (
    <AuthShell locale={locale as Locale} enEnabled>
      {children}
    </AuthShell>
  );
}
