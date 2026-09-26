import { TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import { toSharedDocumentType } from '../../../prisma-mappers';
import { discountAdjustedVatGroups } from '../totals-block';
import type { MentionsBuilder } from './index';

const BOLLO_THRESHOLD_CENTS = 7747;
const BOLLO_TEXT =
  'Imposta di bollo assolta in modo virtuale ai sensi dell’art. 6 del D.M. 17 giugno 2014';
// Domestic reverse charge (art. 17 c.6) stays within IVA, so the alternativity principle
// exempts it from bollo; art. 7-ter services to EU customers are out of scope and owe it
// (Tariffa art. 13; Agenzia delle Entrate, consulenza giuridica 901-7/2013).

const INTRA_EU_TEXT =
  'Operazione non imponibile ai sensi dell’art. 41, comma 1, lett. a), D.L. 331/1993';
const REVERSE_CHARGE_DOMESTIC_TEXT =
  'Inversione contabile ai sensi dell’art. 17, comma 6, D.P.R. 633/1972';
const REVERSE_CHARGE_CROSS_BORDER_TEXT =
  'Inversione contabile – art. 7-ter, comma 1, lett. a), D.P.R. 633/1972';

export const itMentions: MentionsBuilder = ({ document, lineItems }) => {
  const mentions: string[] = [];
  const categories = new Set(lineItems.map((line) => line.vatCategory));

  if (categories.has('K')) mentions.push(INTRA_EU_TEXT);

  const crossBorder = Boolean(
    document.recipientCountry && document.recipientCountry !== document.issuerCountry,
  );
  if (categories.has('AE')) {
    mentions.push(crossBorder ? REVERSE_CHARGE_CROSS_BORDER_TEXT : REVERSE_CHARGE_DOMESTIC_TEXT);
  }

  const isTaxDocument = TAX_DOCUMENT_TYPES[toSharedDocumentType(document.documentType)];
  const excludedFromBollo = (category: string) =>
    category === 'K' || (category === 'AE' && !crossBorder);
  const groundExcluded =
    document.vatExemptionGround === INTRA_EU_TEXT ||
    document.vatExemptionGround === REVERSE_CHARGE_DOMESTIC_TEXT;
  const isMixed =
    new Set(lineItems.map((item) => `${item.vatCategory}:${item.vatRateBp}`)).size > 1;
  // Ris. AdE 444/E/2008: on a mixed invoice, bollo is due once the sum of the
  // untaxed lines (excluding domestic reverse charge and art. 41 goods, which
  // stay within IVA's alternativity principle) exceeds the threshold — not
  // the whole invoice total.
  const untaxedAmount = isMixed
    ? discountAdjustedVatGroups(document, lineItems)
        .filter((group) => group.rateBp === 0 && !excludedFromBollo(group.vatCategory))
        .reduce((sum, group) => sum + group.taxableAmount, 0)
    : document.vatAmount === 0 && ![...categories].some(excludedFromBollo)
      ? document.amount
      : 0;

  if (isTaxDocument && !groundExcluded && untaxedAmount > BOLLO_THRESHOLD_CENTS) {
    mentions.push(BOLLO_TEXT);
  }

  return mentions.filter((mention) => mention !== document.vatExemptionGround);
};
