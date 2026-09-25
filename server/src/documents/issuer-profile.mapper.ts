import type { IssuerProfileDto } from '@fakturcho/shared-types';
import type { IssuerProfile as PrismaIssuerProfile } from '@prisma/client';
import { readIdentifiers } from '../issuer/identifiers';

export function toIssuerProfileDto(profile: PrismaIssuerProfile | null): IssuerProfileDto | null {
  if (!profile) return null;
  return {
    id: profile.id,
    companyName: profile.companyName,
    eik: profile.eik,
    mol: profile.mol,
    addressLine: profile.addressLine,
    street: profile.street,
    postcode: profile.postcode,
    countyRegion: profile.countyRegion,
    city: profile.city,
    country: profile.country,
    phone: profile.phone,
    vatRegistered: profile.vatRegistered,
    vatNumber: profile.vatNumber,
    bankName: profile.bankName,
    iban: profile.iban,
    bic: profile.bic,
    altIban: profile.altIban,
    peppolEndpointId: profile.peppolEndpointId,
    peppolScheme: profile.peppolScheme,
    identifiers: readIdentifiers(profile.identifiers),
    vatOnCashBasis: profile.vatOnCashBasis,
    vatOnDebits: profile.vatOnDebits,
  };
}
