'use client';

import { Textarea } from '@design/components';
import { useTranslations } from 'next-intl';

interface ComposerCorrectionReasonFieldProps {
  value: string;
  required: boolean;
  onChange: (value: string) => void;
}

export function ComposerCorrectionReasonField({
  value,
  required,
  onChange,
}: ComposerCorrectionReasonFieldProps) {
  const t = useTranslations('documents');

  return (
    <Textarea
      label={t('composer.correctionReason.label')}
      value={value}
      rows={2}
      onChange={(event) => onChange(event.target.value)}
      {...(required ? { hint: t('composer.correctionReason.requiredHint') } : {})}
    />
  );
}
