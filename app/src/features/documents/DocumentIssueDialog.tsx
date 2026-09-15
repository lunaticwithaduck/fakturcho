'use client';

import { useIssueDocumentMutation, useListSeriesQuery } from '@app/api';
import { trackEvent } from '@app/features/shared/analytics';
import { getApiErrorCode, getApiErrorMessage } from '@app/features/shared/apiError';
import { todayIsoDate } from '@app/features/shared/format';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
} from '@design/components';
import { formatDocumentNumber } from '@fakturcho/shared-types';
import type { DocumentDto, Locale } from '@shared/types';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

interface DocumentIssueDialogProps {
  document: DocumentDto;
  onOpenChange: (open: boolean) => void;
  onIssued: () => void;
}

export function DocumentIssueDialog({
  document,
  onOpenChange,
  onIssued,
}: DocumentIssueDialogProps) {
  const t = useTranslations('documents.dialogs.issue');
  const locale = useLocale() as Locale;
  const { data: series } = useListSeriesQuery();
  const [issueDocument, { isLoading }] = useIssueDocumentMutation();
  const [issuedAt, setIssuedAt] = useState(todayIsoDate());
  const [overrideNumber, setOverrideNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorLink, setErrorLink] = useState<{ href: string; label: string } | null>(null);

  const seriesInfo = series?.find((entry) => entry.documentType === document.documentType) ?? null;

  async function handleConfirm() {
    setError(null);
    setErrorLink(null);
    const body = {
      issuedAt,
      ...(seriesInfo?.overridable && overrideNumber.trim()
        ? { overrideNumber: Number(overrideNumber) }
        : {}),
    };
    try {
      await issueDocument({ id: document.id, body }).unwrap();
      trackEvent('document_issued', { documentType: document.documentType });
      onIssued();
    } catch (err) {
      const code = getApiErrorCode(err, locale);
      if (code === 'ISSUER_PROFILE_INCOMPLETE') {
        setErrorLink({ href: '/profile', label: t('profileLink') });
      }
      if (code === 'INSUFFICIENT_CREDITS') {
        setErrorLink({ href: '/billing', label: t('creditsLink') });
      }
      setError(getApiErrorMessage(err, locale));
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogDescription>
          {seriesInfo
            ? t('nextNumber', { number: formatDocumentNumber(seriesInfo.nextNumber) })
            : t('loadingSeries')}
        </DialogDescription>
        <div className="flex flex-col gap-4">
          <Input
            label={t('issuedAtLabel')}
            type="date"
            value={issuedAt}
            onChange={(event) => setIssuedAt(event.target.value)}
          />
          {seriesInfo?.overridable ? (
            <Input
              label={t('overrideNumberLabel')}
              type="number"
              min={1}
              value={overrideNumber}
              onChange={(event) => setOverrideNumber(event.target.value)}
              hint={t('overrideNumberHint')}
            />
          ) : null}
          {error ? (
            <p className="text-sm font-medium text-danger">
              {error}
              {errorLink ? (
                <>
                  {' '}
                  <Link href={errorLink.href} className="underline">
                    {errorLink.label}
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="button" disabled={isLoading} onClick={handleConfirm}>
              {isLoading ? t('issuing') : t('confirm')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
