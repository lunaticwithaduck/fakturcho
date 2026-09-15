import { Button } from '@design/components';
import type { DocumentStatus } from '@shared/types';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface DocumentActionBarProps {
  documentId: string;
  status: DocumentStatus;
  isMarkingPaid: boolean;
  onIssue: () => void;
  onMarkPaid: () => void;
  onCancel: () => void;
  onEmail: () => void;
}

export function DocumentActionBar({
  documentId,
  status,
  isMarkingPaid,
  onIssue,
  onMarkPaid,
  onCancel,
  onEmail,
}: DocumentActionBarProps) {
  const t = useTranslations('documents.actions');

  return (
    <div className="flex flex-wrap gap-3">
      {status === 'draft' ? (
        <>
          <Button variant="secondary" asChild>
            <Link href={`/documents/${documentId}/edit`}>{t('edit')}</Link>
          </Button>
          <Button onClick={onIssue}>{t('issue')}</Button>
        </>
      ) : null}
      {status === 'sent' || status === 'overdue' ? (
        <Button onClick={onMarkPaid} disabled={isMarkingPaid}>
          {isMarkingPaid ? t('markingPaid') : t('markPaid')}
        </Button>
      ) : null}
      {status === 'sent' || status === 'overdue' || status === 'paid' ? (
        <>
          <Button variant="secondary" onClick={onEmail}>
            {t('email')}
          </Button>
          <Button variant="danger" onClick={onCancel}>
            {t('cancel')}
          </Button>
        </>
      ) : null}
    </div>
  );
}
