import { formatDate, formatSignedMoney } from '@app/features/shared/format';
import { Card } from '@design/components';
import type { CreditLedgerEntryDto } from '@shared/types';
import { CREDIT_LEDGER_REASON_LABELS } from './billingDisplay';

interface LedgerEntryRowProps {
  entry: CreditLedgerEntryDto;
}

export function LedgerEntryRow({ entry }: LedgerEntryRowProps) {
  return (
    <Card className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-sm font-semibold text-text">
          {CREDIT_LEDGER_REASON_LABELS[entry.reason]}
        </p>
        <p className="text-sm text-text-muted">{formatDate(entry.createdAt)}</p>
      </div>
      <p
        className={
          entry.amountCents > 0
            ? 'shrink-0 text-sm font-semibold text-success'
            : 'shrink-0 text-sm font-semibold text-text'
        }
      >
        {formatSignedMoney(entry.amountCents)}
      </p>
    </Card>
  );
}
