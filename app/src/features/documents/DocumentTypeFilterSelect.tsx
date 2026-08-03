'use client';

import { Select, SelectItem } from '@design/components';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPES } from '@fakturcho/shared-types';
import type { DocumentType } from '@shared/types';

const ALL_VALUE = 'all';

interface DocumentTypeFilterSelectProps {
  value: DocumentType | 'all';
  onChange: (value: DocumentType | 'all') => void;
}

export function DocumentTypeFilterSelect({ value, onChange }: DocumentTypeFilterSelectProps) {
  return (
    <Select
      label="Вид документ"
      value={value}
      onValueChange={(next) => onChange(next as DocumentType | 'all')}
    >
      <SelectItem value={ALL_VALUE}>Всички видове</SelectItem>
      {DOCUMENT_TYPES.map((type) => (
        <SelectItem key={type} value={type}>
          {DOCUMENT_TYPE_LABELS[type]}
        </SelectItem>
      ))}
    </Select>
  );
}
