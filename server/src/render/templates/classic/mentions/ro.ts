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
  // art. 282 alin. (6): the cash-VAT system, and so the "TVA la încasare"
  // mention, applies per operation, not per invoice — it only excludes
  // supplies where the recipient owes the tax (reverse charge), exempt
  // supplies, and supplies whose place of supply is not Romania (out of
  // scope, intra-community, export). A mixed invoice that also has a line
  // actually taxed in Romania with VAT charged still needs the mention for
  // that line, so it prints as soon as ANY line qualifies; it is dropped
  // only when NO line does, or when the document already carries an
  // exemption ground.
  const hasRoTaxedLine = lineItems.some(
    (line) => line.vatRateBp > 0 && !['AE', 'E', 'O', 'K', 'G'].includes(line.vatCategory),
  );
  if (
    document.issuerVatOnCashBasis &&
    TAX_DOCUMENT_TYPES[toSharedDocumentType(document.documentType)] &&
    hasRoTaxedLine &&
    !document.vatExemptionGround
  ) {
    mentions.push(VAT_ON_CASH_BASIS_MENTION);
  }
  return mentions;
};
