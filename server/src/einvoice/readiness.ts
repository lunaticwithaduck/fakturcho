import type { DocumentDto, DocumentType } from '@fakturcho/shared-types';

const EINVOICE_DOCUMENT_TYPES: readonly DocumentType[] = ['invoice', 'credit_note', 'debit_note'];

const REFERENCE_REQUIRED_PAYMENT_MEANS: readonly string[] = ['30', '58'];

export const EINVOICE_MISSING_FIELD_CODES = {
  documentType: 'document.type',
  documentNumber: 'document.number',
  documentIssuedAt: 'document.issuedAt',
  documentVatExemptionGround: 'document.vatExemptionGround',
  documentLineItems: 'document.lineItems',
  documentBuyerReference: 'document.buyerReference',
  documentBuyerReferenceOrLeitwegId: 'document.buyerReferenceOrLeitwegId',
  documentLeitwegIdFormat: 'document.leitwegIdFormat',
  lineUnitCode: 'line.unitCode',

  issuerCompanyName: 'issuer.companyName',
  issuerCountry: 'issuer.country',
  issuerStreet: 'issuer.street',
  issuerPostcode: 'issuer.postcode',
  issuerCity: 'issuer.city',
  issuerVatNumber: 'issuer.vatNumber',
  issuerPhone: 'issuer.phone',
  issuerIban: 'issuer.iban',
  issuerVatNumberOrRegistrationId: 'issuer.vatNumberOrRegistrationId',
  issuerCui: 'issuer.cui',
  issuerCuiChecksum: 'issuer.cuiChecksum',
  issuerVatNumberRoPrefix: 'issuer.vatNumberRoPrefix',
  issuerVatNumberRoFormat: 'issuer.vatNumberRoFormat',
  issuerCountyRegion: 'issuer.countyRegion',
  issuerSirenOrSiret: 'issuer.sirenOrSiret',
  issuerVatNumberFrFormat: 'issuer.vatNumberFrFormat',
  issuerEsTaxId: 'issuer.esTaxId',
  issuerEsTaxIdInvalid: 'issuer.esTaxIdInvalid',
  issuerPartitaIva: 'issuer.partitaIva',
  issuerPartitaIvaInvalid: 'issuer.partitaIvaInvalid',
  issuerCodiceFiscale: 'issuer.codiceFiscale',
  issuerCodiceFiscaleInvalid: 'issuer.codiceFiscaleInvalid',
  issuerNip: 'issuer.nip',
  issuerNipChecksum: 'issuer.nipChecksum',

  recipientCompanyName: 'recipient.companyName',
  recipientCountry: 'recipient.country',
  recipientStreet: 'recipient.street',
  recipientPostcode: 'recipient.postcode',
  recipientCity: 'recipient.city',
  recipientVatNumberReverseCharge: 'recipient.vatNumberReverseCharge',
  recipientCui: 'recipient.cui',
  recipientCuiChecksum: 'recipient.cuiChecksum',
  recipientVatNumberRoFormat: 'recipient.vatNumberRoFormat',
  recipientCountyRegion: 'recipient.countyRegion',
  recipientSirenOrSiret: 'recipient.sirenOrSiret',
  recipientVatNumberFrFormat: 'recipient.vatNumberFrFormat',
  recipientEsTaxId: 'recipient.esTaxId',
  recipientEsTaxIdInvalid: 'recipient.esTaxIdInvalid',
  recipientPartitaIvaOrCodiceFiscale: 'recipient.partitaIvaOrCodiceFiscale',
  recipientPartitaIvaInvalid: 'recipient.partitaIvaInvalid',
  recipientCodiceFiscaleInvalid: 'recipient.codiceFiscaleInvalid',
  recipientSdiCodeOrPec: 'recipient.sdiCodeOrPec',
  recipientNip: 'recipient.nip',
  recipientNipChecksum: 'recipient.nipChecksum',
} as const;

export type EinvoiceMissingFieldCode =
  (typeof EINVOICE_MISSING_FIELD_CODES)[keyof typeof EINVOICE_MISSING_FIELD_CODES];

export interface EinvoiceReadiness {
  ready: boolean;
  missingFields: string[];
}

export function checkEinvoiceReadiness(document: DocumentDto): EinvoiceReadiness {
  if (!EINVOICE_DOCUMENT_TYPES.includes(document.documentType)) {
    return {
      ready: false,
      missingFields: [EINVOICE_MISSING_FIELD_CODES.documentType],
    };
  }

  const missingFields: string[] = [];

  if (document.number === null) missingFields.push(EINVOICE_MISSING_FIELD_CODES.documentNumber);
  if (document.issuedAt === null) missingFields.push(EINVOICE_MISSING_FIELD_CODES.documentIssuedAt);

  if (!document.issuer.companyName)
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerCompanyName);
  if (!document.issuer.country) missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerCountry);
  if (!document.issuer.street) missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerStreet);
  if (!document.issuer.postcode) missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerPostcode);
  if (!document.issuer.city) missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerCity);
  if (document.issuer.vatRegistered && !document.issuer.vatNumber) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.issuerVatNumber);
  }

  if (!document.recipient.companyName)
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientCompanyName);
  if (!document.recipient.country)
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientCountry);
  if (!document.recipient.street) missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientStreet);
  if (!document.recipient.postcode)
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientPostcode);
  if (!document.recipient.city) missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientCity);

  const hasReverseCharge = document.lineItems.some((line) => line.vatCategory === 'AE');
  if (hasReverseCharge && !document.recipient.vatNumber) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.recipientVatNumberReverseCharge);
  }

  const needsExemptionGround = document.lineItems.some(
    (line) => line.vatCategory !== 'S' && line.vatCategory !== 'Z',
  );
  if (needsExemptionGround && !document.vatExemptionGround) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.documentVatExemptionGround);
  }

  if (document.lineItems.length === 0) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.documentLineItems);
  }

  for (const line of document.lineItems) {
    if (!line.unitCode) missingFields.push(EINVOICE_MISSING_FIELD_CODES.lineUnitCode);
  }

  if (
    document.paymentMeansCode !== null &&
    REFERENCE_REQUIRED_PAYMENT_MEANS.includes(document.paymentMeansCode) &&
    !document.buyerReference
  ) {
    missingFields.push(EINVOICE_MISSING_FIELD_CODES.documentBuyerReference);
  }

  return { ready: missingFields.length === 0, missingFields };
}
