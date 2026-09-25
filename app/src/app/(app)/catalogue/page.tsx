import { CatalogueListPage } from '@app/features/catalogue/CatalogueListPage';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('catalogue');
  return { title: t('pageTitle') };
}

export default function CataloguePage() {
  return <CatalogueListPage />;
}
