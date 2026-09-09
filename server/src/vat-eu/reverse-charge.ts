import { isReverseCharge, type VatCategory } from '@fakturcho/shared-types';

export function resolveLineVatCategory(
  issuerCountry: string,
  clientCountry: string | null,
  requestedCategory?: VatCategory,
): VatCategory {
  if (isReverseCharge(issuerCountry, clientCountry)) return 'AE';
  return requestedCategory ?? 'S';
}
