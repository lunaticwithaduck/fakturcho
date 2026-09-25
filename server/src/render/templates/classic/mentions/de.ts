import type { MentionsBuilder } from './index';

// Kept in sync with the exemptionGrounds texts in
// packages/shared-types/src/countries/de.ts by hand, not by import — the same
// pattern as server/src/email/locale.ts, to keep this render lane out of
// shared-types.
//
// § 13b UStG only shifts liability to the recipient for domestic supplies
// (e.g. construction subcontracting). A cross-border B2B service has its
// place of supply at the customer under § 3a Abs. 2 UStG, so its liability
// note has to point to Art. 196 MwStSystRL instead.
const DOMESTIC_REVERSE_CHARGE_NOTE =
  'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG';
const CROSS_BORDER_REVERSE_CHARGE_NOTE =
  'Nicht im Inland steuerbare Leistung (§ 3a Abs. 2 UStG) – Steuerschuldnerschaft des Leistungsempfängers (Art. 196 MwStSystRL)';
const INTRA_COMMUNITY_SUPPLY_NOTE =
  'Steuerfreie innergemeinschaftliche Lieferung gemäß § 4 Nr. 1 Buchst. b i. V. m. § 6a UStG';

export const deMentions: MentionsBuilder = ({ document, lineItems }) => {
  const mentions: string[] = [];
  const crossBorder = Boolean(
    document.recipientCountry && document.recipientCountry !== document.issuerCountry,
  );
  const reverseChargeNote = crossBorder
    ? CROSS_BORDER_REVERSE_CHARGE_NOTE
    : DOMESTIC_REVERSE_CHARGE_NOTE;
  if (
    lineItems.some((line) => line.vatCategory === 'AE') &&
    document.vatExemptionGround !== reverseChargeNote
  ) {
    mentions.push(reverseChargeNote);
  }
  if (
    lineItems.some((line) => line.vatCategory === 'K') &&
    document.vatExemptionGround !== INTRA_COMMUNITY_SUPPLY_NOTE
  ) {
    mentions.push(INTRA_COMMUNITY_SUPPLY_NOTE);
  }
  return mentions;
};
