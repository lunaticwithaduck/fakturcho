'use client';

import { Input, Select, SelectItem, Textarea } from '@design/components';
import { useTranslations } from 'next-intl';

interface ComposerDeliveryFieldsProps {
  deliveryDate: string;
  transportReason: string;
  transportedAt: string;
  carrierName: string;
  transportNote: string;
  transportVehicle: string;
  transportReasonOptions: readonly string[];
  issuerCountry: string;
  onChange: (patch: {
    deliveryDate?: string;
    transportReason?: string;
    transportedAt?: string;
    carrierName?: string;
    transportNote?: string;
    transportVehicle?: string;
  }) => void;
}

export function ComposerDeliveryFields({
  deliveryDate,
  transportReason,
  transportedAt,
  carrierName,
  transportNote,
  transportVehicle,
  transportReasonOptions,
  issuerCountry,
  onChange,
}: ComposerDeliveryFieldsProps) {
  const t = useTranslations('documents');

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">{t('composer.delivery.heading')}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t('composer.delivery.deliveryDateLabel')}
          type="date"
          value={deliveryDate}
          onChange={(event) => onChange({ deliveryDate: event.target.value })}
        />
        <Input
          label={t('composer.delivery.transportedAtLabel')}
          type="datetime-local"
          value={transportedAt}
          onChange={(event) => onChange({ transportedAt: event.target.value })}
        />
        {transportReasonOptions.length > 0 ? (
          <Select
            label={t('composer.delivery.transportReasonLabel')}
            placeholder={t('composer.delivery.transportReasonPlaceholder')}
            value={transportReason}
            onValueChange={(value) => onChange({ transportReason: value })}
          >
            {transportReasonOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </Select>
        ) : (
          <Input
            label={t('composer.delivery.transportReasonLabel')}
            value={transportReason}
            onChange={(event) => onChange({ transportReason: event.target.value })}
          />
        )}
        <Input
          label={t('composer.delivery.carrierNameLabel')}
          value={carrierName}
          onChange={(event) => onChange({ carrierName: event.target.value })}
        />
        {issuerCountry === 'RO' ? (
          <Input
            label={t('composer.delivery.transportVehicleLabel')}
            value={transportVehicle}
            onChange={(event) => onChange({ transportVehicle: event.target.value })}
          />
        ) : null}
      </div>
      <Textarea
        label={t('composer.delivery.transportNoteLabel')}
        value={transportNote}
        onChange={(event) => onChange({ transportNote: event.target.value })}
      />
    </div>
  );
}
