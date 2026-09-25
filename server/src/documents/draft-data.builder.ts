import {
  type Cents,
  getCountryConfig,
  roundHalfUp,
  type SaveDraftRequest,
  type VatCategory,
} from '@fakturcho/shared-types';
import type { Prisma } from '@prisma/client';
import { computeDocumentTotals, computeLineTotal, type DocumentTotals } from '../money/totals';
import { toPrismaDocumentType } from '../numbering/document-type.mapper';
import { computeVatSubtotals } from '../vat-eu/subtotals';
import { parseDateOnly } from './date.util';
import { parseTransportedAt } from './timezone.util';
import type { VatTreatment } from './vat-treatment';

export interface ResolvedDraftLineItem {
  quantity: string;
  unitPrice: Cents;
  vatCategory: VatCategory;
  vatRateBp: number;
}

interface DraftDiscountInput {
  percentBp?: number | null;
  amount?: Cents | null;
}

function hasExplicitLineVat(request: SaveDraftRequest): boolean {
  return request.lineItems.some(
    (line) => line.vatCategory !== undefined || line.vatRateBp !== undefined,
  );
}

function distributeDiscount<T extends { lineTotal: Cents }>(
  lines: readonly T[],
  discountTotal: Cents,
  subtotal: Cents,
): T[] {
  let allocated = 0;
  let cumulativeExact = 0;
  return lines.map((line, index) => {
    cumulativeExact += (line.lineTotal * discountTotal) / subtotal;
    const cumulativeRounded =
      index === lines.length - 1 ? discountTotal : roundHalfUp(cumulativeExact, 0);
    const lineDiscount = cumulativeRounded - allocated;
    allocated = cumulativeRounded;
    return { ...line, lineTotal: line.lineTotal - lineDiscount };
  });
}

function computeGroupedTotals(
  lines: readonly ResolvedDraftLineItem[],
  discounts: readonly DraftDiscountInput[],
  vatIncluded: boolean,
): DocumentTotals {
  const rawLines = lines.map((line) => {
    const grossLineTotal = computeLineTotal(line.quantity, line.unitPrice);
    const lineTotal =
      vatIncluded && line.vatRateBp > 0
        ? roundHalfUp((grossLineTotal * 10000) / (10000 + line.vatRateBp), 0)
        : grossLineTotal;
    return { lineTotal, vatRateBp: line.vatRateBp, vatCategory: line.vatCategory };
  });

  const subtotal = rawLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const discountTotal = discounts.reduce((sum, discount) => {
    if (discount.percentBp != null) {
      return sum + roundHalfUp((subtotal * discount.percentBp) / 10000, 0);
    }
    return sum + (discount.amount ?? 0);
  }, 0);

  const discountedLines =
    discountTotal === 0 || subtotal === 0
      ? rawLines
      : distributeDiscount(rawLines, discountTotal, subtotal);

  const groups = computeVatSubtotals(discountedLines);
  const vatAmount = groups.reduce((sum, group) => sum + group.vatAmount, 0);
  const discountedSubtotal = groups.reduce((sum, group) => sum + group.taxableAmount, 0);

  return { subtotal, discountTotal, vatAmount, amount: discountedSubtotal + vatAmount };
}

export function buildDraftData(
  accountId: string,
  request: SaveDraftRequest,
  vat: VatTreatment,
  resolvedLineItems: readonly ResolvedDraftLineItem[],
  issuerCountry: string,
): Prisma.DocumentUncheckedCreateInput {
  const discounts = (request.discounts ?? []).map((discount) => ({
    percentBp: discount.percentBp ?? null,
    amount: discount.amount ?? null,
  }));

  const hasReverseChargedLine = resolvedLineItems.some((line) => line.vatCategory === 'AE');
  const useFlatTotals = !hasExplicitLineVat(request) && !hasReverseChargedLine;

  const totals = useFlatTotals
    ? computeDocumentTotals({
        lineItems: request.lineItems.map((line) => ({
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
        discounts,
        vatCharged: vat.vatCharged,
        vatRateBp: vat.vatRateBp,
        vatIncluded: request.vatIncluded ?? false,
      })
    : computeGroupedTotals(resolvedLineItems, discounts, request.vatIncluded ?? false);

  return {
    accountId,
    documentType: toPrismaDocumentType(request.documentType),
    referenceNumber: request.referenceNumber ?? null,
    originalDocumentId: request.originalDocumentId ?? null,
    taxEventAt: parseDateOnly(request.taxEventAt),
    dueAt: parseDateOnly(request.dueAt),
    validUntil: parseDateOnly(request.validUntil),
    deliveryDate: parseDateOnly(request.deliveryDate),
    buyerReference: request.buyerReference ?? null,
    paymentMeansCode: request.paymentMeansCode ?? null,
    paymentTermsNote: request.paymentTermsNote ?? null,
    transportReason: request.transportReason ?? null,
    transportedAt: parseTransportedAt(
      request.transportedAt,
      getCountryConfig(issuerCountry).timeZone,
    ),
    carrierName: request.carrierName ?? null,
    transportNote: request.transportNote ?? null,
    correctionReason: request.correctionReason ?? null,
    operationNature: request.operationNature ?? null,
    deliveryAddress: request.deliveryAddress ?? null,
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
