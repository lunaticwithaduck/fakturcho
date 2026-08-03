import { MoneyInput } from '@app/features/shared/MoneyInput';
import { Button, Input, RadioGroup, RadioGroupItem } from '@design/components';
import type { DiscountFormState } from './composerState';
import { PercentInput } from './PercentInput';

interface ComposerDiscountRowProps {
  discount: DiscountFormState;
  onChange: (patch: Partial<Omit<DiscountFormState, 'key'>>) => void;
  onRemove: () => void;
}

export function ComposerDiscountRow({ discount, onChange, onRemove }: ComposerDiscountRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-end">
      <div className="sm:flex-1">
        <Input
          label="Основание за отстъпка"
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
        <RadioGroupItem value="percent" label="Процент" />
        <RadioGroupItem value="amount" label="Сума" />
      </RadioGroup>
      <div className="sm:w-32">
        {discount.mode === 'percent' ? (
          <PercentInput
            label="Процент %"
            value={discount.percentBp}
            onChange={(value) => onChange({ percentBp: value })}
          />
        ) : (
          <MoneyInput
            label="Сума"
            value={discount.amount}
            onChange={(value) => onChange({ amount: value })}
          />
        )}
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        Премахни
      </Button>
    </div>
  );
}
