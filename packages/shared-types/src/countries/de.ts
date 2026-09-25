import { type CountryConfig, GENERIC_EU_CONFIG } from './base';

// Kept in sync by hand with server/src/render/templates/classic/mentions/de.ts
// (see that file's comment) — the reverse-charge grounds also double as
// vatNoteGrounds below since they shift tax liability rather than exempt the
// supply.
const DE_INTRA_COMMUNITY_SUPPLY_GROUND =
  'Steuerfreie innergemeinschaftliche Lieferung gemäß § 4 Nr. 1 Buchst. b i. V. m. § 6a UStG';
const DE_EXPORT_GROUND = 'Steuerfreie Ausfuhrlieferung gemäß § 4 Nr. 1 Buchst. a i. V. m. § 6 UStG';
// Domestic reverse charge (e.g. construction subcontracting) — the recipient
// owes German VAT under § 13b UStG.
const DE_DOMESTIC_REVERSE_CHARGE_GROUND =
  'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG';
// Cross-border B2B service: place of supply is the customer's country under
// § 3a Abs. 2 UStG, so the note has to point to the recipient's liability
// under Art. 196 MwStSystRL rather than § 13b, which only covers domestic cases.
const DE_CROSS_BORDER_REVERSE_CHARGE_GROUND =
  'Nicht im Inland steuerbare Leistung (§ 3a Abs. 2 UStG) – Steuerschuldnerschaft des Leistungsempfängers (Art. 196 MwStSystRL)';

const DE_EXEMPTION_GROUNDS = [
  DE_INTRA_COMMUNITY_SUPPLY_GROUND,
  DE_EXPORT_GROUND,
  DE_DOMESTIC_REVERSE_CHARGE_GROUND,
  DE_CROSS_BORDER_REVERSE_CHARGE_GROUND,
  'Steuerfreie Finanzumsätze gemäß § 4 Nr. 8 UStG',
  'Steuerfreie Umsätze aus der Tätigkeit als Versicherungsvertreter oder -makler gemäß § 4 Nr. 11 UStG',
  'Steuerfreie Vermietung und Verpachtung gemäß § 4 Nr. 12 UStG',
  'Steuerfreie Heilbehandlung gemäß § 4 Nr. 14 UStG',
  'Steuerfreie Bildungsleistung gemäß § 4 Nr. 21 UStG',
] as const;

// § 34a Nr. 5 UStDV (in force since 1 Jan 2025) requires the note to name the
// small-business exemption itself, not just state that no VAT is charged.
const DE_DEFAULT_EXEMPTION_GROUND = 'Steuerbefreiung für Kleinunternehmer gemäß § 19 Abs. 1 UStG.';

export const DE_CONFIG: CountryConfig = {
  ...GENERIC_EU_CONFIG,
  country: 'DE',
  language: 'de',
  timeZone: 'Europe/Berlin',
  vatRates: [
    { rateBp: 1900, label: '19%' },
    { rateBp: 700, label: '7%' },
    { rateBp: 0, label: '0%' },
  ],
  defaultVatRateBp: 1900,
  companyIdLabel: 'Handelsregisternummer',
  vatNumberPattern: /^DE\d{9}$/,
  exemptionGrounds: DE_EXEMPTION_GROUNDS,
  defaultExemptionGround: DE_DEFAULT_EXEMPTION_GROUND,
  vatNoteGrounds: [DE_DOMESTIC_REVERSE_CHARGE_GROUND, DE_CROSS_BORDER_REVERSE_CHARGE_GROUND],
  identifiers: [{ key: 'steuernummer', label: 'Steuernummer', pattern: null, required: true }],
  requiredIssuerFields: ['companyName', 'street', 'postcode', 'city'],
  showMol: false,
  showSignatureRow: false,
  showOriginalStamp: false,
};
