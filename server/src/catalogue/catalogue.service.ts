import type { CatalogueItemDto, Cents } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import type { CatalogueItem } from '@prisma/client';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

export interface CreateCatalogueItemInput {
  name: string;
  defaultUnitPrice: Cents;
  unit: string;
}

export interface UpdateCatalogueItemInput {
  name?: string | undefined;
  defaultUnitPrice?: Cents | undefined;
  unit?: string | undefined;
}

function toDto(item: CatalogueItem): CatalogueItemDto {
  return {
    id: item.id,
    name: item.name,
    defaultUnitPrice: item.defaultUnitPrice,
    unit: item.unit,
  };
}

@Injectable()
export class CatalogueService {
  constructor(private readonly prisma: PrismaService) {}

  async list(accountId: string): Promise<CatalogueItemDto[]> {
    const items = await this.prisma.catalogueItem.findMany({
      where: { accountId },
      orderBy: { name: 'asc' },
    });
    return items.map(toDto);
  }

  async findOne(accountId: string, id: string): Promise<CatalogueItemDto> {
    const item = await this.prisma.catalogueItem.findFirst({ where: { id, accountId } });
    if (!item) throw new DomainError('NOT_FOUND', 'Catalogue item not found');
    return toDto(item);
  }

  async create(accountId: string, input: CreateCatalogueItemInput): Promise<CatalogueItemDto> {
    const item = await this.prisma.catalogueItem.create({
      data: {
        accountId,
        name: input.name,
        defaultUnitPrice: input.defaultUnitPrice,
        unit: input.unit,
      },
    });
    return toDto(item);
  }

  async update(
    accountId: string,
    id: string,
    input: UpdateCatalogueItemInput,
  ): Promise<CatalogueItemDto> {
    const existing = await this.prisma.catalogueItem.findFirst({ where: { id, accountId } });
    if (!existing) throw new DomainError('NOT_FOUND', 'Catalogue item not found');
    const item = await this.prisma.catalogueItem.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.defaultUnitPrice !== undefined
          ? { defaultUnitPrice: input.defaultUnitPrice }
          : {}),
        ...(input.unit !== undefined ? { unit: input.unit } : {}),
      },
    });
    return toDto(item);
  }

  async remove(accountId: string, id: string): Promise<void> {
    const result = await this.prisma.catalogueItem.deleteMany({ where: { id, accountId } });
    if (result.count === 0) throw new DomainError('NOT_FOUND', 'Catalogue item not found');
  }
}
