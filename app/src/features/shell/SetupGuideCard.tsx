'use client';

import { Button, Card, Sprout } from '@design/components';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function SetupGuideCard() {
  const t = useTranslations('shell');

  return (
    <Card className="mt-4 flex flex-col gap-3 bg-surface p-4 shadow-none">
      <span className="flex size-9 items-center justify-center rounded-full bg-accent-subtle">
        <Sprout className="size-4 text-accent" aria-hidden />
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-text">{t('guideCard.title')}</p>
        <p className="text-sm text-text-muted">{t('guideCard.body')}</p>
      </div>
      <Button asChild variant="secondary" size="sm">
        <Link href="/help">{t('helpLink')}</Link>
      </Button>
    </Card>
  );
}
