import type { Discount, Document, LineItem } from '@prisma/client';
import type { VatPresentation } from '../../../money/vat';
import { toSharedDocumentType } from '../../prisma-mappers';
import { buildCorrectionReference, type OriginalDocumentRef } from './correction-reference';
import { buildIssuerBlock, buildSignatureRow } from './footer-blocks';
import { buildDatesBlock, buildRecipientBlock } from './header-blocks';
import type { ClassicLanguage } from './labels';
import { buildLineItemsTable } from './line-items';
import { resolveClassicLocale } from './locale';
import { buildMentionsBlock } from './mentions-block';
import { buildKsefQrBlock, type KsefQrBlock } from './qr-block';
import { buildStyles } from './styles';
import { buildTitle } from './title';
import { buildAmountWordsBlock, buildTotalsBlock } from './totals-block';
import { buildTransportBlock } from './transport-block';
import { buildWatermark } from './watermark';

export interface ClassicTemplateInput {
  document: Document;
  lineItems: readonly LineItem[];
  presentation: VatPresentation;
  isDraft: boolean;
  language: ClassicLanguage;
  issuerCountry?: string | null;
  discounts?: readonly Discount[];
  originalDocument?: OriginalDocumentRef | null;
  ksefQr?: KsefQrBlock | null;
}

export function renderClassicTemplateHtml(input: ClassicTemplateInput): string {
  const {
    document,
    lineItems,
    presentation,
    isDraft,
    language,
    issuerCountry = document.issuerCountry,
    discounts = [],
    originalDocument = null,
    ksefQr = null,
  } = input;
  const locale = resolveClassicLocale(language, issuerCountry);
  const documentType = toSharedDocumentType(document.documentType);
  const isDeliveryNote = documentType === 'delivery_note';
  const showPrices = !isDeliveryNote || locale.showDeliveryNotePrices;
  const number = document.number === null ? null : Number(document.number);

  return `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <style>${buildStyles()}</style>
</head>
<body>
  <div class="watermark-area${isDraft ? ' is-draft' : ''}">
    ${buildWatermark(isDraft, locale)}
    <div class="header">
      ${buildRecipientBlock(document, documentType, locale)}
      ${buildDatesBlock(document, documentType, locale)}
    </div>
    <div class="title">${buildTitle(documentType, document.numberPrefix, number, document.numberSuffix, locale)}</div>
    ${buildCorrectionReference(documentType, originalDocument, document.correctionReason, locale)}
    ${buildLineItemsTable(lineItems, locale, documentType, showPrices, document.issuerVatRegistered ?? false)}
    ${isDeliveryNote ? buildTransportBlock(document, locale) : ''}
    ${
      showPrices
        ? `${isDeliveryNote ? '' : buildAmountWordsBlock(document, locale)}${buildTotalsBlock(document, lineItems, presentation, locale, documentType, discounts)}`
        : ''
    }
  </div>
  ${buildMentionsBlock({ document, lineItems, locale, originalDocumentAmount: originalDocument?.amount ?? null })}
  ${buildIssuerBlock(document, documentType, locale)}
  ${buildKsefQrBlock(ksefQr)}
  ${locale.showSignatureRow || isDeliveryNote ? buildSignatureRow(document, documentType, locale) : ''}
</body>
</html>`;
}
