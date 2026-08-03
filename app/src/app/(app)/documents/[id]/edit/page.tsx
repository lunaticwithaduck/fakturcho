import { DocumentComposerPage } from '@app/features/documents/DocumentComposerPage';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Редактиране на документ — Фактурчо' };

interface EditDocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDocumentPage({ params }: EditDocumentPageProps) {
  const { id } = await params;
  return <DocumentComposerPage documentId={id} />;
}
