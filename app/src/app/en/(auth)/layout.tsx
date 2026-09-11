import { AuthShell } from '@app/features/auth/AuthShell';
import enMessages from '@messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

export default function EnglishAuthLayout({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <AuthShell locale="en">{children}</AuthShell>
    </NextIntlClientProvider>
  );
}
