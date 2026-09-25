import { DocumentsListPage } from '@app/features/documents/DocumentsListPage';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('documents.list');
  return { title: t('pageTitle') };
}

export default function DocumentsPage() {
  return <DocumentsListPage />;
}
