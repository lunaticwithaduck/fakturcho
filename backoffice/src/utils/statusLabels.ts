import type { DocumentStatus } from '@fakturcho/shared-types';

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'default',
  sent: 'blue',
  paid: 'green',
  overdue: 'red',
  cancelled: 'default',
};
