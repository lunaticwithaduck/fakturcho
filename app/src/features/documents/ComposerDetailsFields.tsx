'use client';

import { Input } from '@design/components';
import type { DocumentType } from '@shared/types';
import { useTranslations } from 'next-intl';

interface ComposerDetailsFieldsProps {
  documentType: DocumentType;
  referenceNumber: string;
  taxEventAt: string;
  dueAt: string;
  validUntil: string;
  onChange: (patch: {
    referenceNumber?: string;
    taxEventAt?: string;
    dueAt?: string;
    validUntil?: string;
  }) => void;
}

export function ComposerDetailsFields({
  documentType,
  referenceNumber,
  taxEventAt,
  dueAt,
  validUntil,
  onChange,
}: ComposerDetailsFieldsProps) {
  const t = useTranslations('documents');
  const isQuote = documentType === 'quote';
  const isDeliveryNote = documentType === 'delivery_note';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input
        label={t('composer.details.referenceNumber')}
        value={referenceNumber}
        onChange={(event) => onChange({ referenceNumber: event.target.value })}
      />
      {isQuote ? (
        <Input
          label={t('composer.details.validUntil')}
          type="date"
          value={validUntil}
          onChange={(event) => onChange({ validUntil: event.target.value })}
        />
      ) : isDeliveryNote ? null : (
        <>
          <Input
            label={t('composer.details.taxEventAt')}
            type="date"
            value={taxEventAt}
            onChange={(event) => onChange({ taxEventAt: event.target.value })}
          />
          <Input
            label={t('composer.details.dueAt')}
            type="date"
            value={dueAt}
            onChange={(event) => onChange({ dueAt: event.target.value })}
          />
        </>
      )}
    </div>
  );
}
