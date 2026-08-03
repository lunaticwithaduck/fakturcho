import { Badge } from '@design/components';
import { DOCUMENT_STATUS_LABELS } from '@fakturcho/shared-types';
import type { DocumentStatus } from '@shared/types';
import { getStatusBadgeVariant } from './statusBadge';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  return <Badge variant={getStatusBadgeVariant(status)}>{DOCUMENT_STATUS_LABELS[status]}</Badge>;
}
