import type { AccountDetail, AccountListFilters, AccountSummary } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import { type Prisma, DocumentStatus as PrismaDocumentStatus } from '@prisma/client';
import { DTO_TO_STATUS } from '../billing/subscription-mapping';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { toAccountDetail, toAccountSummary } from './admin-accounts.mapper';

const ACCOUNT_INCLUDE = {
  issuerProfile: true,
  subscription: true,
  users: { orderBy: { createdAt: 'asc' as const }, take: 1, select: { email: true } },
  _count: {
    select: { documents: { where: { status: { not: PrismaDocumentStatus.DRAFT } } } },
  },
} satisfies Prisma.AccountInclude;

function buildAccountWhere(filters: AccountListFilters): Prisma.AccountWhereInput {
  const where: Prisma.AccountWhereInput = {};

  if (filters.search.trim()) {
    const search = filters.search.trim();
    where.OR = [
      { issuerProfile: { companyName: { contains: search, mode: 'insensitive' } } },
      { issuerProfile: { eik: { contains: search, mode: 'insensitive' } } },
      { users: { some: { email: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  if (filters.status !== 'all') {
    where.subscription =
      filters.status === 'none' ? null : { status: DTO_TO_STATUS[filters.status] };
  }

  return where;
}

@Injectable()
export class AdminAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: AccountListFilters): Promise<AccountSummary[]> {
    const rows = await this.prisma.account.findMany({
      where: buildAccountWhere(filters),
      include: ACCOUNT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toAccountSummary);
  }

  async detail(id: string): Promise<AccountDetail> {
    const row = await this.prisma.account.findUnique({ where: { id }, include: ACCOUNT_INCLUDE });
    if (!row) {
      throw new DomainError('NOT_FOUND', 'Account not found.');
    }
    return toAccountDetail(row);
  }
}
