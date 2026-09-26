'use client';

import { Card } from '@design/components';
import type { DocumentType } from '@shared/types';
import { ComposerDeliveryFields } from './ComposerDeliveryFields';
import type { ComposerFormState } from './composerState';

interface ComposerDeliverySectionProps {
  documentType: DocumentType;
  state: ComposerFormState;
  issuerCountry: string;
  transportReasonOptions: readonly string[];
  onChange: (patch: Partial<ComposerFormState>) => void;
}

export function ComposerDeliverySection({
  documentType,
  state,
  issuerCountry,
  transportReasonOptions,
  onChange,
}: ComposerDeliverySectionProps) {
  if (documentType !== 'delivery_note') return null;
  return (
    <Card>
      <ComposerDeliveryFields
        deliveryDate={state.deliveryDate}
        transportReason={state.transportReason}
        transportedAt={state.transportedAt}
        carrierName={state.carrierName}
        transportNote={state.transportNote}
        transportVehicle={state.transportVehicle}
        transportReasonOptions={transportReasonOptions}
        issuerCountry={issuerCountry}
        onChange={onChange}
      />
    </Card>
  );
}
