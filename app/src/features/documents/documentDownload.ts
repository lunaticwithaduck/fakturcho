import type { DocumentStatus } from '@shared/types';

export function canDownloadDocument(status: DocumentStatus): boolean {
  return status !== 'draft';
}
