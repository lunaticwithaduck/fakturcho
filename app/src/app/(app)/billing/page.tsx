import { BillingPage } from '@app/features/billing/BillingPage';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('billing');
  return { title: t('pageTitle') };
}

export default function BillingRoute() {
  return <BillingPage />;
}
