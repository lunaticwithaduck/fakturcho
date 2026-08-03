import type { IssuerProfileDto } from '@shared/types';

function isBlank(value: string | null | undefined): boolean {
  return !value || value.trim() === '';
}

export function getMissingIssuerFields(profile: IssuerProfileDto): string[] {
  const missing: string[] = [];
  if (isBlank(profile.companyName)) missing.push('Фирма');
  if (isBlank(profile.eik)) missing.push('ЕИК / Булстат');
  if (isBlank(profile.addressLine)) missing.push('Адрес');
  if (isBlank(profile.city)) missing.push('Град');
  if (profile.vatRegistered && isBlank(profile.vatNumber)) missing.push('ДДС номер');
  return missing;
}
