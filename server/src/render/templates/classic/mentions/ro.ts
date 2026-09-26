import { TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import { toSharedDocumentType } from '../../../prisma-mappers';
import type { MentionsBuilder } from './index';

// Codul fiscal art. 282 alin. (3)-(8): a supplier registered for the cash VAT
// scheme collects VAT on payment, not on invoicing, and art. 319 alin. (20)
// lit. p) requires the invoice to say so.
const VAT_ON_CASH_BASIS_MENTION = 'TVA la încasare';

// AE lines are only ever the cross-border EU B2B reverse charge (see
// server/src/vat-eu/reverse-charge.ts): the client is VAT-registered in
// another EU country, so art. 196 of the directive is the right citation.
// Art. 319 alin. (20) lit. m) of the Codul fiscal only requires the words
// "taxare inversă" to appear, not a specific article.
export const roMentions: MentionsBuilder = ({ document, lineItems, locale }) => {
  const mentions: string[] = [];
  const note = locale.labels.reverseChargeNote;
  const ground = document.vatExemptionGround ?? '';
  const notSubjectService = ground.includes('art. 278 alin. (2)');
  if (
    (lineItems.some((line) => line.vatCategory === 'AE') || notSubjectService) &&
    !ground.includes('Taxare inversă')
  ) {
    mentions.push(note);
  }
  // art. 282 alin. (6): the cash-VAT mention only makes sense on a supply that
  // is actually taxable in Romania with VAT charged — skip it on any line
  // that is reverse-charged, exempt, out of scope, intra-community or an
  // export, or when the document already carries an exemption ground.
  const hasUntaxedLine = lineItems.some((line) =>
    ['AE', 'E', 'O', 'K', 'G'].includes(line.vatCategory),
  );
  if (
    document.issuerVatOnCashBasis &&
    TAX_DOCUMENT_TYPES[toSharedDocumentType(document.documentType)] &&
    !hasUntaxedLine &&
    !document.vatExemptionGround
  ) {
    mentions.push(VAT_ON_CASH_BASIS_MENTION);
  }
  return mentions;
};
