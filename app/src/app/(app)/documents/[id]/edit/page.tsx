import { DocumentComposerPage } from '@app/features/documents/DocumentComposerPage';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('documents.composer');
  return { title: t('titleEdit') };
}

interface EditDocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDocumentPage({ params }: EditDocumentPageProps) {
  const { id } = await params;
  return <DocumentComposerPage documentId={id} />;
}
