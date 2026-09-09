'use client';

import { Button } from '@design/components';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface ComposerActionsProps {
  isSubmitting: boolean;
  onSaveAndIssue: () => void;
}

export function ComposerActions({ isSubmitting, onSaveAndIssue }: ComposerActionsProps) {
  const t = useTranslations('documents');

  return (
    <div className="flex flex-wrap gap-3">
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('composer.actions.saving') : t('composer.actions.saveDraft')}
      </Button>
      <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onSaveAndIssue}>
        {t('composer.actions.saveAndIssue')}
      </Button>
      <Button type="button" variant="ghost" disabled={isSubmitting} asChild>
        <Link href="/documents">{t('composer.actions.cancel')}</Link>
      </Button>
    </div>
  );
}
