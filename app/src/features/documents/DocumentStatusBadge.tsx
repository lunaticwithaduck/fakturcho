import { Badge } from '@design/components';
import { getDocumentStatusLabel } from '@fakturcho/shared-types';
import type { DocumentStatus, Locale } from '@shared/types';
import { useLocale } from 'next-intl';
import { getStatusBadgeVariant } from './statusBadge';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const locale = useLocale() as Locale;

  return (
    <Badge variant={getStatusBadgeVariant(status)}>{getDocumentStatusLabel(status, locale)}</Badge>
  );
}
