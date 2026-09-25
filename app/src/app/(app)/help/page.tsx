import { HelpPage } from '@app/features/help/HelpPage';
import { getHelpContent } from '@app/features/help/registry';
import type { Locale } from '@shared/types';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const content = getHelpContent(locale);
  const t = await getTranslations('help');
  return {
    title: content?.title ?? t('pageTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function HelpRoute() {
  const locale = (await getLocale()) as Locale;
  const content = getHelpContent(locale);
  const [tHelp, tGuides] = await Promise.all([getTranslations('help'), getTranslations('guides')]);

  return (
    <HelpPage
      content={content}
      chrome={{
        pageTitle: tHelp('pageTitle'),
        tocLabel: tGuides('tableOfContents'),
        emptyTitle: tHelp('emptyTitle'),
        emptyDescription: tHelp('emptyDescription'),
      }}
    />
  );
}
