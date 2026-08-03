import { Select, SelectItem, Switch } from '@design/components';
import { VAT_EXEMPTION_GROUNDS } from '@fakturcho/shared-types';

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
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">ДДС</h2>
      <Switch label="Начисли ДДС (20%)" checked={chargeVat} onCheckedChange={onChangeChargeVat} />
      {!chargeVat ? (
        <Select
          label="Основание за неначисляване на ДДС"
          placeholder="Изберете основание"
          value={vatExemptionGround ?? ''}
          onValueChange={onChangeGround}
          {...(hasGroundError ? { error: 'Задължително поле' } : {})}
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
