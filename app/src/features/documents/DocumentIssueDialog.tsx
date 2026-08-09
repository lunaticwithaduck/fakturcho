'use client';

import { useIssueDocumentMutation, useListSeriesQuery } from '@app/api';
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
import type { DocumentDto } from '@shared/types';
import Link from 'next/link';
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
      onIssued();
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'ISSUER_PROFILE_INCOMPLETE') {
        setErrorLink({ href: '/profile', label: 'Към профила на издателя' });
      }
      if (code === 'INSUFFICIENT_CREDITS') {
        setErrorLink({ href: '/billing', label: 'Купи кредити' });
      }
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Издаване на документ</DialogTitle>
        <DialogDescription>
          {seriesInfo
            ? `Следващ номер в поредицата: ${formatDocumentNumber(seriesInfo.nextNumber)}`
            : 'Зареждане на поредицата...'}
        </DialogDescription>
        <div className="flex flex-col gap-4">
          <Input
            label="Дата на издаване"
            type="date"
            value={issuedAt}
            onChange={(event) => setIssuedAt(event.target.value)}
          />
          {seriesInfo?.overridable ? (
            <Input
              label="Замени следващия номер (по избор)"
              type="number"
              min={1}
              value={overrideNumber}
              onChange={(event) => setOverrideNumber(event.target.value)}
              hint="Разрешено само докато поредицата няма издадени документи."
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
              Отказ
            </Button>
            <Button type="button" disabled={isLoading} onClick={handleConfirm}>
              {isLoading ? 'Издаване...' : 'Издай'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
