import type { CurrencyCode, DiscountDto, DocumentDto, LineItemDto } from '@fakturcho/shared-types';
import type {
  Discount as PrismaDiscount,
  Document as PrismaDocument,
  LineItem as PrismaLineItem,
} from '@prisma/client';
import { fromPrismaDocumentType } from '../numbering/document-type.mapper';
import { toDisplayStatus } from './document-status.mapper';

type DocumentWithRelations = PrismaDocument & {
  lineItems: PrismaLineItem[];
  discounts: PrismaDiscount[];
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
    issuedAt: toIsoDate(document.issuedAt),
    taxEventAt: toIsoDate(document.taxEventAt),
    dueAt: toIsoDate(document.dueAt),
    validUntil: toIsoDate(document.validUntil),
    subtotal: document.subtotal,
    discountTotal: document.discountTotal,
    amount: document.amount,
    vatIncluded: document.vatIncluded,
    vatRateBp: document.vatRateBp,
    vatAmount: document.vatAmount,
    vatExemptionGround: document.vatExemptionGround,
    currency: document.currency as CurrencyCode,
    clientId: document.clientId,
    preparedBy: document.preparedBy,
    notes: document.notes,
    emailText: document.emailText,
    emailedAt: document.emailedAt ? document.emailedAt.toISOString() : null,
    templateId: document.templateId,
    issuer: {
      companyName: document.issuerCompanyName,
      eik: document.issuerEik,
      mol: document.issuerMol,
      addressLine: document.issuerAddressLine,
      city: document.issuerCity,
      phone: document.issuerPhone,
      vatRegistered: document.issuerVatRegistered,
      vatNumber: document.issuerVatNumber,
      bankName: document.issuerBankName,
      iban: document.issuerIban,
      bic: document.issuerBic,
      altIban: document.issuerAltIban,
    },
    recipient: {
      companyName: document.recipientCompanyName,
      eik: document.recipientEik,
      vatNumber: document.recipientVatNumber,
      address: document.recipientAddress,
      email: document.recipientEmail,
      mol: document.recipientMol,
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

function toLineItemDto(item: PrismaLineItem): LineItemDto {
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity.toString(),
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    sortOrder: item.sortOrder,
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
