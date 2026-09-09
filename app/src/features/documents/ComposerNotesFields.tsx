'use client';

import { Input, Textarea } from '@design/components';
import { useTranslations } from 'next-intl';

interface ComposerNotesFieldsProps {
  notes: string;
  preparedBy: string;
  onChange: (patch: { notes?: string; preparedBy?: string }) => void;
}

export function ComposerNotesFields({ notes, preparedBy, onChange }: ComposerNotesFieldsProps) {
  const t = useTranslations('documents');

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        label={t('composer.notes.notesLabel')}
        value={notes}
        onChange={(event) => onChange({ notes: event.target.value })}
      />
      <Input
        label={t('composer.notes.preparedByLabel')}
        value={preparedBy}
        onChange={(event) => onChange({ preparedBy: event.target.value })}
      />
    </div>
  );
}
