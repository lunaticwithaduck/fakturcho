import { COMPANY } from '@app/features/legal/company';
import { PUBLISHED_LOCALES } from '@shared/types';

// Same entity on every locale home: Google reads one name per @id, so the
// Latin spelling rides along as alternateName instead of replacing it.
export function buildSiteJsonLd(): string {
  const organization = {
    '@type': 'Organization',
    '@id': `${COMPANY.website}/#organization`,
    name: COMPANY.productName,
    alternateName: 'Fakturcho',
    url: COMPANY.website,
    logo: `${COMPANY.website}/icon.png`,
    email: COMPANY.supportEmail,
  };
  const website = {
    '@type': 'WebSite',
    '@id': `${COMPANY.website}/#website`,
    name: COMPANY.productName,
    alternateName: ['Fakturcho', 'fakturcho.com'],
    url: COMPANY.website,
    inLanguage: [...PUBLISHED_LOCALES],
    publisher: { '@id': `${COMPANY.website}/#organization` },
  };
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [organization, website],
  }).replace(/</g, '\\u003c');
}
