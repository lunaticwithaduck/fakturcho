'use client';

import { useSetDocumentKsefNumberMutation } from '@app/api';
import { getApiErrorMessage } from '@app/features/shared/apiError';
import { Button, Input, toast } from '@design/components';
import { isValidKsefNumber } from '@fakturcho/shared-types';
import type { Locale } from '@shared/types';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

interface KsefNumberFieldProps {
  documentId: string;
  ksefNumber: string | null;
}

export function KsefNumberField({ documentId, ksefNumber }: KsefNumberFieldProps) {
  const t = useTranslations('documents.einvoice');
  const locale = useLocale() as Locale;
  const [value, setValue] = useState(ksefNumber ?? '');
  const [setKsefNumber, { isLoading }] = useSetDocumentKsefNumberMutation();
  const trimmed = value.trim();
  const formatError = trimmed !== '' && !isValidKsefNumber(trimmed) ? t('ksefNumberInvalid') : null;

  async function handleSave() {
    if (formatError) return;
    try {
      await setKsefNumber({ id: documentId, ksefNumber: trimmed || null }).unwrap();
      toast({ title: t('ksefNumberSaved') });
    } catch (err) {
      toast({
        title: t('ksefNumberSaveError'),
        description: getApiErrorMessage(err, locale),
        variant: 'danger',
      });
    }
  }

  return (
    <div className="flex items-end gap-2">
      <Input
        label={t('ksefNumberLabel')}
        hint={t('ksefNumberHint')}
        {...(formatError ? { error: formatError } : {})}
        size="sm"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="0000000000-20260926-000000000000-00"
      />
      <Button
        variant="secondary"
        size="sm"
        onClick={handleSave}
        disabled={isLoading || formatError !== null}
      >
        {t('ksefNumberSave')}
      </Button>
    </div>
  );
}
