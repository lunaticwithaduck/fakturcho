import { DocumentViewPage } from '@app/features/documents/DocumentViewPage';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Документ — Фактурчо' };

interface ViewDocumentPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ issue?: string }>;
}

export default async function ViewDocumentPage({ params, searchParams }: ViewDocumentPageProps) {
  const { id } = await params;
  const query = await searchParams;
  return <DocumentViewPage documentId={id} autoOpenIssue={query.issue === '1'} />;
}
