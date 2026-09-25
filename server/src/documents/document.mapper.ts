import type {
  CurrencyCode,
  DiscountDto,
  DocumentDto,
  ExchangeRateSource,
  LineItemDto,
  OperationNature,
  OriginalDocumentReferenceDto,
} from '@fakturcho/shared-types';
import type {
  Discount as PrismaDiscount,
  Document as PrismaDocument,
  EinvoiceTransmission as PrismaEinvoiceTransmission,
  LineItem as PrismaLineItem,
} from '@prisma/client';
import { readIdentifiers } from '../issuer/identifiers';
import { fromPrismaDocumentType } from '../numbering/document-type.mapper';
import { toDisplayStatus } from './document-status.mapper';

type DocumentWithRelations = PrismaDocument & {
  lineItems: PrismaLineItem[];
  discounts: PrismaDiscount[];
  originalDocument:
    | (PrismaDocument & { einvoiceTransmission: PrismaEinvoiceTransmission | null })
    | null;
};

export function toDocumentDto(
  document: DocumentWithRelations,
  today: Date = new Date(),
): DocumentDto {
  return {
    id: document.id,
    documentType: fromPrismaDocumentType(document.documentType),
    status: toDisplayStatus(document.status, document.dueAt, today),
    number: document.number !== null ? Number(document.number) : null,
    numberPrefix: document.numberPrefix,
    numberSuffix: document.numberSuffix,
    referenceNumber: document.referenceNumber,
    originalDocumentId: document.originalDocumentId,
    originalDocument: toOriginalDocumentReferenceDto(document.originalDocument),
    ksefNumber: document.ksefNumber,
    issuedAt: toIsoDate(document.issuedAt),
    taxEventAt: toIsoDate(document.taxEventAt),
    dueAt: toIsoDate(document.dueAt),
    validUntil: toIsoDate(document.validUntil),
    deliveryDate: toIsoDate(document.deliveryDate),
    buyerReference: document.buyerReference,
    paymentMeansCode: document.paymentMeansCode,
    paymentTermsNote: document.paymentTermsNote,
    transportReason: document.transportReason,
    transportedAt: document.transportedAt ? document.transportedAt.toISOString() : null,
    carrierName: document.carrierName,
    transportNote: document.transportNote,
    correctionReason: document.correctionReason,
    operationNature: document.operationNature as OperationNature | null,
    deliveryAddress: document.deliveryAddress,
    subtotal: document.subtotal,
    discountTotal: document.discountTotal,
    amount: document.amount,
    vatIncluded: document.vatIncluded,
    vatRateBp: document.vatRateBp,
    vatAmount: document.vatAmount,
    vatExemptionGround: document.vatExemptionGround,
    currency: document.currency as CurrencyCode,
    localCurrency: document.localCurrency,
    exchangeRate: document.exchangeRate,
    exchangeRateDate: toIsoDate(document.exchangeRateDate),
    exchangeRateSource: document.exchangeRateSource as ExchangeRateSource | null,
    exchangeRateTable: document.exchangeRateTable,
    vatAmountLocal: document.vatAmountLocal,
    clientId: document.clientId,
    preparedBy: document.preparedBy,
    notes: document.notes,
    emailText: document.emailText,
    emailedAt: document.emailedAt ? document.emailedAt.toISOString() : null,
    templateId: document.templateId,
    documentLanguage: document.documentLanguage as DocumentDto['documentLanguage'],
    issuer: {
      companyName: document.issuerCompanyName,
      eik: document.issuerEik,
      mol: document.issuerMol,
      addressLine: document.issuerAddressLine,
      street: document.issuerStreet,
      postcode: document.issuerPostcode,
      countyRegion: document.issuerCountyRegion,
      city: document.issuerCity,
      country: document.issuerCountry,
      phone: document.issuerPhone,
      vatRegistered: document.issuerVatRegistered,
      vatNumber: document.issuerVatNumber,
      bankName: document.issuerBankName,
      iban: document.issuerIban,
      bic: document.issuerBic,
      altIban: document.issuerAltIban,
      identifiers: readIdentifiers(document.issuerIdentifiers),
    },
    recipient: {
      companyName: document.recipientCompanyName,
      eik: document.recipientEik,
      vatNumber: document.recipientVatNumber,
      address: document.recipientAddress,
      street: document.recipientStreet,
      postcode: document.recipientPostcode,
      countyRegion: document.recipientCountyRegion,
      city: document.recipientCity,
      country: document.recipientCountry,
      email: document.recipientEmail,
      mol: document.recipientMol,
      sdiRecipientCode: document.recipientSdiRecipientCode,
      pec: document.recipientPec,
    },
    lineItems: document.lineItems.map(toLineItemDto).sort((a, b) => a.sortOrder - b.sortOrder),
    discounts: document.discounts.map(toDiscountDto).sort((a, b) => a.sortOrder - b.sortOrder),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

function toIsoDate(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

function toOriginalDocumentReferenceDto(
  original: (PrismaDocument & { einvoiceTransmission: PrismaEinvoiceTransmission | null }) | null,
): OriginalDocumentReferenceDto | null {
  if (!original) return null;
  return {
    number: original.number !== null ? Number(original.number) : null,
    numberPrefix: original.numberPrefix,
    numberSuffix: original.numberSuffix,
    issuedAt: toIsoDate(original.issuedAt),
    ksefNumber: readKsefNumber(original.einvoiceTransmission),
  };
}

function readKsefNumber(transmission: PrismaEinvoiceTransmission | null): string | null {
  if (transmission?.provider !== 'ksef' || !transmission.receipt) return null;
  try {
    const receipt = JSON.parse(transmission.receipt) as { ksefNumber?: string | null };
    return receipt.ksefNumber ?? null;
  } catch {
    return null;
  }
}

function toLineItemDto(item: PrismaLineItem): LineItemDto {
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity.toString(),
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    sortOrder: item.sortOrder,
    vatRateBp: item.vatRateBp,
    vatCategory: item.vatCategory as LineItemDto['vatCategory'],
    unitCode: item.unitCode,
  };
}

function toDiscountDto(discount: PrismaDiscount): DiscountDto {
  return {
    id: discount.id,
    label: discount.label,
    percentBp: discount.percentBp,
    amount: discount.amount,
    sortOrder: discount.sortOrder,
  };
}
