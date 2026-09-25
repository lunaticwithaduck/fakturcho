import type { DocumentType } from '@fakturcho/shared-types';
import type { ClassicLabels } from './index';

// factură/factură proformă/ofertă are feminine; the neuter "aviz" of a
// delivery note takes the masculine singular form.
const agree = (documentType: DocumentType, feminine: string, masculine: string) =>
  documentType === 'delivery_note' ? masculine : feminine;

export const ro: ClassicLabels = {
  companyIdLabel: 'CUI',
  supplierTitle: 'Furnizor:',
  recipientTitle: (documentType) =>
    documentType === 'delivery_note' ? 'Destinatar:' : 'Cumpărător:',
  vatNumberPrefix: 'Cod TVA: ',
  molPrefix: 'Reprezentant legal: ',
  issuedAtPrefix: () => 'Data emiterii: ',
  taxEventPrefix: 'Data livrării/prestării: ',
  validUntilPrefix: () => 'Valabilă până la: ',
  deliveryDatePrefix: 'Data livrării: ',
  transportReasonPrefix: 'Scopul transportului: ',
  transportedAtPrefix: 'Data și ora transportului: ',
  carrierNamePrefix: 'Transportator: ',
  transportNotePrefix: 'Detalii transport: ',
  statusPaid: (documentType) => agree(documentType, 'Status: ACHITATĂ', 'Status: ACHITAT'),
  statusCancelled: (documentType) => agree(documentType, 'Status: ANULATĂ', 'Status: ANULAT'),
  phonePrefix: 'Telefon: ',
  bicPrefix: 'BIC: ',
  preparedByPrefix: (documentType) => agree(documentType, 'Întocmită de: ', 'Întocmit de: '),
  recipientSignaturePrefix: () => 'Semnătură de primire: ',
  colName: 'Denumire produse sau servicii',
  colQuantity: 'Cantitate',
  colPrice: 'Preț unitar',
  colTotal: 'Valoare',
  vatBasePrefix: 'Bază impozabilă:',
  vatRatePrefix: (percent) => `TVA (${percent}%):`,
  subtotalLabel: 'Subtotal:',
  discountRowLabel: (percent, customLabel) =>
    `Reducere${percent !== null ? ` (${percent}%)` : ''}${customLabel ? ` – ${customLabel}` : ''}:`,
  totalLabel: 'Total:',
  netValueLabel: 'Valoare totală:',
  dueLabel: 'Total de plată:',
  creditDueLabel: 'Total de plată:',
  paidLabel: 'Achitat:',
  exemptionPrefix: '',
  proformaNotice: 'Factura proformă nu este document fiscal.',
  reverseChargeNote: 'Taxare inversă – art. 196 din Directiva 2006/112/CE',
  originalMarker: ' (Original)',
  draftLabel: 'Ciornă',
  numberSign: 'nr.',
  draftTitle: (l) => `${l} – ciornă`,
  correctsInvoice: (number, date) => `Referitoare la factura nr. ${number} din ${date}`,
  // Codul fiscal art. 330 knows only "factură" for a correction, negative or
  // positive — "notă de credit"/"notă de debit" are not statutory VAT document
  // types here, so both print as a named factură (as PL and ES do for the same
  // reason).
  documentType: {
    invoice: 'Factură',
    proforma: 'Factură proformă',
    credit_note: 'Factură de stornare',
    debit_note: 'Factură de corecție',
    quote: 'Ofertă',
    delivery_note: 'Aviz de însoțire a mărfii',
  },
  watermarkMain: 'CIORNĂ',
  watermarkSub: 'FĂRĂ VALOARE LEGALĂ',
};
