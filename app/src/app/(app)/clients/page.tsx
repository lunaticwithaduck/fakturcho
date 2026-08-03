import { ClientsListPage } from '@app/features/clients/ClientsListPage';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Клиенти — Фактурчо' };

export default function ClientsPage() {
  return <ClientsListPage />;
}
