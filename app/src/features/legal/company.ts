export const COMPANY_PLACEHOLDER_MARKER = 'ДЕМО';

interface CompanyDetails {
  legalName: string;
  eik: string | null;
  address: string;
  vatNumber: string | null;
  supportEmail: string;
  productName: string;
  website: string;
  lastUpdated: string;
}

export const COMPANY: CompanyDetails = {
  legalName: '„Пачелиев Консултинг“ ЕООД',
  eik: '208697044',
  address: 'гр. София 1324, р-н Люлин, жк. Люлин, бл. 715, вх. Б, ет. 1, ап. 21',
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

export const PRICING = {
  perDocument: '0,10 €',
  packs: '5 €, 10 € и 25 €',
  subscription: '5 € на месец',
  signupGrant: '1,00 €',
} as const;
