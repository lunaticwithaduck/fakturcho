import { FORFETTARIO_GROUND, TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import { toSharedDocumentType } from '../../../prisma-mappers';
import type { ClassicLanguage } from '../labels';
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

// These three grounds are IT's own statutory citations (Italian, since IT
// issues only in Italian) — a document issued in one of the app's other 6
// languages still needs a note the reader can follow. The ground itself
// (document.vatExemptionGround) is never translated, only the mention text.
const INTRA_EU_NOTE_BY_LANGUAGE: Partial<Record<ClassicLanguage, string>> = {
  it: INTRA_EU_TEXT,
  en: 'Intra-Community supply, Article 138 of Council Directive 2006/112/EC (Art. 41, comma 1, lett. a, D.L. 331/1993)',
  de: 'Steuerfreie innergemeinschaftliche Lieferung gemäß Art. 138 der Richtlinie 2006/112/EG (Art. 41, comma 1, lett. a, D.L. 331/1993)',
  fr: 'Livraison intracommunautaire exonérée, article 138 de la directive 2006/112/CE (art. 41, comma 1, lett. a, D.L. 331/1993)',
  pl: 'Wewnątrzwspólnotowa dostawa towarów zwolniona z VAT, art. 138 dyrektywy 2006/112/WE (art. 41, comma 1, lett. a, D.L. 331/1993)',
  ro: 'Livrare intracomunitară scutită, art. 138 din Directiva 2006/112/CE (art. 41, comma 1, lett. a, D.L. 331/1993)',
  bg: 'Вътреобщностна доставка, освободена от ДДС, чл. 138 от Директива 2006/112/ЕО (art. 41, comma 1, lett. a, D.L. 331/1993)',
};
const REVERSE_CHARGE_DOMESTIC_NOTE_BY_LANGUAGE: Partial<Record<ClassicLanguage, string>> = {
  it: REVERSE_CHARGE_DOMESTIC_TEXT,
  en: 'Domestic reverse charge, Article 199 of Council Directive 2006/112/EC (Art. 17, comma 6, D.P.R. 633/1972)',
  de: 'Inländische Steuerschuldnerschaft des Leistungsempfängers gemäß Art. 199 der Richtlinie 2006/112/EG (Art. 17, comma 6, D.P.R. 633/1972)',
  fr: 'Autoliquidation nationale, article 199 de la directive 2006/112/CE (art. 17, comma 6, D.P.R. 633/1972)',
  pl: 'Krajowe odwrotne obciążenie, art. 199 dyrektywy 2006/112/WE (art. 17, comma 6, D.P.R. 633/1972)',
  ro: 'Taxare inversă internă, art. 199 din Directiva 2006/112/CE (art. 17, comma 6, D.P.R. 633/1972)',
  bg: 'Вътрешно обратно начисляване, чл. 199 от Директива 2006/112/ЕО (art. 17, comma 6, D.P.R. 633/1972)',
};
const REVERSE_CHARGE_CROSS_BORDER_NOTE_BY_LANGUAGE: Partial<Record<ClassicLanguage, string>> = {
  it: REVERSE_CHARGE_CROSS_BORDER_TEXT,
  en: 'Reverse charge – VAT to be accounted for by the recipient, Art. 196 Directive 2006/112/EC (Art. 7-ter, comma 1, lett. a, D.P.R. 633/1972)',
  de: 'Steuerschuldnerschaft des Leistungsempfängers, Art. 196 der Richtlinie 2006/112/EG (Art. 7-ter, comma 1, lett. a, D.P.R. 633/1972)',
  fr: 'Autoliquidation – TVA due par le preneur, art. 196 de la directive 2006/112/CE (art. 7-ter, comma 1, lett. a, D.P.R. 633/1972)',
  pl: 'Odwrotne obciążenie – podatek rozlicza nabywca, art. 196 dyrektywy 2006/112/WE (art. 7-ter, comma 1, lett. a, D.P.R. 633/1972)',
  ro: 'Taxare inversă – TVA datorată de beneficiar, art. 196 din Directiva 2006/112/CE (art. 7-ter, comma 1, lett. a, D.P.R. 633/1972)',
  bg: 'Обратно начисляване – данъкът се дължи от получателя, чл. 196 от Директива 2006/112/ЕО (art. 7-ter, comma 1, lett. a, D.P.R. 633/1972)',
};

// L. 190/2014 art. 1, comma 67: a flat-rate (forfettario) issuer's fees are
// not subject to withholding tax; the invoice must ask the withholding agent
// not to apply it. Only meaningful when the client is itself an Italian
// business (has a P. IVA) able to act as a substituto d'imposta.
const FORFETTARIO_RITENUTA_TEXT =
  'Si richiede la non applicazione della ritenuta d’acconto ai sensi dell’art. 1, comma 67, L. 190/2014';

// Bollo and ritenuta are Italian-only procedures with no directive article to
// cite, so a translated note keeps the Italian statutory words in brackets.
const BOLLO_NOTE_BY_LANGUAGE: Partial<Record<ClassicLanguage, string>> = {
  it: BOLLO_TEXT,
  en: 'Stamp duty paid virtually (imposta di bollo assolta in modo virtuale, art. 6 D.M. 17 giugno 2014)',
  de: 'Stempelsteuer virtuell entrichtet (imposta di bollo assolta in modo virtuale, art. 6 D.M. 17 giugno 2014)',
  fr: 'Droit de timbre acquitté de manière virtuelle (imposta di bollo assolta in modo virtuale, art. 6 D.M. 17 giugno 2014)',
  pl: 'Opłata stemplowa uiszczona w sposób wirtualny (imposta di bollo assolta in modo virtuale, art. 6 D.M. 17 giugno 2014)',
  ro: 'Taxă de timbru achitată virtual (imposta di bollo assolta in modo virtuale, art. 6 D.M. 17 giugno 2014)',
  bg: 'Гербов налог, платен виртуално (imposta di bollo assolta in modo virtuale, art. 6 D.M. 17 giugno 2014)',
};
const FORFETTARIO_RITENUTA_NOTE_BY_LANGUAGE: Partial<Record<ClassicLanguage, string>> = {
  it: FORFETTARIO_RITENUTA_TEXT,
  en: 'Please do not apply withholding tax (non applicazione della ritenuta d’acconto, art. 1, comma 67, L. 190/2014)',
  de: 'Bitte keinen Steuerabzug vornehmen (non applicazione della ritenuta d’acconto, art. 1, comma 67, L. 190/2014)',
  fr: 'Merci de ne pas appliquer de retenue à la source (non applicazione della ritenuta d’acconto, art. 1, comma 67, L. 190/2014)',
  pl: 'Prosimy o niepobieranie zaliczki na podatek (non applicazione della ritenuta d’acconto, art. 1, comma 67, L. 190/2014)',
  ro: 'Vă rugăm să nu aplicați reținerea la sursă (non applicazione della ritenuta d’acconto, art. 1, comma 67, L. 190/2014)',
  bg: 'Моля, не удържайте данък при източника (non applicazione della ritenuta d’acconto, art. 1, comma 67, L. 190/2014)',
};

export const itMentions: MentionsBuilder = ({ document, lineItems, locale }) => {
  const mentions: string[] = [];
  const categories = new Set(lineItems.map((line) => line.vatCategory));

  if (categories.has('K')) {
    mentions.push(INTRA_EU_NOTE_BY_LANGUAGE[locale.language] ?? INTRA_EU_TEXT);
  }

  const crossBorder = Boolean(
    document.recipientCountry && document.recipientCountry !== document.issuerCountry,
  );
  if (categories.has('AE')) {
    const noteMap = crossBorder
      ? REVERSE_CHARGE_CROSS_BORDER_NOTE_BY_LANGUAGE
      : REVERSE_CHARGE_DOMESTIC_NOTE_BY_LANGUAGE;
    const fallback = crossBorder ? REVERSE_CHARGE_CROSS_BORDER_TEXT : REVERSE_CHARGE_DOMESTIC_TEXT;
    mentions.push(noteMap[locale.language] ?? fallback);
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
    mentions.push(BOLLO_NOTE_BY_LANGUAGE[locale.language] ?? BOLLO_TEXT);
  }

  if (
    isTaxDocument &&
    document.vatExemptionGround === FORFETTARIO_GROUND &&
    document.recipientVatNumber
  ) {
    mentions.push(
      FORFETTARIO_RITENUTA_NOTE_BY_LANGUAGE[locale.language] ?? FORFETTARIO_RITENUTA_TEXT,
    );
  }

  return mentions.filter((mention) => mention !== document.vatExemptionGround);
};
