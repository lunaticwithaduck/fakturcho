import type { TurnoverReportRow } from '../types/admin';
import { getAllDocuments } from './documents';
import { monthKeyOf, monthsAgoDate } from './referenceDate';

const REPORT_MONTHS_COUNT = 12;

export function getAvailableReportMonths(): string[] {
  return Array.from({ length: REPORT_MONTHS_COUNT }, (_, index) =>
    monthKeyOf(monthsAgoDate(index)),
  );
}

export function getTurnoverReport(month: string): TurnoverReportRow[] {
  const rows = new Map<string, TurnoverReportRow>();

  for (const document of getAllDocuments()) {
    if (document.status === 'cancelled') continue;
    if (!document.issuedAt?.startsWith(month)) continue;

    const existing = rows.get(document.accountId);
    if (existing) {
      existing.documentsIssued += 1;
      existing.turnoverCents += document.amount;
    } else {
      rows.set(document.accountId, {
        accountId: document.accountId,
        accountName: document.accountName,
        documentsIssued: 1,
        turnoverCents: document.amount,
      });
    }
  }

  return Array.from(rows.values()).sort((a, b) => b.turnoverCents - a.turnoverCents);
}
