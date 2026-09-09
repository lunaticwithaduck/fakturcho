'use client';

import { Select, SelectItem } from '@design/components';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPES } from '@fakturcho/shared-types';
import type { DocumentType } from '@shared/types';
import { useTranslations } from 'next-intl';

const ALL_VALUE = 'all';

interface DocumentTypeFilterSelectProps {
  value: DocumentType | 'all';
  onChange: (value: DocumentType | 'all') => void;
}

export function DocumentTypeFilterSelect({ value, onChange }: DocumentTypeFilterSelectProps) {
  const t = useTranslations('documents.list');

  return (
    <Select
      label={t('typeFilterLabel')}
      value={value}
      onValueChange={(next) => onChange(next as DocumentType | 'all')}
    >
      <SelectItem value={ALL_VALUE}>{t('allTypes')}</SelectItem>
      {DOCUMENT_TYPES.map((type) => (
        <SelectItem key={type} value={type}>
          {DOCUMENT_TYPE_LABELS[type]}
        </SelectItem>
      ))}
    </Select>
  );
}
