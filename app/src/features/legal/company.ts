import type { Locale } from '@shared/types';
import {
  CREDIT_PACKS,
  ISSUANCE_COST_CENTS,
  SIGNUP_GRANT_CENTS,
  SUBSCRIPTION_TIERS,
} from '@shared/types';

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
  lastUpdated: '15.09.2026',
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

// Same Intl tags format.ts uses for money/date rendering — kept local since
// this generates sentence-level pricing strings, not formatted amounts.
const PRICING_INTL_TAGS: Partial<Record<Locale, string>> = {
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  pl: 'pl-PL',
  ro: 'ro-RO',
  es: 'es-ES',
};

const SUBSCRIPTION_PERIOD_WORD: Partial<Record<Locale, string>> = {
  de: 'pro Monat',
  fr: 'par mois',
  it: 'al mese',
  pl: 'miesięcznie',
  ro: 'pe lună',
  es: 'al mes',
};

function eurAmount(tag: string, cents: number, fractionDigits: number): string {
  return new Intl.NumberFormat(tag, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(cents / 100);
}

interface PricingStrings {
  perDocument: string;
  packs: string;
  subscription: string;
  signupGrant: string;
}

function pricingForTag(locale: Locale, tag: string): PricingStrings {
  const list = new Intl.ListFormat(tag, { style: 'long', type: 'conjunction' });
  const packAmounts = Object.values(CREDIT_PACKS).map((pack) => eurAmount(tag, pack.eurCents, 0));
  const tierAmounts = Object.values(SUBSCRIPTION_TIERS).map((tier) =>
    eurAmount(tag, tier.priceCents, 0),
  );
  const period = SUBSCRIPTION_PERIOD_WORD[locale] ?? '';
  return {
    perDocument: eurAmount(tag, ISSUANCE_COST_CENTS, 2),
    packs: list.format(packAmounts),
    subscription: `${list.format(tierAmounts)} ${period}`.trim(),
    signupGrant: eurAmount(tag, SIGNUP_GRANT_CENTS, 2),
  };
}

export function pricingForLocale(locale: Locale): PricingStrings {
  if (locale === 'bg') return PRICING;
  const tag = PRICING_INTL_TAGS[locale];
  return tag ? pricingForTag(locale, tag) : PRICING_EN;
}
