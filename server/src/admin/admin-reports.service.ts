import type { TurnoverReportRow } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import { DocumentStatus as PrismaDocumentStatus } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { accountDisplayName } from './account-display.util';
import { lastTwelveMonths, parseMonthRange } from './month-range';

@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService) {}

  months(): string[] {
    return lastTwelveMonths();
  }

  async turnover(month: string): Promise<TurnoverReportRow[]> {
    const { start, end } = parseMonthRange(month);

    const grouped = await this.prisma.document.groupBy({
      by: ['accountId'],
      where: {
        issuedAt: { gte: start, lt: end },
        status: { not: PrismaDocumentStatus.CANCELLED },
      },
      _sum: { amount: true },
      _count: { _all: true },
    });

    if (grouped.length === 0) return [];

    const accounts = await this.prisma.account.findMany({
      where: { id: { in: grouped.map((row) => row.accountId) } },
      include: {
        issuerProfile: true,
        users: { orderBy: { createdAt: 'asc' }, take: 1, select: { email: true } },
      },
    });
    const accountById = new Map(accounts.map((account) => [account.id, account]));

    return grouped
      .map((row) => {
        const account = accountById.get(row.accountId);
        return {
          accountId: row.accountId,
          accountName: account ? accountDisplayName(account.issuerProfile, account.users) : '',
          documentsIssued: row._count._all,
          turnoverCents: row._sum.amount ?? 0,
        };
      })
      .sort((a, b) => b.turnoverCents - a.turnoverCents);
  }
}
