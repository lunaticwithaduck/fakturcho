import type { ClientDto } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import type { Client } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

export interface CreateClientInput {
  companyName: string;
  eik?: string | null | undefined;
  vatNumber?: string | null | undefined;
  address?: string | null | undefined;
  street?: string | null | undefined;
  postcode?: string | null | undefined;
  countyRegion?: string | null | undefined;
  country?: string | undefined;
  documentLanguage?: ClientDto['documentLanguage'] | undefined;
  email?: string | null | undefined;
  mol?: string | null | undefined;
  peppolEndpointId?: string | null | undefined;
  peppolScheme?: string | null | undefined;
  sdiRecipientCode?: string | null | undefined;
  pec?: string | null | undefined;
}

export interface UpdateClientInput {
  companyName?: string | undefined;
  eik?: string | null | undefined;
  vatNumber?: string | null | undefined;
  address?: string | null | undefined;
  street?: string | null | undefined;
  postcode?: string | null | undefined;
  countyRegion?: string | null | undefined;
  country?: string | undefined;
  documentLanguage?: ClientDto['documentLanguage'] | undefined;
  email?: string | null | undefined;
  mol?: string | null | undefined;
  peppolEndpointId?: string | null | undefined;
  peppolScheme?: string | null | undefined;
  sdiRecipientCode?: string | null | undefined;
  pec?: string | null | undefined;
}

function toDto(client: Client): ClientDto {
  return {
    id: client.id,
    companyName: client.companyName,
    eik: client.eik,
    vatNumber: client.vatNumber,
    address: client.address,
    street: client.street,
    postcode: client.postcode,
    countyRegion: client.countyRegion,
    country: client.country,
    documentLanguage: client.documentLanguage as ClientDto['documentLanguage'],
    email: client.email,
    mol: client.mol,
    peppolEndpointId: client.peppolEndpointId,
    peppolScheme: client.peppolScheme,
    sdiRecipientCode: client.sdiRecipientCode,
    pec: client.pec,
  };
}

function normalizeEik(eik: string | null | undefined): string | null {
  if (!eik) return null;
  const trimmed = eik.trim();
  return trimmed === '' ? null : trimmed;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(accountId: string): Promise<ClientDto[]> {
    const clients = await this.prisma.client.findMany({
      where: { accountId },
      orderBy: { companyName: 'asc' },
    });
    return clients.map(toDto);
  }

  async findOne(accountId: string, id: string): Promise<ClientDto> {
    const client = await this.prisma.client.findFirst({ where: { id, accountId } });
    if (!client) throw new DomainError('NOT_FOUND', 'Client not found');
    return toDto(client);
  }

  async create(accountId: string, input: CreateClientInput): Promise<ClientDto> {
    const eik = normalizeEik(input.eik);
    if (eik) await this.assertEikAvailable(accountId, eik, null);
    try {
      const client = await this.prisma.client.create({
        data: {
          accountId,
          companyName: input.companyName,
          eik,
          vatNumber: input.vatNumber ?? null,
          address: input.address ?? null,
          street: input.street ?? null,
          postcode: input.postcode ?? null,
          countyRegion: input.countyRegion ?? null,
          country: input.country ?? 'BG',
          documentLanguage: input.documentLanguage ?? null,
          email: input.email ?? null,
          mol: input.mol ?? null,
          peppolEndpointId: input.peppolEndpointId ?? null,
          peppolScheme: input.peppolScheme ?? null,
          sdiRecipientCode: input.sdiRecipientCode ?? null,
          pec: input.pec ?? null,
        },
      });
      return toDto(client);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new DomainError('CLIENT_EIK_DUPLICATE', `Client with EIK ${eik} already exists`);
      }
      throw error;
    }
  }

  async update(accountId: string, id: string, input: UpdateClientInput): Promise<ClientDto> {
    const existing = await this.prisma.client.findFirst({ where: { id, accountId } });
    if (!existing) throw new DomainError('NOT_FOUND', 'Client not found');
    const eik = input.eik === undefined ? undefined : normalizeEik(input.eik);
    if (eik) await this.assertEikAvailable(accountId, eik, id);
    try {
      const client = await this.prisma.client.update({
        where: { id },
        data: {
          ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
          ...(eik !== undefined ? { eik } : {}),
          ...(input.vatNumber !== undefined ? { vatNumber: input.vatNumber } : {}),
          ...(input.address !== undefined ? { address: input.address } : {}),
          ...(input.street !== undefined ? { street: input.street } : {}),
          ...(input.postcode !== undefined ? { postcode: input.postcode } : {}),
          ...(input.countyRegion !== undefined ? { countyRegion: input.countyRegion } : {}),
          ...(input.country !== undefined ? { country: input.country } : {}),
          ...(input.documentLanguage !== undefined
            ? { documentLanguage: input.documentLanguage }
            : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.mol !== undefined ? { mol: input.mol } : {}),
          ...(input.peppolEndpointId !== undefined
            ? { peppolEndpointId: input.peppolEndpointId }
            : {}),
          ...(input.peppolScheme !== undefined ? { peppolScheme: input.peppolScheme } : {}),
          ...(input.sdiRecipientCode !== undefined
            ? { sdiRecipientCode: input.sdiRecipientCode }
            : {}),
          ...(input.pec !== undefined ? { pec: input.pec } : {}),
        },
      });
      return toDto(client);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new DomainError('CLIENT_EIK_DUPLICATE', `Client with EIK ${eik} already exists`);
      }
      throw error;
    }
  }

  async remove(accountId: string, id: string): Promise<void> {
    const result = await this.prisma.client.deleteMany({ where: { id, accountId } });
    if (result.count === 0) throw new DomainError('NOT_FOUND', 'Client not found');
  }

  private async assertEikAvailable(
    accountId: string,
    eik: string,
    excludeId: string | null,
  ): Promise<void> {
    const conflict = await this.prisma.client.findFirst({
      where: { accountId, eik, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    if (conflict) {
      throw new DomainError('CLIENT_EIK_DUPLICATE', `Client with EIK ${eik} already exists`);
    }
  }
}
