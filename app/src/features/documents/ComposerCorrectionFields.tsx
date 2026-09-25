'use client';

import { CORRECTION_REASON_REQUIRED_COUNTRIES } from '@fakturcho/shared-types';
import type { DocumentType } from '@shared/types';
import { ComposerCorrectionReasonField } from './ComposerCorrectionReasonField';
import { ComposerOriginalDocumentField } from './ComposerOriginalDocumentField';

interface ComposerCorrectionFieldsProps {
  documentType: DocumentType;
  documentId: string | null;
  isCorrection: boolean;
  isDeliveryNote: boolean;
  issuerCountry: string;
  originalDocumentId: string | null;
  correctionReason: string;
  hasError: boolean;
  onOriginalChange: (value: string) => void;
  onReasonChange: (value: string) => void;
}

export function ComposerCorrectionFields({
  documentType,
  documentId,
  isCorrection,
  isDeliveryNote,
  issuerCountry,
  originalDocumentId,
  correctionReason,
  hasError,
  onOriginalChange,
  onReasonChange,
}: ComposerCorrectionFieldsProps) {
  return (
    <>
      {isCorrection || isDeliveryNote ? (
        <ComposerOriginalDocumentField
          documentType={documentType}
          value={originalDocumentId}
          currentDocumentId={documentId}
          hasError={isCorrection && hasError && !originalDocumentId}
          onChange={onOriginalChange}
        />
      ) : null}
      {isCorrection ? (
        <ComposerCorrectionReasonField
          value={correctionReason}
          required={CORRECTION_REASON_REQUIRED_COUNTRIES.includes(issuerCountry)}
          onChange={onReasonChange}
        />
      ) : null}
    </>
  );
}
