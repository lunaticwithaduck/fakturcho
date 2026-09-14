import { TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import { toSharedDocumentType } from '../../../prisma-mappers';
import type { MentionsBuilder } from './index';

const BOLLO_THRESHOLD_CENTS = 7747;
const BOLLO_TEXT =
  "Imposta di bollo assolta in modo virtuale ai sensi dell'art. 15 della Tariffa, Parte I, allegata al D.P.R. 642/1972 e del D.M. 17/06/2014";
const BOLLO_EXCLUDED_CATEGORIES = new Set(['AE', 'K', 'G']);

const INTRA_EU_TEXT =
  "Operazione non imponibile ai sensi dell'art. 41, comma 1, lett. a), D.L. 331/1993";
const REVERSE_CHARGE_DOMESTIC_TEXT =
  "Inversione contabile ai sensi dell'art. 17, comma 6, D.P.R. 633/1972";
const REVERSE_CHARGE_CROSS_BORDER_TEXT =
  "Inversione contabile ai sensi dell'art. 7-ter, D.P.R. 633/1972";

export const itMentions: MentionsBuilder = ({ document, lineItems }) => {
  const mentions: string[] = [];
  const categories = new Set(lineItems.map((line) => line.vatCategory));

  if (categories.has('K')) mentions.push(INTRA_EU_TEXT);

  if (categories.has('AE')) {
    const crossBorder = Boolean(
      document.recipientCountry && document.recipientCountry !== document.issuerCountry,
    );
    mentions.push(crossBorder ? REVERSE_CHARGE_CROSS_BORDER_TEXT : REVERSE_CHARGE_DOMESTIC_TEXT);
  }

  const isTaxDocument = TAX_DOCUMENT_TYPES[toSharedDocumentType(document.documentType)];
  const noneExcluded = [...categories].every(
    (category) => !BOLLO_EXCLUDED_CATEGORIES.has(category),
  );
  if (
    isTaxDocument &&
    noneExcluded &&
    document.vatAmount === 0 &&
    document.amount > BOLLO_THRESHOLD_CENTS
  ) {
    mentions.push(BOLLO_TEXT);
  }

  return mentions;
};
