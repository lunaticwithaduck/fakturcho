import { getCountryConfig, isReverseCharge, type VatCategory } from '@fakturcho/shared-types';

export function hasValidVatNumberFormat(
  vatNumber: string | null | undefined,
  country: string,
): boolean {
  const trimmed = vatNumber?.trim();
  if (!trimmed) return false;
  const pattern = getCountryConfig(country).vatNumberPattern;
  return pattern ? pattern.test(trimmed) : true;
}

export function resolveLineVatCategory(
  issuerCountry: string,
  clientCountry: string | null,
  requestedCategory?: VatCategory,
  clientHasValidVatNumber = true,
): VatCategory {
  if (clientHasValidVatNumber && isReverseCharge(issuerCountry, clientCountry)) return 'AE';
  return requestedCategory ?? 'S';
}
