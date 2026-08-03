import type { SaveDraftRequest } from '@fakturcho/shared-types';
import type { Prisma } from '@prisma/client';
import { computeDocumentTotals } from '../money/totals';
import { toPrismaDocumentType } from '../numbering/document-type.mapper';
import { parseDateOnly } from './date.util';
import { resolveVatTreatment } from './vat-treatment';

export function buildDraftData(
  accountId: string,
  request: SaveDraftRequest,
  vatRegistered: boolean,
): Prisma.DocumentUncheckedCreateInput {
  const vat = resolveVatTreatment({
    documentType: request.documentType,
    vatRegistered,
    requestedGround: request.vatExemptionGround ?? null,
  });

  const totals = computeDocumentTotals({
    lineItems: request.lineItems.map((line) => ({
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })),
    discounts: (request.discounts ?? []).map((discount) => ({
      percentBp: discount.percentBp ?? null,
      amount: discount.amount ?? null,
    })),
    vatCharged: vat.vatCharged,
    vatRateBp: vat.vatRateBp,
    vatIncluded: request.vatIncluded ?? false,
  });

  return {
    accountId,
    documentType: toPrismaDocumentType(request.documentType),
    referenceNumber: request.referenceNumber ?? null,
    originalDocumentId: request.originalDocumentId ?? null,
    taxEventAt: parseDateOnly(request.taxEventAt),
    dueAt: parseDateOnly(request.dueAt),
    validUntil: parseDateOnly(request.validUntil),
    vatIncluded: request.vatIncluded ?? false,
    vatRateBp: vat.vatRateBp,
    vatExemptionGround: vat.vatExemptionGround,
    clientId: request.clientId ?? null,
    preparedBy: request.preparedBy ?? null,
    notes: request.notes ?? null,
    emailText: request.emailText ?? null,
    templateId: request.templateId ?? 'classic',
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    vatAmount: totals.vatAmount,
    amount: totals.amount,
  };
}
