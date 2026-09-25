'use client';

import { formatMoney } from '@app/features/shared/format';
import { MoneyInput } from '@app/features/shared/MoneyInput';
import { Button, Input, Select, SelectItem } from '@design/components';
import { UNIT_CODES, type VatRateOption } from '@fakturcho/shared-types';
import type { CatalogueItemDto } from '@shared/types';
import { useTranslations } from 'next-intl';
import { CatalogueAutocompleteInput } from './CatalogueAutocompleteInput';
import type { LineItemFormState } from './composerState';
import { computeLineTotal } from './liveTotals';

const NO_UNIT = 'none';

interface ComposerLineItemRowProps {
  line: LineItemFormState;
  catalogueItems: readonly CatalogueItemDto[];
  canRemove: boolean;
  vatCharged: boolean;
  vatRates: readonly VatRateOption[];
  defaultVatRateBp: number;
  onChange: (patch: Partial<Omit<LineItemFormState, 'key'>>) => void;
  onRemove: () => void;
}

export function ComposerLineItemRow({
  line,
  catalogueItems,
  canRemove,
  vatCharged,
  vatRates,
  defaultVatRateBp,
  onChange,
  onRemove,
}: ComposerLineItemRowProps) {
  const t = useTranslations('documents');
  const lineTotal = computeLineTotal(line.quantity, line.unitPrice ?? 0);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-end sm:flex-wrap">
      <div className="sm:flex-1">
        <CatalogueAutocompleteInput
          value={line.name}
          items={catalogueItems}
          onChangeName={(name) => onChange({ name })}
          onSelectItem={(item) =>
            onChange({ name: item.name, unitPrice: item.defaultUnitPrice, unitCode: item.unitCode })
          }
        />
      </div>
      <div className="sm:w-24">
        <Input
          label={t('composer.lineItems.quantityLabel')}
          required
          inputMode="decimal"
          value={line.quantity}
          onChange={(event) => onChange({ quantity: event.target.value })}
        />
      </div>
      <div className="sm:w-28">
        <Select
          label={t('composer.lineItems.unitLabel')}
          value={line.unitCode ?? NO_UNIT}
          onValueChange={(value) => onChange({ unitCode: value === NO_UNIT ? null : value })}
        >
          <SelectItem value={NO_UNIT}>{t('composer.lineItems.unitNoneOption')}</SelectItem>
          {UNIT_CODES.map((code) => (
            <SelectItem key={code} value={code}>
              {t(`composer.lineItems.units.${code}`)}
            </SelectItem>
          ))}
        </Select>
      </div>
      {vatCharged ? (
        <div className="sm:w-28">
          <Select
            label={t('composer.lineItems.vatRateLabel')}
            value={String(line.vatRateBp ?? defaultVatRateBp)}
            onValueChange={(value) => {
              const rateBp = Number(value);
              onChange({ vatRateBp: rateBp === defaultVatRateBp ? null : rateBp });
            }}
          >
            {vatRates.map((rate) => (
              <SelectItem key={rate.rateBp} value={String(rate.rateBp)}>
                {rate.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      ) : null}
      <div className="sm:w-32">
        <MoneyInput
          label={t('composer.lineItems.priceLabel')}
          required
          value={line.unitPrice}
          onChange={(value) => onChange({ unitPrice: value })}
        />
      </div>
      <div className="flex items-center justify-between gap-2 sm:w-28 sm:flex-col sm:items-end">
        <span className="text-xs font-medium text-text-muted sm:hidden">
          {t('composer.lineItems.totalLabel')}
        </span>
        <span className="text-sm font-semibold text-text">{formatMoney(lineTotal)}</span>
      </div>
      <Button type="button" variant="ghost" size="sm" disabled={!canRemove} onClick={onRemove}>
        {t('composer.lineItems.removeButton')}
      </Button>
    </div>
  );
}
