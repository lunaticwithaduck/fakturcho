'use client';

import { Select, SelectItem } from '@design/components';
import { DOCUMENT_TYPES, getDocumentTypeLabel } from '@fakturcho/shared-types';
import type { DocumentType, Locale } from '@shared/types';
import { useLocale, useTranslations } from 'next-intl';

interface ComposerDocumentTypeFieldProps {
  value: DocumentType;
  onChange: (value: DocumentType) => void;
}

export function ComposerDocumentTypeField({ value, onChange }: ComposerDocumentTypeFieldProps) {
  const t = useTranslations('documents');
  const locale = useLocale() as Locale;

  return (
    <Select
      label={t('composer.documentType.label')}
      value={value}
      onValueChange={(next) => onChange(next as DocumentType)}
    >
      {DOCUMENT_TYPES.map((type) => (
        <SelectItem key={type} value={type}>
          {getDocumentTypeLabel(type, locale)}
        </SelectItem>
      ))}
    </Select>
  );
}
