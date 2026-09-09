'use client';

import { Select, SelectItem } from '@design/components';
import { DOCUMENT_TYPES, getDocumentTypeLabel } from '@fakturcho/shared-types';
import type { DocumentType, Locale } from '@shared/types';
import { useLocale, useTranslations } from 'next-intl';

const ALL_VALUE = 'all';

interface DocumentTypeFilterSelectProps {
  value: DocumentType | 'all';
  onChange: (value: DocumentType | 'all') => void;
}

export function DocumentTypeFilterSelect({ value, onChange }: DocumentTypeFilterSelectProps) {
  const t = useTranslations('documents.list');
  const locale = useLocale() as Locale;

  return (
    <Select
      label={t('typeFilterLabel')}
      value={value}
      onValueChange={(next) => onChange(next as DocumentType | 'all')}
    >
      <SelectItem value={ALL_VALUE}>{t('allTypes')}</SelectItem>
      {DOCUMENT_TYPES.map((type) => (
        <SelectItem key={type} value={type}>
          {getDocumentTypeLabel(type, locale)}
        </SelectItem>
      ))}
    </Select>
  );
}
