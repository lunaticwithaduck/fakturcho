import { formatDate, formatMoney } from '@app/features/shared/format';
import { Card } from '@design/components';
import type { DocumentListItemDto, Locale } from '@shared/types';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { formatDocumentTitle } from './documentTitle';

interface DocumentListItemCardProps {
  document: DocumentListItemDto;
}

export function DocumentListItemCard({ document }: DocumentListItemCardProps) {
  const t = useTranslations('documents');
  const locale = useLocale() as Locale;
  const title = formatDocumentTitle(document, (key, values) => t(`title.${key}`, values), locale);

  return (
    <Link href={`/documents/${document.id}`}>
      <Card className="flex flex-col gap-2 transition-colors duration-(--duration-fast) hover:bg-surface-sunken">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-text">{title}</p>
          <DocumentStatusBadge status={document.status} />
        </div>
        <p className="text-sm text-text-muted">
          {document.recipientCompanyName ?? t('list.noClient')}
        </p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-text-subtle">
            {formatDate(document.issuedAt ?? document.createdAt)}
          </p>
          <p className="text-sm font-semibold text-text">{formatMoney(document.amount)}</p>
        </div>
      </Card>
    </Link>
  );
}
