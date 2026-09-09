import type { Document, LineItem } from '@prisma/client';
import type { VatPresentation } from '../../../money/vat';
import { toSharedDocumentType } from '../../prisma-mappers';
import { buildIssuerBlock, buildSignatureRow } from './footer-blocks';
import { buildDatesBlock, buildRecipientBlock } from './header-blocks';
import type { ClassicLanguage } from './labels';
import { buildLineItemsTable } from './line-items';
import { resolveClassicLocale } from './locale';
import { buildStyles } from './styles';
import { buildTitle } from './title';
import { buildAmountWordsBlock, buildTotalsBlock } from './totals-block';
import { buildWatermark } from './watermark';

export interface ClassicTemplateInput {
  document: Document;
  lineItems: readonly LineItem[];
  presentation: VatPresentation;
  dualDisplayActive: boolean;
  isDraft: boolean;
  language: ClassicLanguage;
}

export function renderClassicTemplateHtml(input: ClassicTemplateInput): string {
  const { document, lineItems, presentation, dualDisplayActive, isDraft, language } = input;
  const locale = resolveClassicLocale(language);
  const documentType = toSharedDocumentType(document.documentType);
  const isQuote = documentType === 'quote';
  const number = document.number === null ? null : Number(document.number);
  const showBgnSuffix = dualDisplayActive && locale.showDualDisplay;

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
    ${buildDatesBlock(document, isQuote, locale)}
  </div>
  <div class="title">${buildTitle(documentType, document.numberPrefix, number, document.numberSuffix, locale)}</div>
  ${buildLineItemsTable(lineItems, locale)}
  ${buildAmountWordsBlock(document, locale)}
  ${buildTotalsBlock(document, presentation, showBgnSuffix, locale)}
  ${buildIssuerBlock(document, locale)}
  ${locale.showSignatureRow ? buildSignatureRow(document, locale) : ''}
</body>
</html>`;
}
