import { type CountryConfig, GENERIC_EU_CONFIG } from './base';

const ES_VAT_NUMBER_PATTERN =
  /^ES(?:\d{8}[A-Z]|[XYZ]\d{7}[A-Z]|[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-Z])$/;

const ES_DEFAULT_EXEMPTION_GROUND = 'artículo 20 de la Ley 37/1992 del IVA';

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
    ES_DEFAULT_EXEMPTION_GROUND,
    'artículo 21 de la Ley 37/1992 del IVA',
    'artículo 22 de la Ley 37/1992 del IVA',
    'artículo 25 de la Ley 37/1992 del IVA',
    'artículo 84.Uno.2º de la Ley 37/1992 del IVA',
  ],
  defaultExemptionGround: ES_DEFAULT_EXEMPTION_GROUND,
  identifiers: [
    {
      key: 'registroMercantil',
      label: 'Registro Mercantil',
      pattern: null,
      required: false,
    },
  ],
  requiredIssuerFields: ['companyName', 'eik', 'street', 'postcode', 'city'],
  showMol: false,
  showSignatureRow: false,
  showDualDisplay: false,
  showOriginalStamp: false,
};
