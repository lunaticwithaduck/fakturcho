import { guideForLocale, guideHref } from '@app/features/guides/registry';
import { Button } from '@design/components';
import type { Locale } from '@shared/types';
import Link from 'next/link';

interface HeroGuideLinkProps {
  locale: Locale;
  label: string;
}

export function HeroGuideLink({ locale, label }: HeroGuideLinkProps) {
  const guide = guideForLocale(locale);
  if (!guide) return null;
  return (
    <Button variant="secondary" size="sm" asChild>
      <Link href={guideHref(guide)}>{label}</Link>
    </Button>
  );
}
