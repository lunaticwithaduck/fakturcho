import { DocumentComposerPage } from '@app/features/documents/DocumentComposerPage';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('documents.composer');
  return { title: t('titleNew') };
}

export default function NewDocumentPage() {
  return <DocumentComposerPage />;
}
