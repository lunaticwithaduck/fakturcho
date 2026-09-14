import type { Locale } from '@shared/types';

export const COMPANY_PLACEHOLDER_MARKER = 'ДЕМО';

interface CompanyDetails {
  legalName: string;
  legalNameLatin: string;
  eik: string | null;
  address: string;
  addressLatin: string;
  vatNumber: string | null;
  supportEmail: string;
  productName: string;
  website: string;
  lastUpdated: string;
}

export const COMPANY: CompanyDetails = {
  legalName: '„Пачелиев Консултинг“ ЕООД',
  legalNameLatin: 'Pacheliev Consulting EOOD',
  eik: '208697044',
  address: 'гр. София 1324, р-н Люлин, жк. Люлин, бл. 715, вх. Б, ет. 1, ап. 21',
  addressLatin: 'Sofia 1324, Lyulin district, bl. 715, entr. B, fl. 1, apt. 21, Bulgaria',
  vatNumber: null,
  supportEmail: 'support@fakturcho.com',
  productName: 'Фактурчо',
  website: 'https://www.fakturcho.com',
  lastUpdated: '14.08.2026',
};

export function describeEntity(): string {
  const identifier = COMPANY.eik === null ? '' : `, ЕИК ${COMPANY.eik}`;
  return `${COMPANY.legalName}${identifier}, ${COMPANY.address}`;
}

export function describeEntityForLocale(locale: Locale): string {
  if (locale === 'bg') return describeEntity();
  const identifier = COMPANY.eik === null ? '' : `, UIC ${COMPANY.eik}`;
  return `${COMPANY.legalNameLatin}${identifier}, ${COMPANY.addressLatin}`;
}

export function productNameForLocale(locale: Locale): string {
  return locale === 'bg' ? COMPANY.productName : 'Fakturcho';
}

export const PRICING = {
  perDocument: '0,10 €',
  packs: '5 €, 10 € и 25 €',
  subscription: '5, 10 или 25 € на месец',
  signupGrant: '1,00 €',
} as const;

export const PRICING_EN = {
  perDocument: '0.10 €',
  packs: '5 €, 10 € and 25 €',
  subscription: '5, 10 or 25 € per month',
  signupGrant: '1.00 €',
} as const;

export function pricingForLocale(locale: Locale): typeof PRICING | typeof PRICING_EN {
  return locale === 'bg' ? PRICING : PRICING_EN;
}
