'use client';

import { Input, Select, SelectItem } from '@design/components';
import type { OperationNature } from '@shared/types';
import { useTranslations } from 'next-intl';

interface ComposerFrMentionsFieldsProps {
  operationNature: OperationNature | null;
  deliveryAddress: string;
  hasOperationNatureError: boolean;
  onChange: (patch: { operationNature?: OperationNature; deliveryAddress?: string }) => void;
}

const OPERATION_NATURE_KEYS: Record<OperationNature, string> = {
  goods: 'composer.frMentions.operationNatureGoods',
  services: 'composer.frMentions.operationNatureServices',
  mixed: 'composer.frMentions.operationNatureMixed',
};

export function ComposerFrMentionsFields({
  operationNature,
  deliveryAddress,
  hasOperationNatureError,
  onChange,
}: ComposerFrMentionsFieldsProps) {
  const t = useTranslations('documents');

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Select
        label={t('composer.frMentions.operationNatureLabel')}
        placeholder={t('composer.frMentions.operationNaturePlaceholder')}
        value={operationNature ?? ''}
        onValueChange={(value) => onChange({ operationNature: value as OperationNature })}
        {...(hasOperationNatureError ? { error: t('composer.requiredField') } : {})}
      >
        {(Object.keys(OPERATION_NATURE_KEYS) as OperationNature[]).map((nature) => (
          <SelectItem key={nature} value={nature}>
            {t(OPERATION_NATURE_KEYS[nature])}
          </SelectItem>
        ))}
      </Select>
      <Input
        label={t('composer.frMentions.deliveryAddressLabel')}
        value={deliveryAddress}
        onChange={(event) => onChange({ deliveryAddress: event.target.value })}
      />
    </div>
  );
}
