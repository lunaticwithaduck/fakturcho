import { AT_VAT_NOTE_GROUNDS } from '@fakturcho/shared-types';
import type { ClassicLanguage } from '../labels';
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

// These grounds are AT's own statutory citations (German, since AT issues
// only in German) — a document issued in one of the app's other 6 languages
// still needs a note the reader can follow, so each ground gets a translated
// stand-in here. The ground itself (document.vatExemptionGround) is never
// translated, only the generated mention text.
const EU_B2B_SERVICE_NOTE_BY_LANGUAGE: Partial<Record<ClassicLanguage, string>> = {
  de: EU_B2B_SERVICE_NOTE,
  en: 'Reverse charge – place of supply at the recipient under § 3a Abs. 6 UStG 1994, VAT accounted for by the recipient, Art. 196 Directive 2006/112/EC',
  fr: 'Autoliquidation – lieu de la prestation chez le preneur (§ 3a Abs. 6 UStG 1994), TVA due par le preneur, art. 196 de la directive 2006/112/CE',
  it: 'Inversione contabile – luogo della prestazione presso il destinatario (§ 3a Abs. 6 UStG 1994), IVA dovuta dal destinatario, art. 196 della direttiva 2006/112/CE',
  pl: 'Odwrotne obciążenie – miejsce świadczenia u nabywcy (§ 3a Abs. 6 UStG 1994), podatek rozlicza nabywca, art. 196 dyrektywy 2006/112/WE',
  ro: 'Taxare inversă – locul prestării la beneficiar (§ 3a Abs. 6 UStG 1994), TVA datorată de beneficiar, art. 196 din Directiva 2006/112/CE',
  bg: 'Обратно начисляване – мястото на доставка е при получателя (§ 3a Abs. 6 UStG 1994), данъкът се дължи от получателя, чл. 196 от Директива 2006/112/ЕО',
};
const DOMESTIC_REVERSE_CHARGE_GENERIC_NOTE_BY_LANGUAGE: Partial<Record<ClassicLanguage, string>> = {
  de: DOMESTIC_REVERSE_CHARGE_GENERIC_NOTE,
  en: 'Reverse charge – VAT to be accounted for by the recipient (§ 19 UStG 1994)',
  fr: 'Autoliquidation – TVA due par le preneur (§ 19 UStG 1994)',
  it: 'Inversione contabile – IVA dovuta dal destinatario (§ 19 UStG 1994)',
  pl: 'Odwrotne obciążenie – podatek rozlicza nabywca (§ 19 UStG 1994)',
  ro: 'Taxare inversă – TVA datorată de beneficiar (§ 19 UStG 1994)',
  bg: 'Обратно начисляване – данъкът се дължи от получателя (§ 19 UStG 1994)',
};
const INTRA_COMMUNITY_SUPPLY_NOTE_BY_LANGUAGE: Partial<Record<ClassicLanguage, string>> = {
  de: INTRA_COMMUNITY_SUPPLY_NOTE,
  en: 'Intra-Community supply, Article 138 of Council Directive 2006/112/EC (Art. 6 Abs. 1 iVm Art. 7 UStG 1994)',
  fr: 'Livraison intracommunautaire exonérée, article 138 de la directive 2006/112/CE (Art. 6 Abs. 1 iVm Art. 7 UStG 1994)',
  it: 'Cessione intracomunitaria esente, articolo 138 della direttiva 2006/112/CE (Art. 6 Abs. 1 iVm Art. 7 UStG 1994)',
  pl: 'Wewnątrzwspólnotowa dostawa towarów zwolniona z VAT, art. 138 dyrektywy 2006/112/WE (Art. 6 Abs. 1 iVm Art. 7 UStG 1994)',
  ro: 'Livrare intracomunitară scutită, art. 138 din Directiva 2006/112/CE (Art. 6 Abs. 1 iVm Art. 7 UStG 1994)',
  bg: 'Вътреобщностна доставка, освободена от ДДС, чл. 138 от Директива 2006/112/ЕО (Art. 6 Abs. 1 iVm Art. 7 UStG 1994)',
};

export const atMentions: MentionsBuilder = ({ document, lineItems, locale }) => {
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
      const noteMap = crossBorder
        ? EU_B2B_SERVICE_NOTE_BY_LANGUAGE
        : DOMESTIC_REVERSE_CHARGE_GENERIC_NOTE_BY_LANGUAGE;
      const fallback = crossBorder ? EU_B2B_SERVICE_NOTE : DOMESTIC_REVERSE_CHARGE_GENERIC_NOTE;
      mentions.push(noteMap[locale.language] ?? fallback);
    }
  }
  if (
    lineItems.some((line) => line.vatCategory === 'K') &&
    ground !== INTRA_COMMUNITY_SUPPLY_NOTE
  ) {
    mentions.push(
      INTRA_COMMUNITY_SUPPLY_NOTE_BY_LANGUAGE[locale.language] ?? INTRA_COMMUNITY_SUPPLY_NOTE,
    );
  }
  return mentions;
};
