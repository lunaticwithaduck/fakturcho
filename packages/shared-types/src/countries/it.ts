import { type CountryConfig, GENERIC_EU_CONFIG } from './base';

// Standard causale del trasporto values (DPR 472/1996 art. 1): mandatory whenever
// the transport is not a sale, since the reason is what justifies the missing invoice.
const IT_TRANSPORT_REASONS = [
  'Vendita',
  'Conto lavorazione',
  'Reso',
  'Conto visione',
  'Conto deposito',
  'Comodato',
  'Omaggio',
  'Riparazione',
  'Conto campionatura',
  'Altro',
] as const;

export const FORFETTARIO_GROUND =
  'Operazione senza applicazione dell’IVA ai sensi dell’art. 1, commi da 54 a 89, L. 190/2014';

export const IT_CONFIG: CountryConfig = {
  ...GENERIC_EU_CONFIG,
  country: 'IT',
  language: 'it',
  timeZone: 'Europe/Rome',
  vatRates: [
    { rateBp: 2200, label: '22%' },
    { rateBp: 1000, label: '10%' },
    { rateBp: 500, label: '5%' },
    { rateBp: 400, label: '4%' },
    { rateBp: 0, label: '0%' },
  ],
  defaultVatRateBp: 2200,
  companyIdLabel: 'Codice fiscale',
  vatNumberPattern: /^IT\d{11}$/,
  exemptionGrounds: [
    FORFETTARIO_GROUND,
    'Operazione non imponibile ai sensi dell’art. 41, comma 1, lett. a), D.L. 331/1993',
    'Operazione non imponibile ai sensi dell’art. 8, comma 1, lett. a), D.P.R. 633/1972',
    'Operazione esente ai sensi dell’art. 10, D.P.R. 633/1972',
    'Inversione contabile – art. 7-ter, comma 1, lett. a), D.P.R. 633/1972',
    'Operazione non soggetta ad IVA ai sensi dell’art. 7-ter, comma 1, lett. a), D.P.R. 633/1972',
    'Inversione contabile ai sensi dell’art. 17, comma 6, D.P.R. 633/1972',
  ],
  defaultExemptionGround: FORFETTARIO_GROUND,
  identifiers: [
    { key: 'rea', label: 'Numero REA', pattern: /^[A-Z]{2}-\d{1,7}$/, required: false },
    { key: 'shareCapital', label: 'Capitale sociale', pattern: null, required: false },
    // Art. 2250 c.c.: SpA/Srl must state a sole shareholder, liquidation
    // status, and (by convention, "i.v.") that the capital is fully paid up.
    { key: 'socioUnico', label: 'Socio unico', pattern: null, required: false, kind: 'flag' },
    {
      key: 'inLiquidazione',
      label: 'In liquidazione',
      pattern: null,
      required: false,
      kind: 'flag',
    },
    {
      key: 'capitaleVersato',
      label: 'Capitale interamente versato (i.v.)',
      pattern: null,
      required: false,
      kind: 'flag',
    },
  ],
  requiredIssuerFields: [
    'companyName',
    'eik',
    'vatNumber',
    'street',
    'postcode',
    'city',
    'countyRegion',
  ],
  countyRegion: { label: 'Provincia', required: true, pattern: /^[A-Z]{2}$/ },
  showMol: false,
  showSignatureRow: false,
  showOriginalStamp: false,
  deliveryNoteTransportReasons: IT_TRANSPORT_REASONS,
};
