'use client';

import { Select, SelectItem, Switch } from '@design/components';
import { VAT_EXEMPTION_GROUNDS } from '@fakturcho/shared-types';
import { useTranslations } from 'next-intl';

interface ComposerVatSectionProps {
  chargeVat: boolean;
  vatExemptionGround: string | null;
  hasGroundError: boolean;
  onChangeChargeVat: (chargeVat: boolean) => void;
  onChangeGround: (ground: string) => void;
}

export function ComposerVatSection({
  chargeVat,
  vatExemptionGround,
  hasGroundError,
  onChangeChargeVat,
  onChangeGround,
}: ComposerVatSectionProps) {
  const t = useTranslations('documents');

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">{t('composer.vat.heading')}</h2>
      <Switch
        label={t('composer.vat.chargeLabel')}
        checked={chargeVat}
        onCheckedChange={onChangeChargeVat}
      />
      {!chargeVat ? (
        <Select
          label={t('composer.vat.groundLabel')}
          placeholder={t('composer.vat.groundPlaceholder')}
          value={vatExemptionGround ?? ''}
          onValueChange={onChangeGround}
          {...(hasGroundError ? { error: t('composer.requiredField') } : {})}
        >
          {VAT_EXEMPTION_GROUNDS.map((ground) => (
            <SelectItem key={ground} value={ground}>
              {ground}
            </SelectItem>
          ))}
        </Select>
      ) : null}
    </div>
  );
}
