'use client';

import { MoneyInput } from '@app/features/shared/MoneyInput';
import { Button, Input, RadioGroup, RadioGroupItem } from '@design/components';
import { useTranslations } from 'next-intl';
import type { DiscountFormState } from './composerState';
import { PercentInput } from './PercentInput';

interface ComposerDiscountRowProps {
  discount: DiscountFormState;
  onChange: (patch: Partial<Omit<DiscountFormState, 'key'>>) => void;
  onRemove: () => void;
}

export function ComposerDiscountRow({ discount, onChange, onRemove }: ComposerDiscountRowProps) {
  const t = useTranslations('documents');

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-end">
      <div className="sm:flex-1">
        <Input
          label={t('composer.discounts.reasonLabel')}
          required
          value={discount.label}
          onChange={(event) => onChange({ label: event.target.value })}
        />
      </div>
      <RadioGroup
        value={discount.mode}
        onValueChange={(mode) => onChange({ mode: mode as DiscountFormState['mode'] })}
        className="flex gap-4"
      >
        <RadioGroupItem value="percent" label={t('composer.discounts.modePercent')} />
        <RadioGroupItem value="amount" label={t('composer.discounts.modeAmount')} />
      </RadioGroup>
      <div className="sm:w-32">
        {discount.mode === 'percent' ? (
          <PercentInput
            label={t('composer.discounts.percentLabel')}
            value={discount.percentBp}
            onChange={(value) => onChange({ percentBp: value })}
          />
        ) : (
          <MoneyInput
            label={t('composer.discounts.amountLabel')}
            value={discount.amount}
            onChange={(value) => onChange({ amount: value })}
          />
        )}
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        {t('composer.discounts.removeButton')}
      </Button>
    </div>
  );
}
