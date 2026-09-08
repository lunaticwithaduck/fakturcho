import { BillingPage } from '@app/features/billing/BillingPage';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Билинг' };

export default function BillingRoute() {
  return <BillingPage />;
}
