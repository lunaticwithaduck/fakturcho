import { getCountryConfig } from '@fakturcho/shared-types';
import type { IssuerProfileDto } from '@shared/types';

export type MissingIssuerField =
  | 'companyName'
  | 'eik'
  | 'addressLine'
  | 'street'
  | 'postcode'
  | 'city'
  | 'vatNumber';

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
  };
  const { requiredIssuerFields } = getCountryConfig(profile.country);
  const missing = requiredIssuerFields
    .filter((field) => isBlank(fieldValues[field] ?? null))
    .map((field) => field as MissingIssuerField);
  if (profile.vatRegistered && isBlank(profile.vatNumber)) missing.push('vatNumber');
  return missing;
}
