import type { IssuerProfileDto } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import type { IssuerProfile } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

export interface UpdateIssuerProfileInput {
  companyName?: string | null | undefined;
  eik?: string | null | undefined;
  mol?: string | null | undefined;
  addressLine?: string | null | undefined;
  city?: string | null | undefined;
  phone?: string | null | undefined;
  vatRegistered?: boolean | undefined;
  vatNumber?: string | null | undefined;
  bankName?: string | null | undefined;
  iban?: string | null | undefined;
  bic?: string | null | undefined;
  altIban?: string | null | undefined;
}

function toDto(profile: IssuerProfile): IssuerProfileDto {
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
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.vatRegistered !== undefined ? { vatRegistered: input.vatRegistered } : {}),
      ...(input.vatNumber !== undefined ? { vatNumber: input.vatNumber } : {}),
      ...(input.bankName !== undefined ? { bankName: input.bankName } : {}),
      ...(input.iban !== undefined ? { iban: input.iban } : {}),
      ...(input.bic !== undefined ? { bic: input.bic } : {}),
      ...(input.altIban !== undefined ? { altIban: input.altIban } : {}),
    };
    const profile = await this.prisma.issuerProfile.upsert({
      where: { accountId },
      create: { accountId, ...data },
      update: data,
    });
    return toDto(profile);
  }
}
