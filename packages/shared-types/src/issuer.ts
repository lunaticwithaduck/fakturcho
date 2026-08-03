export interface IssuerProfileDto {
  id: string;
  companyName: string | null;
  eik: string | null;
  mol: string | null;
  addressLine: string | null;
  city: string | null;
  phone: string | null;
  vatRegistered: boolean;
  vatNumber: string | null;
  bankName: string | null;
  iban: string | null;
  bic: string | null;
  altIban: string | null;
}

export interface UpdateIssuerProfileRequest {
  companyName?: string | null;
  eik?: string | null;
  mol?: string | null;
  addressLine?: string | null;
  city?: string | null;
  phone?: string | null;
  vatRegistered?: boolean;
  vatNumber?: string | null;
  bankName?: string | null;
  iban?: string | null;
  bic?: string | null;
  altIban?: string | null;
}

export function isIssuerProfileComplete(profile: IssuerProfileDto | null): boolean {
  if (!profile) return false;
  const required = [profile.companyName, profile.eik, profile.addressLine, profile.city];
  if (profile.vatRegistered) required.push(profile.vatNumber);
  return required.every((value) => value !== null && value.trim() !== '');
}
