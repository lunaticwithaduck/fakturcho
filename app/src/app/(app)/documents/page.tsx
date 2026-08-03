import { DocumentsListPage } from '@app/features/documents/DocumentsListPage';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Документи — Фактурчо' };

export default function DocumentsPage() {
  return <DocumentsListPage />;
}
