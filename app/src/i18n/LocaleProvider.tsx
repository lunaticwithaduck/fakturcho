'use client';

import type { Locale } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { NextIntlClientProvider } from 'next-intl';
import { type ReactNode, useEffect, useState } from 'react';
import { DEFAULT_LOCALE, isLocale, loadMessages } from './locale';

interface Override {
  locale: Locale;
  messages: Awaited<ReturnType<typeof loadMessages>>;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<Override | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function resolve() {
      const response = await fetch(API_ROUTES.me, {
        credentials: 'include',
        signal: controller.signal,
      });
      if (!response.ok) return;
      const me: unknown = await response.json();
      const locale = (me as { locale?: unknown } | null)?.locale;
      if (!isLocale(locale) || locale === DEFAULT_LOCALE) return;
      const messages = await loadMessages(locale);
      setOverride({ locale, messages });
    }

    resolve().catch(() => {});
    return () => controller.abort();
  }, []);

  if (!override) return children;

  return (
    <NextIntlClientProvider locale={override.locale} messages={override.messages}>
      {children}
    </NextIntlClientProvider>
  );
}
