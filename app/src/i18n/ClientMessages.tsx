import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { ReactNode } from 'react';

interface ClientMessagesProps {
  namespaces: readonly string[];
  children: ReactNode;
}

export async function ClientMessages({ namespaces, children }: ClientMessagesProps) {
  const all = (await getMessages()) as Record<string, unknown>;
  const messages = Object.fromEntries(namespaces.map((namespace) => [namespace, all[namespace]]));
  return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>;
}
