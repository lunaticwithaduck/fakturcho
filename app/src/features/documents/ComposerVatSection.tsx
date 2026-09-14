'use client';

import { Select, SelectItem, Switch } from '@design/components';
import { useTranslations } from 'next-intl';

interface ComposerVatSectionProps {
  chargeVat: boolean;
  showChargeToggle: boolean;
  vatExemptionGround: string | null;
  grounds: readonly string[];
  ratePercent: number;
  hasGroundError: boolean;
  onChangeChargeVat: (chargeVat: boolean) => void;
  onChangeGround: (ground: string) => void;
}

export function ComposerVatSection({
  chargeVat,
  showChargeToggle,
  vatExemptionGround,
  grounds,
  ratePercent,
  hasGroundError,
  onChangeChargeVat,
  onChangeGround,
}: ComposerVatSectionProps) {
  const t = useTranslations('documents');

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">{t('composer.vat.heading')}</h2>
      {showChargeToggle ? (
        <Switch
          label={t('composer.vat.chargeLabel', { rate: ratePercent })}
          checked={chargeVat}
          onCheckedChange={onChangeChargeVat}
        />
      ) : null}
      {!chargeVat ? (
        <Select
          label={t('composer.vat.groundLabel')}
          placeholder={t('composer.vat.groundPlaceholder')}
          value={vatExemptionGround ?? ''}
          onValueChange={onChangeGround}
          {...(hasGroundError ? { error: t('composer.requiredField') } : {})}
        >
          {grounds.map((ground) => (
            <SelectItem key={ground} value={ground}>
              {ground}
            </SelectItem>
          ))}
        </Select>
      ) : null}
    </div>
  );
}
