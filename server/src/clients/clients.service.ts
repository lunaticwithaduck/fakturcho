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
  email?: string | null | undefined;
  mol?: string | null | undefined;
}

export interface UpdateClientInput {
  companyName?: string | undefined;
  eik?: string | null | undefined;
  vatNumber?: string | null | undefined;
  address?: string | null | undefined;
  email?: string | null | undefined;
  mol?: string | null | undefined;
}

function toDto(client: Client): ClientDto {
  return {
    id: client.id,
    companyName: client.companyName,
    eik: client.eik,
    vatNumber: client.vatNumber,
    address: client.address,
    email: client.email,
    mol: client.mol,
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
          email: input.email ?? null,
          mol: input.mol ?? null,
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
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.mol !== undefined ? { mol: input.mol } : {}),
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
