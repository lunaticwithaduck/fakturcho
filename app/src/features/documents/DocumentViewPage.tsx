'use client';

import {
  useCancelDocumentMutation,
  useGetDocumentQuery,
  useMarkDocumentPaidMutation,
} from '@app/api';
import { getApiErrorMessage } from '@app/features/shared/apiError';
import { ConfirmDialog } from '@app/features/shared/ConfirmDialog';
import { EmptyState, Skeleton, toast } from '@design/components';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DocumentActionBar } from './DocumentActionBar';
import { DocumentEmailDialog } from './DocumentEmailDialog';
import { DocumentIssueDialog } from './DocumentIssueDialog';
import { DocumentPdfViewer } from './DocumentPdfViewer';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { formatDocumentTitle } from './documentTitle';

type DialogKind = 'issue' | 'email' | 'cancel' | null;

interface DocumentViewPageProps {
  documentId: string;
  autoOpenIssue: boolean;
}

export function DocumentViewPage({ documentId, autoOpenIssue }: DocumentViewPageProps) {
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
    return <EmptyState title="Документът не е намерен" />;
  }

  const title = formatDocumentTitle(document);

  async function handleMarkPaid() {
    try {
      await markPaid(documentId).unwrap();
      toast({ title: 'Документът е отбелязан като платен' });
    } catch (err) {
      toast({ title: 'Грешка', description: getApiErrorMessage(err), variant: 'danger' });
    }
  }

  async function handleCancelConfirm() {
    try {
      await cancelDocument(documentId).unwrap();
      toast({ title: 'Документът е анулиран' });
      setDialog(null);
    } catch (err) {
      toast({ title: 'Грешка', description: getApiErrorMessage(err), variant: 'danger' });
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        <DocumentStatusBadge status={document.status} />
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

      <DocumentPdfViewer documentId={documentId} title={title} status={document.status} />

      {dialog === 'issue' ? (
        <DocumentIssueDialog
          document={document}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          onIssued={() => {
            toast({ title: 'Документът е издаден' });
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
            toast({ title: 'Имейлът е изпратен' });
            setDialog(null);
          }}
        />
      ) : null}

      {dialog === 'cancel' ? (
        <ConfirmDialog
          title="Анулиране на документ"
          description="Сигурни ли сте, че искате да анулирате документа? Номерът остава запазен и не се преизползва."
          confirmLabel="Анулирай"
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
