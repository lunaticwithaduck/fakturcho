export const DOCUMENT_INCLUDE = {
  lineItems: true,
  discounts: true,
  originalDocument: { include: { einvoiceTransmission: true } },
} as const;
