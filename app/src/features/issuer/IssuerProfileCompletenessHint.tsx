import { ArrowRight, Button, Card, CircleAlert, Store } from '@design/components';
import { companyIdLabelFor, getCountryConfig, type Locale } from '@fakturcho/shared-types';
import type { IssuerProfileDto } from '@shared/types';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { getMissingIssuerFields } from './issuerCompleteness';

interface IssuerProfileCompletenessHintProps {
  profile: IssuerProfileDto;
  showProfileLink?: boolean;
}

export function IssuerProfileCompletenessHint({
  profile,
  showProfileLink,
}: IssuerProfileCompletenessHintProps) {
  const t = useTranslations('issuer');
  const locale = useLocale() as Locale;
  const missing = getMissingIssuerFields(profile);
  if (missing.length === 0) return null;

  const { identifiers, countyRegion } = getCountryConfig(profile.country);
  const companyIdLabel = companyIdLabelFor(profile.country, locale);
  const missingLabels = missing.map((field) => {
    if (field.startsWith('identifier:')) {
      const key = field.slice('identifier:'.length);
      return identifiers.find((entry) => entry.key === key)?.label ?? key;
    }
    if (field === 'countyRegion' && countyRegion) return countyRegion.label;
    if (field === 'eik') return companyIdLabel;
    return t(`completenessHint.fields.${field}`);
  });

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-subtle">
            <Store className="size-5 text-accent" aria-hidden />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-text">{t('completenessHint.welcomeTitle')}</p>
            <p className="text-sm text-text-muted">{t('completenessHint.welcomeBody')}</p>
          </div>
        </div>
        {showProfileLink ? (
          <Button asChild variant="secondary" size="sm">
            <Link href="/profile">
              {t('completenessHint.completeSetup')}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="text-sm font-medium text-text-muted">
          {t('completenessHint.missingFieldsLabel')}
        </p>
        <div className="flex flex-wrap gap-2">
          {missing.map((field, index) => (
            <span
              key={field}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-sunken px-2.5 py-1 text-xs font-medium text-text-muted"
            >
              <CircleAlert className="size-3.5 text-warning" aria-hidden />
              {missingLabels[index]}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
