import { DocumentComposerPage } from '@app/features/documents/DocumentComposerPage';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Нов документ' };

export default function NewDocumentPage() {
  return <DocumentComposerPage />;
}
