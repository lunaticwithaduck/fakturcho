'use client';

import {
  getEinvoiceXmlUrl,
  useGetEinvoiceReadinessQuery,
  useGetEinvoiceTransmissionQuery,
  useSendEinvoicePeppolMutation,
} from '@app/api';
import { getApiErrorMessage } from '@app/features/shared/apiError';
import { Badge, Button } from '@design/components';
import type { ClientDto, DocumentStatus, Locale } from '@shared/types';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { canDownloadDocument } from './documentDownload';
import { getPeppolStatusBadgeVariant, getPeppolStatusMessageKey } from './peppolStatus';

interface EinvoicePanelProps {
  documentId: string;
  status: DocumentStatus;
  client: ClientDto | undefined;
}

export function EinvoicePanel({ documentId, status, client }: EinvoicePanelProps) {
  const t = useTranslations('documents.peppol');
  const locale = useLocale() as Locale;
  const isIssued = canDownloadDocument(status);
  const { data: readiness } = useGetEinvoiceReadinessQuery(documentId, { skip: !isIssued });
  const { data: transmission } = useGetEinvoiceTransmissionQuery(documentId, {
    skip: !isIssued,
  });
  const [sendPeppol, { isLoading: isSending }] = useSendEinvoicePeppolMutation();
  const [sendError, setSendError] = useState<string | null>(null);

  if (!isIssued) return null;

  async function handleSend() {
    setSendError(null);
    try {
      await sendPeppol(documentId).unwrap();
    } catch (err) {
      setSendError(getApiErrorMessage(err, locale));
    }
  }

  const canSendPeppol = Boolean(client?.peppolEndpointId && client?.peppolScheme);

  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" size="sm" asChild className="self-start">
        <a href={getEinvoiceXmlUrl(documentId)} download>
          {t('downloadXml')}
        </a>
      </Button>

      {readiness && !readiness.ready ? (
        <p className="text-sm text-text-muted">
          {t('notReadyHint', { fields: readiness.missingFields.join(', ') })}
        </p>
      ) : null}

      {canSendPeppol ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleSend} disabled={isSending}>
            {isSending ? t('sending') : t('send')}
          </Button>
          {transmission ? (
            <Badge variant={getPeppolStatusBadgeVariant(transmission.status)}>
              {t(getPeppolStatusMessageKey(transmission.status))}
            </Badge>
          ) : null}
        </div>
      ) : null}

      {transmission?.errorText ? (
        <p className="text-sm font-medium text-danger">{transmission.errorText}</p>
      ) : null}
      {sendError ? <p className="text-sm font-medium text-danger">{sendError}</p> : null}
    </div>
  );
}
