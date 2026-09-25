import { DocumentViewPage } from '@app/features/documents/DocumentViewPage';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('documents.view');
  return { title: t('pageTitle') };
}

interface ViewDocumentPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ issue?: string }>;
}

export default async function ViewDocumentPage({ params, searchParams }: ViewDocumentPageProps) {
  const { id } = await params;
  const query = await searchParams;
  return <DocumentViewPage documentId={id} autoOpenIssue={query.issue === '1'} />;
}
