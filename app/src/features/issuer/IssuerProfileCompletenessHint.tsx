import { Card } from '@design/components';
import type { IssuerProfileDto } from '@shared/types';
import { useTranslations } from 'next-intl';
import { getMissingIssuerFields } from './issuerCompleteness';

interface IssuerProfileCompletenessHintProps {
  profile: IssuerProfileDto;
}

export function IssuerProfileCompletenessHint({ profile }: IssuerProfileCompletenessHintProps) {
  const t = useTranslations('issuer');
  const missing = getMissingIssuerFields(profile);
  if (missing.length === 0) return null;

  const missingLabels = missing.map((field) => t(`completenessHint.fields.${field}`));

  return (
    <Card className="flex flex-col gap-1 border-warning-border bg-warning-subtle">
      <p className="text-sm font-semibold text-warning">{t('completenessHint.title')}</p>
      <p className="text-sm text-text-muted">
        {t('completenessHint.body', { fields: missingLabels.join(', ') })}
      </p>
    </Card>
  );
}
