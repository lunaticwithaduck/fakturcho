import type { Document, LineItem } from '@prisma/client';
import type { VatPresentation } from '../../../money/vat';
import { toSharedDocumentType } from '../../prisma-mappers';
import { buildIssuerBlock, buildSignatureRow } from './footer-blocks';
import { buildDatesBlock, buildRecipientBlock } from './header-blocks';
import { buildLineItemsTable } from './line-items';
import { buildStyles } from './styles';
import { buildTitle } from './title';
import { buildAmountWordsBlock, buildTotalsBlock } from './totals-block';

export interface ClassicTemplateInput {
  document: Document;
  lineItems: readonly LineItem[];
  presentation: VatPresentation;
  dualDisplayActive: boolean;
}

export function renderClassicTemplateHtml(input: ClassicTemplateInput): string {
  const { document, lineItems, presentation, dualDisplayActive } = input;
  const documentType = toSharedDocumentType(document.documentType);
  const isQuote = documentType === 'quote';
  const number = document.number === null ? null : Number(document.number);

  return `<!doctype html>
<html lang="bg">
<head>
  <meta charset="utf-8" />
  <style>${buildStyles()}</style>
</head>
<body>
  <div class="header">
    ${buildRecipientBlock(document)}
    ${buildDatesBlock(document, isQuote)}
  </div>
  <div class="title">${buildTitle(documentType, document.numberPrefix, number, document.numberSuffix)}</div>
  ${buildLineItemsTable(lineItems)}
  ${buildAmountWordsBlock(document)}
  ${buildTotalsBlock(document, presentation, dualDisplayActive)}
  ${buildIssuerBlock(document)}
  ${buildSignatureRow(document)}
</body>
</html>`;
}
