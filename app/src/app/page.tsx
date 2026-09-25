import { getFeatureFlags } from '@app/feature-flags';
import { LandingPage } from '@app/features/marketing/LandingPage';
import { buildSiteJsonLd } from '@app/features/marketing/siteJsonLd';
import { hreflangAlternates } from '@app/i18n/localeRedirect';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: { absolute: 'Фактурчо — фактури за българския бизнес' },
  description:
    'Издавайте фактури, проформи, кредитни и дебитни известия и оферти по българските изисквания. Плащате 0,10 € на издаден документ.',
  alternates: {
    canonical: '/',
    languages: hreflangAlternates('/'),
  },
};

export default async function HomePage() {
  const store = await cookies();
  if (store.getAll().some((entry) => entry.name.endsWith('session_token'))) {
    redirect('/documents');
  }
  const flags = await getFeatureFlags();
  return (
    <>
      <script type="application/ld+json">{buildSiteJsonLd()}</script>
      <LandingPage enEnabled={flags.EN_LOCALE} />
    </>
  );
}
