import { type CountryConfig, GENERIC_EU_CONFIG } from './base';

// Kept in sync by hand with server/src/render/templates/classic/mentions/at.ts,
// same pattern as de.ts — these grounds double as the printed mention text.
const AT_EU_B2B_SERVICE_GROUND =
  'Übergang der Steuerschuld auf den Leistungsempfänger (Reverse Charge) – Leistungsort gemäß § 3a Abs. 6 UStG 1994 im Mitgliedstaat des Leistungsempfängers, Steuerschuldnerschaft des Leistungsempfängers gemäß Art. 196 MwStSystRL.';
const AT_INTRA_COMMUNITY_SUPPLY_GROUND =
  'Steuerfreie innergemeinschaftliche Lieferung gemäß Art. 6 Abs. 1 iVm Art. 7 UStG 1994 (Binnenmarktregelung).';
const AT_TRIANGULATION_GROUND =
  'Innergemeinschaftliches Dreiecksgeschäft gemäß Art. 25 UStG 1994 – die Steuerschuld geht auf den Empfänger über.';
const AT_DOMESTIC_REVERSE_CHARGE_GENERIC_GROUND =
  'Übergang der Steuerschuld auf den Leistungsempfänger gemäß § 19 UStG 1994 (Reverse Charge).';
const AT_DOMESTIC_REVERSE_CHARGE_CONSTRUCTION_GROUND =
  'Übergang der Steuerschuld auf den Leistungsempfänger gemäß § 19 Abs. 1a UStG 1994 (Bauleistungen).';
const AT_DOMESTIC_REVERSE_CHARGE_1B_GROUND =
  'Übergang der Steuerschuld auf den Leistungsempfänger gemäß § 19 Abs. 1b UStG 1994.';
const AT_DOMESTIC_REVERSE_CHARGE_1D_USTBBKV_GROUND =
  'Übergang der Steuerschuld auf den Leistungsempfänger gemäß § 19 Abs. 1d UStG 1994 iVm § 2 UStBBKV.';
const AT_DOMESTIC_REVERSE_CHARGE_1D_SCRAP_GROUND =
  'Übergang der Steuerschuld auf den Leistungsempfänger gemäß § 19 Abs. 1d UStG 1994 iVm der Schrott-Umsatzsteuerverordnung.';
const AT_DOMESTIC_REVERSE_CHARGE_1E_GROUND =
  'Übergang der Steuerschuld auf den Leistungsempfänger gemäß § 19 Abs. 1e UStG 1994.';

// Every ground above is a liability-shift note, not a "Steuerbefreiung" — the
// renderer must not prepend "Hinweis: " to it (see groundPrefix in
// totals-block.ts), same treatment as DE's two vatNoteGrounds.
export const AT_VAT_NOTE_GROUNDS = [
  AT_EU_B2B_SERVICE_GROUND,
  AT_TRIANGULATION_GROUND,
  AT_DOMESTIC_REVERSE_CHARGE_GENERIC_GROUND,
  AT_DOMESTIC_REVERSE_CHARGE_CONSTRUCTION_GROUND,
  AT_DOMESTIC_REVERSE_CHARGE_1B_GROUND,
  AT_DOMESTIC_REVERSE_CHARGE_1D_USTBBKV_GROUND,
  AT_DOMESTIC_REVERSE_CHARGE_1D_SCRAP_GROUND,
  AT_DOMESTIC_REVERSE_CHARGE_1E_GROUND,
] as const;

// § 6 Abs. 1 Z 27 UStG 1994 (Kleinunternehmerregelung, from 01.01.2025). The
// statute prescribes no fixed wording; this follows WKO/USP guidance plus the
// legal basis, same style as the other countries' default exemption grounds.
const AT_DEFAULT_EXEMPTION_GROUND =
  'Umsatzsteuerfrei aufgrund der Kleinunternehmerregelung gemäß § 6 Abs. 1 Z 27 UStG 1994.';

const AT_EXEMPTION_GROUNDS = [
  ...AT_VAT_NOTE_GROUNDS,
  AT_INTRA_COMMUNITY_SUPPLY_GROUND,
  'Steuerfreie Ausfuhrlieferung gemäß § 6 Abs. 1 Z 1 iVm § 7 UStG 1994',
  'Steuerfrei gemäß § 6 Abs. 1 Z 5b UStG 1994 (Verhütungsmittel und Waren der monatlichen Damenhygiene)',
  'Steuerfrei gemäß § 6 Abs. 1 Z 8 UStG 1994 (Umsätze im Geld- und Kapitalverkehr)',
  'Steuerfrei gemäß § 6 Abs. 1 Z 9 lit. a UStG 1994 (Lieferung von Grundstücken)',
  'Steuerfrei gemäß § 6 Abs. 1 Z 11 lit. a UStG 1994 (Unterrichtsleistungen privater Schulen und Bildungseinrichtungen)',
  'Steuerfrei gemäß § 6 Abs. 1 Z 13 UStG 1994 (Umsätze aus der Tätigkeit als Bausparkassen- oder Versicherungsvertreter)',
  'Steuerfrei gemäß § 6 Abs. 1 Z 16 UStG 1994 (Vermietung und Verpachtung von Grundstücken, ausgenommen Wohnzwecke)',
  'Steuerfrei gemäß § 6 Abs. 1 Z 19 UStG 1994 (Heilbehandlung im Bereich der Humanmedizin)',
  AT_DEFAULT_EXEMPTION_GROUND,
] as const;

// § 10 Abs. 4 UStG 1994 (RIS NOR40278068, idF BGBl. I 37/2026), verified
// against the consolidated text on ris.bka.gv.at / jusline.at 26.09.2026: the
// standard rate is reduced to 19% "für die in den Gebieten Jungholz und
// Mittelberg bewirkten Umsätze ... durch Unternehmer, die einen Wohnsitz
// (Sitz), gewöhnlichen Aufenthalt oder eine Betriebsstätte in diesen Gebieten
// haben" — the SUPPLIER's own seat, not the customer's. Abs. 4 only replaces
// the Abs. 1 standard rate; the Abs. 2/3 reduced rates (10%/13%/4,9%) are
// untouched. Postcodes (Statistik Austria / Post.at): Jungholz 6691;
// Kleinwalsertal/Mittelberg 6991 Riezlern, 6992 Hirschegg, 6993 Mittelberg.
export const AT_JUNGHOLZ_MITTELBERG_POSTCODES = ['6691', '6991', '6992', '6993'] as const;

const AT_JUNGHOLZ_MITTELBERG_IDENTIFIER_KEY = 'jungholzMittelbergRate';

export function isAtJungholzMittelbergPostcode(postcode: string | null | undefined): boolean {
  if (!postcode) return false;
  return (AT_JUNGHOLZ_MITTELBERG_POSTCODES as readonly string[]).includes(postcode.trim());
}

export interface AtRecipientLocation {
  country: string | null;
  postcode?: string | null;
}

// jusline.at / RIS NOR40278068, verified 26.09.2026: Abs. 4's 19% rate
// excludes "die Lieferung und die Vermietung von Kraftfahrzeugen an
// Leistungsempfänger, die ihren Wohnsitz oder Sitz im Inland, ausgenommen in
// den Gebieten Jungholz und Mittelberg, haben" and any supply to the
// Betriebsstätte of an entrepreneur elsewhere in Austria — both keyed on the
// RECIPIENT's own seat, not the supplier's (that stays Jungholz/Mittelberg
// throughout, see the flag above).
function isAtRecipientOutsideJungholzMittelberg(recipient?: AtRecipientLocation | null): boolean {
  if (recipient?.country !== 'AT') return false;
  return !isAtJungholzMittelbergPostcode(recipient.postcode);
}

const AT_BASE_VAT_RATES = [
  { rateBp: 2000, label: '20%' },
  { rateBp: 1300, label: '13%' },
  { rateBp: 1000, label: '10%' },
  { rateBp: 490, label: '4,9%' },
  { rateBp: 0, label: '0%' },
];

// § 10 Abs. 1a UStG idF BGBl. I 37/2026 (4,9 % from 01.07.2026, Anlage-3
// staples only) is already in force as of this session's "today".
export const AT_CONFIG: CountryConfig = {
  ...GENERIC_EU_CONFIG,
  country: 'AT',
  language: 'de',
  timeZone: 'Europe/Vienna',
  vatRates: AT_BASE_VAT_RATES,
  defaultVatRateBp: 2000,
  companyIdLabel: 'Firmenbuchnummer',
  vatNumberPattern: /^ATU\d{8}$/,
  exemptionGrounds: AT_EXEMPTION_GROUNDS,
  defaultExemptionGround: AT_DEFAULT_EXEMPTION_GROUND,
  vatNoteGrounds: AT_VAT_NOTE_GROUNDS,
  // AT usage (kalkuel.at, sevdesk.at): a seller-issued correction/cancellation
  // document is never called "Gutschrift" in Austria (§ 11 Abs. 7/8 Z 3 UStG
  // 1994 reserves that word for self-billing); "Nachtragsrechnung" replaces
  // DE's "Belastungsanzeige" for a seller-issued extra charge.
  documentTypeTitles: { debit_note: 'Nachtragsrechnung' },
  // UGB § 14 Abs. 1: Firmenbuchnummer/-gericht/Sitz are required once the
  // issuer is registered in the Firmenbuch — conditional, like DE's
  // Registergericht/Sitz, via issuer.ts/issuerCompleteness.ts, not here.
  // jungholzMittelbergRate is a flag (kind: 'flag', stored 'true'/'false'
  // like IT's socioUnico/inLiquidazione), never printed as an identifier row
  // (footer-blocks.ts already filters flags out) — see applyAtSpecialRate.
  identifiers: [
    { key: 'firmenbuchgericht', label: 'Firmenbuchgericht', pattern: null, required: false },
    { key: 'sitz', label: 'Sitz', pattern: null, required: false },
    { key: 'rechtsform', label: 'Rechtsform', pattern: null, required: false },
    { key: 'steuernummer', label: 'Steuernummer', pattern: null, required: false },
    {
      key: AT_JUNGHOLZ_MITTELBERG_IDENTIFIER_KEY,
      label: '19 % statt 20 % (Jungholz/Mittelberg, § 10 Abs. 4 UStG 1994)',
      pattern: null,
      required: false,
      kind: 'flag',
    },
  ],
  requiredIssuerFields: ['companyName', 'street', 'postcode', 'city'],
  showMol: false,
  showSignatureRow: false,
  showOriginalStamp: false,
  // § 11 Abs. 1 Z 3 lit. d UStG 1994; USP: "Rechnungsdatum = Lieferdatum" must
  // still be stated on a Kleinbetragsrechnung.
  taxEventDateAlwaysShown: true,
};

// Applied wherever an AT issuer's own vatRates/defaultVatRateBp drive a
// choice (composer rate list, the default rate for a new line, the
// whole-document default when VAT is charged): once the issuer has confirmed
// their seat is in Jungholz/Mittelberg, 19% and 20% are both offered, and 19%
// is the default UNLESS the recipient's own seat excludes it (Abs. 4's
// vehicle/Betriebsstätte carve-out, see isAtRecipientOutsideJungholzMittelberg
// above) — then 20% defaults instead, still with both selectable, since a
// line can be a different supply. Reduced rates (13%/10%/4,9%) and everything
// else about AT_CONFIG is unchanged. Never derives the flag from a postcode
// itself — only the issuer's own explicit confirmation (see AT-SPEC
// follow-up, item 3) counts; the recipient postcode only picks the default.
export function applyAtSpecialRate(
  config: CountryConfig,
  identifiers?: Record<string, string> | null,
  recipient?: AtRecipientLocation | null,
): CountryConfig {
  if (config.country !== 'AT') return config;
  if (identifiers?.[AT_JUNGHOLZ_MITTELBERG_IDENTIFIER_KEY] !== 'true') return config;
  return {
    ...config,
    vatRates: [
      { rateBp: 1900, label: '19%' },
      { rateBp: 2000, label: '20%' },
      { rateBp: 1300, label: '13%' },
      { rateBp: 1000, label: '10%' },
      { rateBp: 490, label: '4,9%' },
      { rateBp: 0, label: '0%' },
    ],
    defaultVatRateBp: isAtRecipientOutsideJungholzMittelberg(recipient) ? 2000 : 1900,
  };
}
