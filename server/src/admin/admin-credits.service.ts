import type {
  CreditPurchaseRow,
  CreditSalesMonth,
  CreditSalesSummary,
} from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import { CreditLedgerReason, Prisma } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { toCreditPurchaseRow } from './admin-credits.mapper';
import { monthKey, parseMonthRange } from './month-range';

const CREDIT_MONTHS_SQL = Prisma.sql`
  SELECT
    to_char(months.month, 'YYYY-MM') AS "month",
    COALESCE(sales.sold_cents, 0)::int AS "soldCents",
    COALESCE(sales.purchases, 0)::int AS "purchases"
  FROM generate_series(
    date_trunc('month', CURRENT_DATE) - interval '11 months',
    date_trunc('month', CURRENT_DATE),
    interval '1 month'
  ) AS months(month)
  LEFT JOIN (
    SELECT date_trunc('month', "createdAt") AS month,
      SUM("amountCents") AS sold_cents,
      COUNT(*) AS purchases
    FROM "credit_ledger_entry"
    WHERE "reason" IN ('PURCHASE', 'SUBSCRIPTION_GRANT')
    GROUP BY 1
  ) sales ON sales.month = months.month
  ORDER BY months.month DESC
`;

const SOLD_CREDIT_REASONS = [CreditLedgerReason.PURCHASE, CreditLedgerReason.SUBSCRIPTION_GRANT];

const PURCHASE_INCLUDE = {
  account: {
    include: {
      issuerProfile: true,
      users: { orderBy: { createdAt: 'asc' as const }, take: 1, select: { email: true } },
    },
  },
} satisfies Prisma.CreditLedgerEntryInclude;

@Injectable()
export class AdminCreditsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(): Promise<CreditSalesSummary> {
    const { start, end } = parseMonthRange(monthKey(new Date()));

    const [allTime, thisMonth] = await Promise.all([
      this.prisma.creditLedgerEntry.aggregate({
        where: { reason: { in: SOLD_CREDIT_REASONS } },
        _sum: { amountCents: true },
        _count: { _all: true },
      }),
      this.prisma.creditLedgerEntry.aggregate({
        where: { reason: { in: SOLD_CREDIT_REASONS }, createdAt: { gte: start, lt: end } },
        _sum: { amountCents: true },
        _count: { _all: true },
      }),
    ]);

    return {
      soldAllTimeCents: allTime._sum.amountCents ?? 0,
      soldThisMonthCents: thisMonth._sum.amountCents ?? 0,
      purchasesAllTime: allTime._count._all,
      purchasesThisMonth: thisMonth._count._all,
    };
  }

  months(): Promise<CreditSalesMonth[]> {
    return this.prisma.$queryRaw<CreditSalesMonth[]>(CREDIT_MONTHS_SQL);
  }

  async purchases(): Promise<CreditPurchaseRow[]> {
    const rows = await this.prisma.creditLedgerEntry.findMany({
      where: { reason: { in: SOLD_CREDIT_REASONS } },
      include: PURCHASE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map(toCreditPurchaseRow);
  }
}
