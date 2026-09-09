'use client';

import { useListDocumentsQuery } from '@app/api';
import { Select, SelectItem } from '@design/components';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('documents');
  const { data } = useListDocumentsQuery({ pageSize: 100 });
  const options = (data?.items ?? []).filter(
    (document) => document.status !== 'draft' && document.id !== currentDocumentId,
  );

  return (
    <Select
      label={t('composer.originalDocument.label')}
      placeholder={t('composer.originalDocument.placeholder')}
      value={value ?? ''}
      onValueChange={onChange}
      {...(hasError ? { error: t('composer.requiredField') } : {})}
    >
      {options.map((document) => (
        <SelectItem key={document.id} value={document.id}>
          {formatDocumentTitle(document)} —{' '}
          {document.recipientCompanyName ?? t('composer.originalDocument.noClient')}
        </SelectItem>
      ))}
    </Select>
  );
}
