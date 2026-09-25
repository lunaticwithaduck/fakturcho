'use client';

import { getEinvoiceXmlUrl, useGetEinvoiceReadinessQuery } from '@app/api';
import { useFeatureFlags } from '@app/feature-flags';
import { Button } from '@design/components';
import type { DocumentStatus, DocumentType } from '@shared/types';
import { useTranslations } from 'next-intl';
import { canDownloadDocument } from './documentDownload';
import { KsefNumberField } from './KsefNumberField';

const KNOWN_MISSING_FIELD_CODES = new Set([
  'document.type',
  'document.number',
  'document.issuedAt',
  'document.vatExemptionGround',
  'document.lineItems',
  'document.buyerReference',
  'document.buyerReferenceOrLeitwegId',
  'document.leitwegIdFormat',
  'line.unitCode',
  'issuer.companyName',
  'issuer.country',
  'issuer.street',
  'issuer.postcode',
  'issuer.city',
  'issuer.vatNumber',
  'issuer.phone',
  'issuer.iban',
  'issuer.vatNumberOrRegistrationId',
  'issuer.cui',
  'issuer.cuiChecksum',
  'issuer.vatNumberRoPrefix',
  'issuer.vatNumberRoFormat',
  'issuer.countyRegion',
  'issuer.sirenOrSiret',
  'issuer.vatNumberFrFormat',
  'issuer.esTaxId',
  'issuer.esTaxIdInvalid',
  'issuer.partitaIva',
  'issuer.partitaIvaInvalid',
  'issuer.codiceFiscale',
  'issuer.codiceFiscaleInvalid',
  'issuer.nip',
  'issuer.nipChecksum',
  'recipient.companyName',
  'recipient.country',
  'recipient.street',
  'recipient.postcode',
  'recipient.city',
  'recipient.vatNumberReverseCharge',
  'recipient.cui',
  'recipient.cuiChecksum',
  'recipient.vatNumberRoFormat',
  'recipient.countyRegion',
  'recipient.sirenOrSiret',
  'recipient.vatNumberFrFormat',
  'recipient.esTaxId',
  'recipient.esTaxIdInvalid',
  'recipient.partitaIvaOrCodiceFiscale',
  'recipient.partitaIvaInvalid',
  'recipient.codiceFiscaleInvalid',
  'recipient.sdiCodeOrPec',
  'recipient.nip',
  'recipient.nipChecksum',
]);

function getMissingFieldMessageKey(code: string): string {
  return KNOWN_MISSING_FIELD_CODES.has(code) ? `missingFields.${code}` : 'missingFieldFallback';
}

interface EinvoicePanelProps {
  documentId: string;
  documentType: DocumentType;
  status: DocumentStatus;
  issuerCountry?: string | null;
  ksefNumber?: string | null | undefined;
}

export function EinvoicePanel({
  documentId,
  documentType,
  status,
  issuerCountry = null,
  ksefNumber = null,
}: EinvoicePanelProps) {
  const t = useTranslations('documents.einvoice');
  const { EINVOICE } = useFeatureFlags();
  const isIssued = canDownloadDocument(status);
  const { data: readiness } = useGetEinvoiceReadinessQuery(documentId, {
    skip: !isIssued || !EINVOICE,
  });

  // A delivery note is never e-invoiced (no country accepts one).
  if (documentType === 'delivery_note') return null;
  if (!isIssued || !EINVOICE) return null;

  const missingFieldMessages = readiness
    ? Array.from(new Set(readiness.missingFields.map((code) => t(getMissingFieldMessageKey(code)))))
    : [];

  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" size="sm" asChild className="self-start">
        <a href={getEinvoiceXmlUrl(documentId)} download>
          {t('downloadXml')}
        </a>
      </Button>

      {readiness && !readiness.ready ? (
        <p className="text-sm text-text-muted">
          {t('notReadyHint', { fields: missingFieldMessages.join(', ') })}
        </p>
      ) : null}

      {issuerCountry === 'PL' ? (
        <KsefNumberField documentId={documentId} ksefNumber={ksefNumber} />
      ) : null}
    </div>
  );
}
