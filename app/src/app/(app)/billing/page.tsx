import { BillingPage } from '@app/features/billing/BillingPage';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Билинг — Фактурчо' };

export default function BillingRoute() {
  return <BillingPage />;
}
