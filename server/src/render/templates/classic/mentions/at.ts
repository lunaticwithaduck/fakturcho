import { AT_VAT_NOTE_GROUNDS } from '@fakturcho/shared-types';
import type { MentionsBuilder } from './index';

// Kept in sync by hand with packages/shared-types/src/countries/at.ts (see
// that file's comment). § 11 Abs. 1a UStG 1994: every reverse-charged line
// must point to the recipient's liability; which exact ground applies is
// selected document-wide via the normal exemptionGrounds picker (the same
// mechanism every other country uses), so this builder only has to fall back
// to a generic note when the document doesn't already carry one of the more
// specific AT_VAT_NOTE_GROUNDS as its vatExemptionGround.
const EU_B2B_SERVICE_NOTE = AT_VAT_NOTE_GROUNDS[0];
const DOMESTIC_REVERSE_CHARGE_GENERIC_NOTE = AT_VAT_NOTE_GROUNDS[2];
const DOMESTIC_REVERSE_CHARGE_NOTES: readonly string[] = AT_VAT_NOTE_GROUNDS.slice(2);
// BMR Art. 6 Abs. 1 iVm Art. 7 UStG 1994.
const INTRA_COMMUNITY_SUPPLY_NOTE =
  'Steuerfreie innergemeinschaftliche Lieferung gemäß Art. 6 Abs. 1 iVm Art. 7 UStG 1994 (Binnenmarktregelung).';

export const atMentions: MentionsBuilder = ({ document, lineItems }) => {
  const mentions: string[] = [];
  const crossBorder = Boolean(
    document.recipientCountry && document.recipientCountry !== document.issuerCountry,
  );
  const ground = document.vatExemptionGround;
  if (lineItems.some((line) => line.vatCategory === 'AE')) {
    const alreadyShown = crossBorder
      ? ground === EU_B2B_SERVICE_NOTE
      : ground !== null && DOMESTIC_REVERSE_CHARGE_NOTES.includes(ground);
    if (!alreadyShown) {
      mentions.push(crossBorder ? EU_B2B_SERVICE_NOTE : DOMESTIC_REVERSE_CHARGE_GENERIC_NOTE);
    }
  }
  if (
    lineItems.some((line) => line.vatCategory === 'K') &&
    ground !== INTRA_COMMUNITY_SUPPLY_NOTE
  ) {
    mentions.push(INTRA_COMMUNITY_SUPPLY_NOTE);
  }
  return mentions;
};
