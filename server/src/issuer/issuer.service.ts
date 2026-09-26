import type { IssuerProfileDto } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import type { IssuerProfile } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { readIdentifiers } from './identifiers';

export interface UpdateIssuerProfileInput {
  companyName?: string | null | undefined;
  eik?: string | null | undefined;
  mol?: string | null | undefined;
  addressLine?: string | null | undefined;
  street?: string | null | undefined;
  postcode?: string | null | undefined;
  countyRegion?: string | null | undefined;
  city?: string | null | undefined;
  country?: string | undefined;
  phone?: string | null | undefined;
  vatRegistered?: boolean | undefined;
  vatNumber?: string | null | undefined;
  bankName?: string | null | undefined;
  iban?: string | null | undefined;
  bic?: string | null | undefined;
  altIban?: string | null | undefined;
  peppolEndpointId?: string | null | undefined;
  peppolScheme?: string | null | undefined;
  identifiers?: Record<string, string> | undefined;
  vatOnCashBasis?: boolean | undefined;
  vatOnDebits?: boolean | undefined;
  defaultPaymentTermsDays?: number | null | undefined;
}

function toDto(profile: IssuerProfile): IssuerProfileDto {
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
    defaultPaymentTermsDays: profile.defaultPaymentTermsDays,
  };
}

@Injectable()
export class IssuerService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(accountId: string): Promise<IssuerProfileDto> {
    const profile = await this.prisma.issuerProfile.upsert({
      where: { accountId },
      create: { accountId },
      update: {},
    });
    return toDto(profile);
  }

  async updateProfile(
    accountId: string,
    input: UpdateIssuerProfileInput,
  ): Promise<IssuerProfileDto> {
    const data = {
      ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
      ...(input.eik !== undefined ? { eik: input.eik } : {}),
      ...(input.mol !== undefined ? { mol: input.mol } : {}),
      ...(input.addressLine !== undefined ? { addressLine: input.addressLine } : {}),
      ...(input.street !== undefined ? { street: input.street } : {}),
      ...(input.postcode !== undefined ? { postcode: input.postcode } : {}),
      ...(input.countyRegion !== undefined ? { countyRegion: input.countyRegion } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.vatRegistered !== undefined ? { vatRegistered: input.vatRegistered } : {}),
      ...(input.vatNumber !== undefined ? { vatNumber: input.vatNumber } : {}),
      ...(input.identifiers !== undefined ? { identifiers: input.identifiers } : {}),
      ...(input.bankName !== undefined ? { bankName: input.bankName } : {}),
      ...(input.iban !== undefined ? { iban: input.iban } : {}),
      ...(input.bic !== undefined ? { bic: input.bic } : {}),
      ...(input.altIban !== undefined ? { altIban: input.altIban } : {}),
      ...(input.peppolEndpointId !== undefined ? { peppolEndpointId: input.peppolEndpointId } : {}),
      ...(input.peppolScheme !== undefined ? { peppolScheme: input.peppolScheme } : {}),
      ...(input.vatOnCashBasis !== undefined ? { vatOnCashBasis: input.vatOnCashBasis } : {}),
      ...(input.vatOnDebits !== undefined ? { vatOnDebits: input.vatOnDebits } : {}),
      ...(input.defaultPaymentTermsDays !== undefined
        ? { defaultPaymentTermsDays: input.defaultPaymentTermsDays }
        : {}),
    };
    const profile = await this.prisma.issuerProfile.upsert({
      where: { accountId },
      create: { accountId, ...data },
      update: data,
    });
    return toDto(profile);
  }
}
