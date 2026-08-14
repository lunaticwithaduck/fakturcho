export const COMPANY_PLACEHOLDER_MARKER = 'ДЕМО';

export const COMPANY = {
  legalName: '„Примерна Фирма“ ЕООД (ДЕМО)',
  eik: '000000000 (ДЕМО)',
  address: 'гр. София, ул. „Примерна“ 1 (ДЕМО)',
  vatNumber: null as string | null,
  supportEmail: 'support@example.com',
  productName: 'Фактурчо',
  website: 'https://www.fakturcho.com',
  lastUpdated: '14.08.2026',
} as const;

export const PRICING = {
  perDocument: '0,10 €',
  packs: '5 €, 10 € и 25 €',
  subscription: '5 € на месец',
  signupGrant: '1,00 €',
} as const;
