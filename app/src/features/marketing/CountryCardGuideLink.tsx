import { guideForTargetCountry, guideHref } from '@app/features/guides/registry';
import Link from 'next/link';
import type { TargetCountry } from './targetCountries';

interface CountryCardGuideLinkProps {
  country: TargetCountry;
  label: string;
}

export function CountryCardGuideLink({ country, label }: CountryCardGuideLinkProps) {
  const guide = guideForTargetCountry(country);
  if (!guide) return null;
  return (
    <Link href={guideHref(guide)} className="text-sm text-text-muted underline">
      {label}
    </Link>
  );
}
