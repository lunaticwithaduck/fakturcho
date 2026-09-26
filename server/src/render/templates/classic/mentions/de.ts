import type { ClassicLanguage } from '../labels';
import type { MentionsBuilder } from './index';

// Kept in sync with the exemptionGrounds texts in
// packages/shared-types/src/countries/de.ts by hand, not by import — the same
// pattern as server/src/email/locale.ts, to keep this render lane out of
// shared-types.
//
// § 13b UStG only shifts liability to the recipient for domestic supplies
// (e.g. construction subcontracting). A cross-border B2B service has its
// place of supply at the customer under § 3a Abs. 2 UStG, so its liability
// note has to point to Art. 196 MwStSystRL instead. These two exact German
// strings are also what document.vatExemptionGround carries when the ground
// itself already states the note (a legal citation, so it always stays in
// German regardless of the document language) — only the printed MENTION
// below is translated for a non-German document.
const DOMESTIC_REVERSE_CHARGE_GROUND =
  'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG';
const CROSS_BORDER_REVERSE_CHARGE_GROUND =
  'Nicht im Inland steuerbare Leistung (§ 3a Abs. 2 UStG) – Steuerschuldnerschaft des Leistungsempfängers (Art. 196 MwStSystRL)';
const INTRA_COMMUNITY_SUPPLY_GROUND =
  'Steuerfreie innergemeinschaftliche Lieferung gemäß § 4 Nr. 1 Buchst. b i. V. m. § 6a UStG';

// § 13b UStG has no EU-directive-level equivalent citation (it is Germany's
// own domestic anti-fraud reverse charge, Art. 199/199a of the directive
// depending on the sector) — unlike the cross-border case, there is no
// existing generic ClassicLabels field to reuse, so this is its own small
// per-language table.
const DOMESTIC_REVERSE_CHARGE_NOTE_BY_LANGUAGE: Partial<Record<ClassicLanguage, string>> = {
  de: DOMESTIC_REVERSE_CHARGE_GROUND,
  en: 'Reverse charge – VAT to be accounted for by the recipient (§ 13b UStG)',
  fr: 'Autoliquidation – la TVA est due par le preneur (§ 13b UStG)',
  it: 'Inversione contabile – l’IVA è dovuta dal destinatario (§ 13b UStG)',
  pl: 'Odwrotne obciążenie – podatek rozlicza nabywca (§ 13b UStG)',
  ro: 'Taxare inversă – TVA datorată de beneficiar (§ 13b UStG)',
  bg: 'Обратно начисляване – данъкът се дължи от получателя (§ 13b UStG)',
};
// § 4 Nr. 1 Buchst. b i. V. m. § 6a UStG implements Art. 138 of the directive.
const INTRA_COMMUNITY_SUPPLY_NOTE_BY_LANGUAGE: Partial<Record<ClassicLanguage, string>> = {
  de: INTRA_COMMUNITY_SUPPLY_GROUND,
  en: 'Intra-Community supply, Article 138 of Council Directive 2006/112/EC (§ 4 Nr. 1 Buchst. b, § 6a UStG)',
  fr: 'Livraison intracommunautaire exonérée, article 138 de la directive 2006/112/CE (§ 4 Nr. 1 Buchst. b, § 6a UStG)',
  it: 'Cessione intracomunitaria esente, articolo 138 della direttiva 2006/112/CE (§ 4 Nr. 1 Buchst. b, § 6a UStG)',
  pl: 'Wewnątrzwspólnotowa dostawa towarów zwolniona z VAT, art. 138 dyrektywy 2006/112/WE (§ 4 Nr. 1 Buchst. b, § 6a UStG)',
  ro: 'Livrare intracomunitară scutită, art. 138 din Directiva 2006/112/CE (§ 4 Nr. 1 Buchst. b, § 6a UStG)',
  bg: 'Вътреобщностна доставка, освободена от ДДС, чл. 138 от Директива 2006/112/ЕО (§ 4 Nr. 1 Buchst. b, § 6a UStG)',
};

export const deMentions: MentionsBuilder = ({ document, lineItems, locale }) => {
  const mentions: string[] = [];
  const crossBorder = Boolean(
    document.recipientCountry && document.recipientCountry !== document.issuerCountry,
  );
  const reverseChargeGround = crossBorder
    ? CROSS_BORDER_REVERSE_CHARGE_GROUND
    : DOMESTIC_REVERSE_CHARGE_GROUND;
  const reverseChargeNote = crossBorder
    ? locale.labels.reverseChargeNote
    : (DOMESTIC_REVERSE_CHARGE_NOTE_BY_LANGUAGE[locale.language] ?? DOMESTIC_REVERSE_CHARGE_GROUND);
  if (
    lineItems.some((line) => line.vatCategory === 'AE') &&
    document.vatExemptionGround !== reverseChargeGround
  ) {
    mentions.push(reverseChargeNote);
  }
  if (
    lineItems.some((line) => line.vatCategory === 'K') &&
    document.vatExemptionGround !== INTRA_COMMUNITY_SUPPLY_GROUND
  ) {
    mentions.push(
      INTRA_COMMUNITY_SUPPLY_NOTE_BY_LANGUAGE[locale.language] ?? INTRA_COMMUNITY_SUPPLY_GROUND,
    );
  }
  return mentions;
};
