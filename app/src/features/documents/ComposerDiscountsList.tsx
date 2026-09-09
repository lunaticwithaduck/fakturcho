'use client';

import { Button } from '@design/components';
import { useTranslations } from 'next-intl';
import { ComposerDiscountRow } from './ComposerDiscountRow';
import type { DiscountFormState } from './composerState';

interface ComposerDiscountsListProps {
  discounts: readonly DiscountFormState[];
  onAdd: () => void;
  onChange: (key: string, patch: Partial<Omit<DiscountFormState, 'key'>>) => void;
  onRemove: (key: string) => void;
}

export function ComposerDiscountsList({
  discounts,
  onAdd,
  onChange,
  onRemove,
}: ComposerDiscountsListProps) {
  const t = useTranslations('documents');

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-text">{t('composer.discounts.heading')}</h2>
      {discounts.map((discount) => (
        <ComposerDiscountRow
          key={discount.key}
          discount={discount}
          onChange={(patch) => onChange(discount.key, patch)}
          onRemove={() => onRemove(discount.key)}
        />
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={onAdd} className="self-start">
        {t('composer.discounts.addButton')}
      </Button>
    </div>
  );
}
