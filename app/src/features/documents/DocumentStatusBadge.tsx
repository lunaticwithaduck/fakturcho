import { Badge } from '@design/components';
import { getDocumentStatusLabel } from '@fakturcho/shared-types';
import type { DocumentStatus, DocumentType, Locale } from '@shared/types';
import { useLocale } from 'next-intl';
import { getStatusBadgeVariant } from './statusBadge';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  documentType?: DocumentType;
}

export function DocumentStatusBadge({ status, documentType }: DocumentStatusBadgeProps) {
  const locale = useLocale() as Locale;

  return (
    <Badge variant={getStatusBadgeVariant(status)}>
      {getDocumentStatusLabel(status, locale, documentType)}
    </Badge>
  );
}
