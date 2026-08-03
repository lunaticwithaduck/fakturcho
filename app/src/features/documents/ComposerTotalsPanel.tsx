import { formatMoney } from '@app/features/shared/format';
import { Card } from '@design/components';
import type { LiveTotals } from './liveTotals';

interface ComposerTotalsPanelProps {
  totals: LiveTotals;
  vatCharged: boolean;
}

export function ComposerTotalsPanel({ totals, vatCharged }: ComposerTotalsPanelProps) {
  const base = totals.subtotal - totals.discountTotal;

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>Междинна сума</span>
        <span>{formatMoney(totals.subtotal)}</span>
      </div>
      {totals.discountTotal > 0 ? (
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>Отстъпка</span>
          <span>-{formatMoney(totals.discountTotal)}</span>
        </div>
      ) : null}
      {vatCharged ? (
        <>
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>Данъчна основа</span>
            <span>{formatMoney(base)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>ДДС (20%)</span>
            <span>{formatMoney(totals.vatAmount)}</span>
          </div>
        </>
      ) : null}
      <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-text">
        <span>Общо</span>
        <span>{formatMoney(totals.amount)}</span>
      </div>
    </Card>
  );
}
