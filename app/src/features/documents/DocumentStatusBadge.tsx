import { Badge } from '@design/components';
import { getDocumentStatusLabel } from '@fakturcho/shared-types';
import type { DocumentStatus, DocumentType, Locale } from '@shared/types';
import { useLocale } from 'next-intl';
import { getStatusBadgeVariant, getStatusIcon } from './statusBadge';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  documentType?: DocumentType;
}

export function DocumentStatusBadge({ status, documentType }: DocumentStatusBadgeProps) {
  const locale = useLocale() as Locale;
  const Icon = getStatusIcon(status);

  return (
    <Badge variant={getStatusBadgeVariant(status)}>
      <Icon className="size-3.5" aria-hidden />
      {getDocumentStatusLabel(status, locale, documentType)}
    </Badge>
  );
}
