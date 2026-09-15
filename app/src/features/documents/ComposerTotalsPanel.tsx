'use client';

import { formatMoney } from '@app/features/shared/format';
import { Card } from '@design/components';
import { useTranslations } from 'next-intl';
import type { LiveTotals } from './liveTotals';

interface ComposerTotalsPanelProps {
  totals: LiveTotals;
  vatCharged: boolean;
  // null when the document has no single rate to show (mixed rates, or none).
  vatRatePercent: number | null;
}

export function ComposerTotalsPanel({
  totals,
  vatCharged,
  vatRatePercent,
}: ComposerTotalsPanelProps) {
  const t = useTranslations('documents');
  const base = totals.subtotal - totals.discountTotal;
  const vatLabel =
    vatRatePercent === null
      ? t('composer.totals.vatGeneric')
      : t('composer.totals.vat', { rate: vatRatePercent });

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>{t('composer.totals.subtotal')}</span>
        <span>{formatMoney(totals.subtotal)}</span>
      </div>
      {totals.discountTotal > 0 ? (
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>{t('composer.totals.discount')}</span>
          <span>-{formatMoney(totals.discountTotal)}</span>
        </div>
      ) : null}
      {vatCharged ? (
        <>
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>{t('composer.totals.taxBase')}</span>
            <span>{formatMoney(base)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>{vatLabel}</span>
            <span>{formatMoney(totals.vatAmount)}</span>
          </div>
        </>
      ) : null}
      <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-text">
        <span>{t('composer.totals.total')}</span>
        <span>{formatMoney(totals.amount)}</span>
      </div>
    </Card>
  );
}
