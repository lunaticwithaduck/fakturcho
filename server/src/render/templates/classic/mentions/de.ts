import type { MentionsBuilder } from './index';

// Kept in sync with the exemptionGrounds texts in
// packages/shared-types/src/countries/de.ts by hand, not by import — the same
// pattern as server/src/email/locale.ts, to keep this render lane out of
// shared-types.
const REVERSE_CHARGE_NOTE = 'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG';
const INTRA_COMMUNITY_SUPPLY_NOTE =
  'Steuerfreie innergemeinschaftliche Lieferung gemäß § 4 Nr. 1 Buchst. b i. V. m. § 6a UStG';

export const deMentions: MentionsBuilder = ({ document, lineItems }) => {
  const mentions: string[] = [];
  if (
    lineItems.some((line) => line.vatCategory === 'AE') &&
    document.vatExemptionGround !== REVERSE_CHARGE_NOTE
  ) {
    mentions.push(REVERSE_CHARGE_NOTE);
  }
  if (
    lineItems.some((line) => line.vatCategory === 'K') &&
    document.vatExemptionGround !== INTRA_COMMUNITY_SUPPLY_NOTE
  ) {
    mentions.push(INTRA_COMMUNITY_SUPPLY_NOTE);
  }
  return mentions;
};
