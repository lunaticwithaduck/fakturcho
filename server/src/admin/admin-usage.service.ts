import type { UsageMonthSummary } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

const USAGE_MONTHS_SQL = Prisma.sql`
  SELECT
    to_char(months.month, 'YYYY-MM') AS "month",
    COALESCE(doc.documents_issued, 0)::int AS "documentsIssued",
    COALESCE(doc.active_accounts, 0)::int AS "activeAccounts",
    COALESCE(mail.emails_sent, 0)::int AS "emailsSent"
  FROM generate_series(
    date_trunc('month', CURRENT_DATE) - interval '11 months',
    date_trunc('month', CURRENT_DATE),
    interval '1 month'
  ) AS months(month)
  LEFT JOIN (
    SELECT date_trunc('month', "issuedAt") AS month,
      COUNT(*) AS documents_issued,
      COUNT(DISTINCT "accountId") AS active_accounts
    FROM "document"
    WHERE "issuedAt" IS NOT NULL
    GROUP BY 1
  ) doc ON doc.month = months.month
  LEFT JOIN (
    SELECT date_trunc('month', "emailedAt") AS month, COUNT(*) AS emails_sent
    FROM "document"
    WHERE "emailedAt" IS NOT NULL
    GROUP BY 1
  ) mail ON mail.month = months.month
  ORDER BY months.month DESC
`;

@Injectable()
export class AdminUsageService {
  constructor(private readonly prisma: PrismaService) {}

  months(): Promise<UsageMonthSummary[]> {
    return this.prisma.$queryRaw<UsageMonthSummary[]>(USAGE_MONTHS_SQL);
  }
}
