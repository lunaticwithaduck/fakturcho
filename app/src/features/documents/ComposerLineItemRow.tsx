import { formatMoney } from '@app/features/shared/format';
import { MoneyInput } from '@app/features/shared/MoneyInput';
import { Button, Input } from '@design/components';
import type { CatalogueItemDto } from '@shared/types';
import { CatalogueAutocompleteInput } from './CatalogueAutocompleteInput';
import type { LineItemFormState } from './composerState';
import { computeLineTotal } from './liveTotals';

interface ComposerLineItemRowProps {
  line: LineItemFormState;
  catalogueItems: readonly CatalogueItemDto[];
  canRemove: boolean;
  onChange: (patch: Partial<Omit<LineItemFormState, 'key'>>) => void;
  onRemove: () => void;
}

export function ComposerLineItemRow({
  line,
  catalogueItems,
  canRemove,
  onChange,
  onRemove,
}: ComposerLineItemRowProps) {
  const lineTotal = computeLineTotal(line.quantity, line.unitPrice ?? 0);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-end">
      <div className="sm:flex-1">
        <CatalogueAutocompleteInput
          value={line.name}
          items={catalogueItems}
          onChangeName={(name) => onChange({ name })}
          onSelectItem={(item) => onChange({ name: item.name, unitPrice: item.defaultUnitPrice })}
        />
      </div>
      <div className="sm:w-24">
        <Input
          label="Количество"
          required
          inputMode="decimal"
          value={line.quantity}
          onChange={(event) => onChange({ quantity: event.target.value })}
        />
      </div>
      <div className="sm:w-32">
        <MoneyInput
          label="Цена"
          required
          value={line.unitPrice}
          onChange={(value) => onChange({ unitPrice: value })}
        />
      </div>
      <div className="flex items-center justify-between gap-2 sm:w-28 sm:flex-col sm:items-end">
        <span className="text-xs font-medium text-text-muted sm:hidden">Общо</span>
        <span className="text-sm font-semibold text-text">{formatMoney(lineTotal)}</span>
      </div>
      <Button type="button" variant="ghost" size="sm" disabled={!canRemove} onClick={onRemove}>
        Премахни
      </Button>
    </div>
  );
}
