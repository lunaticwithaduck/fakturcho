import type { IssuerProfileDto } from '@fakturcho/shared-types';
import type { IssuerProfile as PrismaIssuerProfile } from '@prisma/client';

export function toIssuerProfileDto(profile: PrismaIssuerProfile | null): IssuerProfileDto | null {
  if (!profile) return null;
  return {
    id: profile.id,
    companyName: profile.companyName,
    eik: profile.eik,
    mol: profile.mol,
    addressLine: profile.addressLine,
    city: profile.city,
    phone: profile.phone,
    vatRegistered: profile.vatRegistered,
    vatNumber: profile.vatNumber,
    bankName: profile.bankName,
    iban: profile.iban,
    bic: profile.bic,
    altIban: profile.altIban,
  };
}
