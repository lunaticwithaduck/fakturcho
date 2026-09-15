import { type CountryConfig, GENERIC_EU_CONFIG } from './base';

// OMFP 2634/2015 model 14-3-6A "Aviz de însoțire a mărfii": the scop the goods
// travel under, since it is what lets the aviz stand in for an invoice not yet issued.
const RO_TRANSPORT_REASONS = [
  'Vânzare - urmează factura',
  'Consignație',
  'Transfer între gestiuni proprii',
  'Prelucrare',
  'Retur',
  'Eșantioane',
] as const;

const RO_DEFAULT_EXEMPTION_GROUND = 'Scutit de TVA conform art. 310 din Codul fiscal';

const RO_VAT_EXEMPTION_GROUNDS = [
  'Scutit cu drept de deducere conform art. 294 alin. (1) lit. a) din Codul fiscal',
  'Scutit cu drept de deducere conform art. 294 alin. (1) lit. c) din Codul fiscal',
  'Scutit cu drept de deducere conform art. 294 alin. (1) lit. g) din Codul fiscal',
  'Scutit cu drept de deducere conform art. 294 alin. (1) lit. h) din Codul fiscal',
  'Scutit cu drept de deducere conform art. 294 alin. (1) lit. i) din Codul fiscal',
  'Scutit cu drept de deducere conform art. 294 alin. (1) lit. o) din Codul fiscal',
  'Scutit cu drept de deducere conform art. 294 alin. (2) lit. a) din Codul fiscal',
  'Scutit cu drept de deducere conform art. 294 alin. (2) lit. b) din Codul fiscal',
  'Scutit fără drept de deducere conform art. 292 alin. (1) din Codul fiscal',
  'Scutit fără drept de deducere conform art. 292 alin. (2) din Codul fiscal',
] as const;

export const RO_CONFIG: CountryConfig = {
  ...GENERIC_EU_CONFIG,
  country: 'RO',
  language: 'ro',
  vatRates: [
    { rateBp: 2100, label: '21%' },
    { rateBp: 1100, label: '11%' },
    { rateBp: 0, label: '0%' },
  ],
  defaultVatRateBp: 2100,
  companyIdLabel: 'CUI/CIF',
  vatNumberPattern: /^RO\d{2,10}$/i,
  exemptionGrounds: RO_VAT_EXEMPTION_GROUNDS,
  defaultExemptionGround: RO_DEFAULT_EXEMPTION_GROUND,
  identifiers: [
    {
      key: 'regCom',
      label: 'Nr. Reg. Com.',
      pattern: /^[JFC](\d{13}|\d{1,2}\/\d{1,6}\/\d{4})$/,
      required: false,
    },
    {
      key: 'capitalSocial',
      label: 'Capital social',
      pattern: null,
      required: false,
    },
  ],
  numberingUsesFixedWidth: true,
  requiredIssuerFields: ['companyName', 'eik', 'street', 'postcode', 'city', 'countyRegion'],
  countyRegion: { label: 'Județ', required: true, pattern: null },
  showMol: false,
  showSignatureRow: false,
  showOriginalStamp: false,
  deliveryNotePricesShown: true,
  deliveryNoteTransportReasons: RO_TRANSPORT_REASONS,
};
