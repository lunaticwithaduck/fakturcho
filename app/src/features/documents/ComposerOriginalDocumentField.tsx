'use client';

import { useListDocumentsQuery } from '@app/api';
import { Select, SelectItem } from '@design/components';
import { formatDocumentTitle } from './documentTitle';

interface ComposerOriginalDocumentFieldProps {
  value: string | null;
  currentDocumentId: string | null;
  hasError: boolean;
  onChange: (value: string) => void;
}

export function ComposerOriginalDocumentField({
  value,
  currentDocumentId,
  hasError,
  onChange,
}: ComposerOriginalDocumentFieldProps) {
  const { data } = useListDocumentsQuery({ pageSize: 100 });
  const options = (data?.items ?? []).filter(
    (document) => document.status !== 'draft' && document.id !== currentDocumentId,
  );

  return (
    <Select
      label="Оригинален документ"
      placeholder="Изберете документ"
      value={value ?? ''}
      onValueChange={onChange}
      {...(hasError ? { error: 'Задължително поле' } : {})}
    >
      {options.map((document) => (
        <SelectItem key={document.id} value={document.id}>
          {formatDocumentTitle(document)} — {document.recipientCompanyName ?? 'Без клиент'}
        </SelectItem>
      ))}
    </Select>
  );
}
