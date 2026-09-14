import { type CountryConfig, GENERIC_EU_CONFIG } from './base';

const ES_VAT_NUMBER_PATTERN =
  /^ES(?:\d{8}[A-Z]|[XYZ]\d{7}[A-Z]|[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-Z])$/;

// Spain has not transposed Directive (EU) 2020/285 (deadline 2025-01-01; the
// Commission referred Spain to the CJEU in March 2026) so there is no
// small-business franchise regime here. A non-VAT-registered issuer in Spain
// is only lawful for activities that art. 20.Uno exempts categorically, and
// audits reject a bare "artículo 20" citation for not naming the apartado
// (AEAT expects e.g. "artículo 20.Uno.9º de la Ley 37/1992 del IVA") — so
// there is no single correct default; the issuer must pick one per document.
export const ES_CONFIG: CountryConfig = {
  ...GENERIC_EU_CONFIG,
  country: 'ES',
  language: 'es',
  vatRates: [
    { rateBp: 2100, label: '21%' },
    { rateBp: 1000, label: '10%' },
    { rateBp: 400, label: '4%' },
    { rateBp: 0, label: '0%' },
  ],
  defaultVatRateBp: 2100,
  companyIdLabel: 'NIF',
  vatNumberPattern: ES_VAT_NUMBER_PATTERN,
  exemptionGrounds: [
    'artículo 20.Uno.2º de la Ley 37/1992 del IVA',
    'artículo 20.Uno.3º de la Ley 37/1992 del IVA',
    'artículo 20.Uno.4º de la Ley 37/1992 del IVA',
    'artículo 20.Uno.5º de la Ley 37/1992 del IVA',
    'artículo 20.Uno.9º de la Ley 37/1992 del IVA',
    'artículo 20.Uno.16º de la Ley 37/1992 del IVA',
    'artículo 20.Uno.18º de la Ley 37/1992 del IVA',
    'artículo 20.Uno.26º de la Ley 37/1992 del IVA',
    'artículo 21 de la Ley 37/1992 del IVA',
    'artículo 22 de la Ley 37/1992 del IVA',
    'artículo 25 de la Ley 37/1992 del IVA',
    'artículo 84.Uno.2º de la Ley 37/1992 del IVA',
  ],
  defaultExemptionGround: null,
  identifiers: [
    {
      key: 'registroMercantil',
      label: 'Registro Mercantil',
      pattern: null,
      required: false,
    },
  ],
  requiredIssuerFields: ['companyName', 'eik', 'street', 'postcode', 'city'],
  countyRegion: { label: 'Provincia', required: false, pattern: null },
  showMol: false,
  showSignatureRow: false,
  showDualDisplay: false,
  showOriginalStamp: false,
};
