import { formatDate, formatMoney } from '@app/features/shared/format';
import { Building2, CalendarDays, Card } from '@design/components';
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
      <Card className="flex flex-col gap-3 transition-colors duration-(--duration-fast) hover:bg-surface-sunken">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-text">{title}</p>
          <p className="shrink-0 whitespace-nowrap text-lg font-bold text-text">
            {formatMoney(document.amount)}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-subtle">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden />
              {formatDate(document.issuedAt ?? document.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="size-3.5" aria-hidden />
              {document.recipientCompanyName ?? t('list.noClient')}
            </span>
          </div>
          <DocumentStatusBadge status={document.status} documentType={document.documentType} />
        </div>
      </Card>
    </Link>
  );
}
