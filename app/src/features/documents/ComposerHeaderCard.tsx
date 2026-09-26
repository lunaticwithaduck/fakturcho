'use client';

import { Card } from '@design/components';
import type { ClientDto } from '@shared/types';
import { ComposerClientField } from './ComposerClientField';
import { ComposerCorrectionFields } from './ComposerCorrectionFields';
import { ComposerDetailsFields } from './ComposerDetailsFields';
import { ComposerDocumentTypeField } from './ComposerDocumentTypeField';
import type { ComposerFormState } from './composerState';
import type { ComposerStateController } from './useComposerState';

interface ComposerHeaderCardProps {
  documentId: string | null;
  clients: readonly ClientDto[];
  issuerCountry: string;
  maxPaymentTermsDays?: number;
  isCorrection: boolean;
  isDeliveryNote: boolean;
  hasError: boolean;
  state: ComposerFormState;
  setField: ComposerStateController['setField'];
  patchState: ComposerStateController['patchState'];
}

export function ComposerHeaderCard({
  documentId,
  clients,
  issuerCountry,
  maxPaymentTermsDays,
  isCorrection,
  isDeliveryNote,
  hasError,
  state,
  setField,
  patchState,
}: ComposerHeaderCardProps) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ComposerDocumentTypeField
          value={state.documentType}
          onChange={(value) => setField('documentType', value)}
        />
        <ComposerClientField
          clientId={state.clientId}
          clients={clients}
          onChange={(value) => setField('clientId', value)}
        />
      </div>
      <ComposerCorrectionFields
        documentType={state.documentType}
        documentId={documentId}
        isCorrection={isCorrection}
        isDeliveryNote={isDeliveryNote}
        issuerCountry={issuerCountry}
        originalDocumentId={state.originalDocumentId}
        correctionReason={state.correctionReason}
        hasError={hasError}
        onOriginalChange={(value) => setField('originalDocumentId', value)}
        onReasonChange={(value) => setField('correctionReason', value)}
      />
      <ComposerDetailsFields
        documentType={state.documentType}
        referenceNumber={state.referenceNumber}
        taxEventAt={state.taxEventAt}
        dueAt={state.dueAt}
        paymentTermsDays={state.paymentTermsDays}
        {...(maxPaymentTermsDays !== undefined ? { maxPaymentTermsDays } : {})}
        validUntil={state.validUntil}
        onChange={patchState}
      />
    </Card>
  );
}
