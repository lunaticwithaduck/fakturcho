'use client';

import {
  useCancelDocumentMutation,
  useGetDocumentQuery,
  useMarkDocumentPaidMutation,
} from '@app/api';
import { getApiErrorMessage } from '@app/features/shared/apiError';
import { ConfirmDialog } from '@app/features/shared/ConfirmDialog';
import { EmptyState, Skeleton, toast } from '@design/components';
import type { Locale } from '@shared/types';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { DocumentActionBar } from './DocumentActionBar';
import { DocumentEmailDialog } from './DocumentEmailDialog';
import { DocumentIssueDialog } from './DocumentIssueDialog';
import { DocumentPdfViewer } from './DocumentPdfViewer';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { formatDocumentTitle } from './documentTitle';
import { EinvoicePanel } from './EinvoicePanel';

type DialogKind = 'issue' | 'email' | 'cancel' | null;

interface DocumentViewPageProps {
  documentId: string;
  autoOpenIssue: boolean;
}

export function DocumentViewPage({ documentId, autoOpenIssue }: DocumentViewPageProps) {
  const t = useTranslations('documents');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { data: document, isLoading } = useGetDocumentQuery(documentId);
  const [cancelDocument, { isLoading: isCancelling }] = useCancelDocumentMutation();
  const [markPaid, { isLoading: isMarkingPaid }] = useMarkDocumentPaidMutation();
  const [dialog, setDialog] = useState<DialogKind>(autoOpenIssue ? 'issue' : null);

  useEffect(() => {
    if (autoOpenIssue) router.replace(`/documents/${documentId}`);
  }, [autoOpenIssue, documentId, router]);

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-160 w-full" />
      </div>
    );
  }

  if (!document) {
    return <EmptyState title={t('view.notFound')} />;
  }

  const title = formatDocumentTitle(document, (key, values) => t(`title.${key}`, values), locale);

  async function handleMarkPaid() {
    try {
      await markPaid(documentId).unwrap();
      toast({ title: t('view.markedPaidToast') });
    } catch (err) {
      toast({
        title: t('view.errorToastTitle'),
        description: getApiErrorMessage(err, locale),
        variant: 'danger',
      });
    }
  }

  async function handleCancelConfirm() {
    try {
      await cancelDocument(documentId).unwrap();
      toast({ title: t('view.cancelledToast') });
      setDialog(null);
    } catch (err) {
      toast({
        title: t('view.errorToastTitle'),
        description: getApiErrorMessage(err, locale),
        variant: 'danger',
      });
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        <DocumentStatusBadge status={document.status} documentType={document.documentType} />
      </div>

      <DocumentActionBar
        documentId={documentId}
        status={document.status}
        isMarkingPaid={isMarkingPaid}
        onIssue={() => setDialog('issue')}
        onMarkPaid={handleMarkPaid}
        onCancel={() => setDialog('cancel')}
        onEmail={() => setDialog('email')}
      />

      <EinvoicePanel
        documentId={documentId}
        documentType={document.documentType}
        status={document.status}
        issuerCountry={document.issuer.country}
        ksefNumber={document.ksefNumber}
        issuedAt={document.issuedAt}
      />

      <DocumentPdfViewer
        documentId={documentId}
        title={title}
        status={document.status}
        updatedAt={document.updatedAt}
      />

      {dialog === 'issue' ? (
        <DocumentIssueDialog
          document={document}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          onIssued={() => {
            toast({ title: t('view.issuedToast') });
            setDialog(null);
          }}
        />
      ) : null}

      {dialog === 'email' ? (
        <DocumentEmailDialog
          document={document}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          onSent={() => {
            toast({ title: t('view.emailSentToast') });
            setDialog(null);
          }}
        />
      ) : null}

      {dialog === 'cancel' ? (
        <ConfirmDialog
          title={t('dialogs.cancel.title')}
          description={t('dialogs.cancel.description')}
          confirmLabel={t('dialogs.cancel.confirm')}
          isConfirming={isCancelling}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          onConfirm={handleCancelConfirm}
        />
      ) : null}
    </div>
  );
}
