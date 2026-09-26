import { getCountryConfig } from '@fakturcho/shared-types';
import type { IssuerProfileDto } from '@shared/types';

export type MissingIssuerField =
  | 'companyName'
  | 'eik'
  | 'addressLine'
  | 'street'
  | 'postcode'
  | 'city'
  | 'countyRegion'
  | 'vatNumber'
  | `identifier:${string}`;

function isBlank(value: string | null | undefined): boolean {
  return !value || value.trim() === '';
}

export function getMissingIssuerFields(profile: IssuerProfileDto): MissingIssuerField[] {
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
  const missing = requiredIssuerFields
    .filter((field) => isBlank(fieldValues[field] ?? null))
    .map((field) => field as MissingIssuerField);
  for (const field of identifiers) {
    if (field.required && isBlank(profile.identifiers[field.key])) {
      missing.push(`identifier:${field.key}`);
    }
  }
  if (profile.vatRegistered && isBlank(profile.vatNumber) && !missing.includes('vatNumber')) {
    missing.push('vatNumber');
  }
  // § 37a HGB, § 35a GmbHG: Registergericht and Sitz become required once a
  // Handelsregisternummer (eik) is entered.
  if (profile.country === 'DE' && !isBlank(profile.eik)) {
    if (isBlank(profile.identifiers.registergericht)) missing.push('identifier:registergericht');
    if (isBlank(profile.identifiers.sitz)) missing.push('identifier:sitz');
  }
  // UGB § 14 Abs. 1: Firmenbuchgericht and Sitz become required once a
  // Firmenbuchnummer (eik) is entered.
  if (profile.country === 'AT' && !isBlank(profile.eik)) {
    if (isBlank(profile.identifiers.firmenbuchgericht))
      missing.push('identifier:firmenbuchgericht');
    if (isBlank(profile.identifiers.sitz)) missing.push('identifier:sitz');
  }
  return missing;
}
