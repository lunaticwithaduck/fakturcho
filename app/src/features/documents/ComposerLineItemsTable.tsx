'use client';

import { Button } from '@design/components';
import type { CatalogueItemDto } from '@shared/types';
import { useTranslations } from 'next-intl';
import { ComposerLineItemRow } from './ComposerLineItemRow';
import type { LineItemFormState } from './composerState';

interface ComposerLineItemsTableProps {
  lineItems: readonly LineItemFormState[];
  catalogueItems: readonly CatalogueItemDto[];
  onAdd: () => void;
  onChange: (key: string, patch: Partial<Omit<LineItemFormState, 'key'>>) => void;
  onRemove: (key: string) => void;
}

export function ComposerLineItemsTable({
  lineItems,
  catalogueItems,
  onAdd,
  onChange,
  onRemove,
}: ComposerLineItemsTableProps) {
  const t = useTranslations('documents');

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-text">{t('composer.lineItems.heading')}</h2>
      {lineItems.map((line) => (
        <ComposerLineItemRow
          key={line.key}
          line={line}
          catalogueItems={catalogueItems}
          canRemove={lineItems.length > 1}
          onChange={(patch) => onChange(line.key, patch)}
          onRemove={() => onRemove(line.key)}
        />
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={onAdd} className="self-start">
        {t('composer.lineItems.addButton')}
      </Button>
    </div>
  );
}
