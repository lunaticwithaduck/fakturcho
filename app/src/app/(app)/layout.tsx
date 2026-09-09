import { RequireAuth } from '@app/auth';
import { AppShell } from '@app/features/shell/AppShell';
import { DEFAULT_LOCALE, isLocale, loadMessages } from '@app/i18n/locale';
import type { MeDto } from '@shared/types';
import { API_ROUTES } from '@shared/types';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

async function resolveLocaleOverride() {
  try {
    const store = await cookies();
    const cookieHeader = store
      .getAll()
      .map((entry) => `${entry.name}=${entry.value}`)
      .join('; ');
    if (!cookieHeader) return null;

    const serverUrl = process.env.SERVER_URL ?? 'http://localhost:3001';
    const response = await fetch(`${serverUrl}${API_ROUTES.me}`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const me = (await response.json()) as Partial<MeDto> | null;
    const locale = me?.locale;
    if (!isLocale(locale) || locale === DEFAULT_LOCALE) return null;

    return { locale, messages: await loadMessages(locale) };
  } catch {
    return null;
  }
}

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const override = await resolveLocaleOverride();

  const shell = (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );

  if (!override) return shell;

  return (
    <NextIntlClientProvider locale={override.locale} messages={override.messages}>
      {shell}
    </NextIntlClientProvider>
  );
}
