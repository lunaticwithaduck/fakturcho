import type { Discount, Document, LineItem } from '@prisma/client';
import type { VatPresentation } from '../../../money/vat';
import { toSharedDocumentType } from '../../prisma-mappers';
import { buildIssuerBlock, buildSignatureRow } from './footer-blocks';
import { buildDatesBlock, buildRecipientBlock } from './header-blocks';
import type { ClassicLanguage } from './labels';
import { buildLineItemsTable } from './line-items';
import { resolveClassicLocale } from './locale';
import { buildMentionsBlock } from './mentions-block';
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
  ${buildWatermark(isDraft, locale)}
  <div class="header">
    ${buildRecipientBlock(document, locale)}
    ${buildDatesBlock(document, documentType, locale)}
  </div>
  <div class="title">${buildTitle(documentType, document.numberPrefix, number, document.numberSuffix, locale)}</div>
  ${buildLineItemsTable(lineItems, locale, showPrices)}
  ${isDeliveryNote ? buildTransportBlock(document, locale) : ''}
  ${
    showPrices
      ? `${buildAmountWordsBlock(document, locale)}${buildTotalsBlock(document, lineItems, presentation, locale, discounts)}`
      : ''
  }
  ${buildMentionsBlock({ document, lineItems, locale })}
  ${buildIssuerBlock(document, locale)}
  ${locale.showSignatureRow || isDeliveryNote ? buildSignatureRow(document, locale) : ''}
</body>
</html>`;
}
