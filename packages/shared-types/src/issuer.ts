import { getCountryConfig } from './countries';

export interface IssuerProfileDto {
  id: string;
  companyName: string | null;
  eik: string | null;
  mol: string | null;
  addressLine: string | null;
  street: string | null;
  postcode: string | null;
  countyRegion: string | null;
  city: string | null;
  country: string;
  phone: string | null;
  vatRegistered: boolean;
  vatNumber: string | null;
  bankName: string | null;
  iban: string | null;
  bic: string | null;
  altIban: string | null;
  peppolEndpointId: string | null;
  peppolScheme: string | null;
  identifiers: Record<string, string>;
  // Codul fiscal art. 282 alin. (3)-(8), art. 319 alin. (20) lit. p): RO cash
  // VAT accounting scheme, printed as "TVA la încasare" when set.
  vatOnCashBasis: boolean;
  // CGI art. 242 nonies A I 17°: FR option for VAT on debits, printed as
  // "Option pour le paiement de la taxe d'après les débits" when set.
  vatOnDebits: boolean;
}

export interface UpdateIssuerProfileRequest {
  companyName?: string | null;
  eik?: string | null;
  mol?: string | null;
  addressLine?: string | null;
  street?: string | null;
  postcode?: string | null;
  countyRegion?: string | null;
  city?: string | null;
  country?: string;
  phone?: string | null;
  vatRegistered?: boolean;
  vatNumber?: string | null;
  bankName?: string | null;
  iban?: string | null;
  bic?: string | null;
  altIban?: string | null;
  peppolEndpointId?: string | null;
  peppolScheme?: string | null;
  identifiers?: Record<string, string>;
  vatOnCashBasis?: boolean;
  vatOnDebits?: boolean;
}

export function isIssuerProfileComplete(profile: IssuerProfileDto | null): boolean {
  if (!profile) return false;
  const fieldValues: Record<string, string | null> = {
    companyName: profile.companyName,
    eik: profile.eik,
    addressLine: profile.addressLine,
    street: profile.street,
    postcode: profile.postcode,
    city: profile.city,
    countyRegion: profile.countyRegion,
    vatNumber: profile.vatNumber,
  };
  const { requiredIssuerFields, identifiers } = getCountryConfig(profile.country);
  const required = requiredIssuerFields.map((field) => fieldValues[field] ?? null);
  for (const field of identifiers) {
    if (field.required) required.push(profile.identifiers[field.key] ?? null);
  }
  if (profile.vatRegistered) required.push(profile.vatNumber);
  return required.every((value) => value !== null && value.trim() !== '');
}
