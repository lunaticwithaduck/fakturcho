import { Card } from '@design/components';
import { getCountryConfig } from '@fakturcho/shared-types';
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

  const { identifiers } = getCountryConfig(profile.country);
  const missingLabels = missing.map((field) => {
    if (field.startsWith('identifier:')) {
      const key = field.slice('identifier:'.length);
      return identifiers.find((entry) => entry.key === key)?.label ?? key;
    }
    return t(`completenessHint.fields.${field}`);
  });

  return (
    <Card className="flex flex-col gap-1 border-warning-border bg-warning-subtle">
      <p className="text-sm font-semibold text-warning">{t('completenessHint.title')}</p>
      <p className="text-sm text-text-muted">
        {t('completenessHint.body', { fields: missingLabels.join(', ') })}
      </p>
    </Card>
  );
}
