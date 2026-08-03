import { CatalogueListPage } from '@app/features/catalogue/CatalogueListPage';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Каталог — Фактурчо' };

export default function CataloguePage() {
  return <CatalogueListPage />;
}
