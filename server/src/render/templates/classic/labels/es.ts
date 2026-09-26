import type { DocumentType } from '@fakturcho/shared-types';
import type { ClassicLabels } from './index';

// factura/factura proforma/factura rectificativa are feminine; "el
// presupuesto" and "el albarán" are masculine.
const ES_MASCULINE_TYPES = new Set<DocumentType>(['quote', 'delivery_note']);
const agree = (documentType: DocumentType, feminine: string, masculine: string) =>
  ES_MASCULINE_TYPES.has(documentType) ? masculine : feminine;

export const es: ClassicLabels = {
  companyIdLabel: 'NIF',
  supplierTitle: 'Emisor:',
  recipientTitle: () => 'Cliente:',
  vatNumberPrefix: 'NIF-IVA: ',
  molPrefix: 'Representante: ',
  issuedAtPrefix: () => 'Fecha de expedición: ',
  taxEventPrefix: 'Fecha de la operación: ',
  validUntilPrefix: () => 'Válido hasta: ', // only printed for quote (el presupuesto)
  deliveryDatePrefix: 'Fecha de entrega: ',
  transportReasonPrefix: 'Motivo del transporte: ',
  transportedAtPrefix: 'Fecha y hora del transporte: ',
  carrierNamePrefix: 'Transportista: ',
  transportNotePrefix: 'Detalles del transporte: ',
  statusPaid: (documentType) => agree(documentType, 'Estado: PAGADA', 'Estado: PAGADO'),
  statusCancelled: (documentType) => agree(documentType, 'Estado: ANULADA', 'Estado: ANULADO'),
  phonePrefix: 'Teléfono: ',
  bicPrefix: 'BIC: ',
  preparedByPrefix: (documentType) => agree(documentType, 'Emitida por: ', 'Emitido por: '),
  recipientSignaturePrefix: () => 'Recibí: ', // fixed verb form, invariable
  colName: 'Descripción',
  colQuantity: 'Cantidad',
  colUnit: 'Unidad',
  colVatRate: 'Tipo de IVA',
  colPrice: 'Precio unitario',
  colTotal: 'Total',
  unitLabels: {
    C62: 'ud',
    H87: 'ud',
    HUR: 'h',
    DAY: 'día',
    MON: 'mes',
    KGM: 'kg',
    MTR: 'm',
    MTK: 'm²',
    LTR: 'l',
    KMT: 'km',
    SET: 'jgo.',
  },
  reverseChargeLineMarker: '—',
  vatBasePrefix: 'Base imponible:',
  vatRatePrefix: (percent) => `IVA (${percent}%):`,
  subtotalLabel: 'Subtotal:',
  discountRowLabel: (percent, customLabel) =>
    `Descuento${percent !== null ? ` (${percent}%)` : ''}${customLabel ? ` – ${customLabel}` : ''}:`,
  totalLabel: 'Total:',
  netValueLabel: 'Valor total:',
  dueLabel: 'Total a pagar:',
  creditDueLabel: 'Total a abonar:',
  paidLabel: 'Importe pagado:',
  exemptionPrefix: 'Operación exenta de IVA según el ',
  operationNaturePrefix: 'Naturaleza de la operación: ',
  operationNatureLabels: {
    goods: 'Entrega de bienes',
    services: 'Prestación de servicios',
    mixed: 'Entrega de bienes y prestación de servicios',
  },
  deliveryAddressPrefix: 'Dirección de entrega: ',
  vatAmountLocalLine: ({ currencyLabel, amount, sourceLabel, rate, date, table }) =>
    `Importe de IVA en ${currencyLabel}: ${amount} (tipo ${sourceLabel} ${rate} del ${date}${table ? `, tabla n.º ${table}` : ''})`,
  proformaNotice: 'Documento sin validez fiscal.',
  reverseChargeNote: 'Inversión del sujeto pasivo – artículo 196 de la Directiva 2006/112/CE',
  originalMarker: ' (Original)',
  draftLabel: 'Borrador',
  numberSign: 'n.º',
  draftTitle: (l) => `${l} (borrador)`,
  correctsInvoice: (number, date) => `Factura rectificada: n.º ${number} de ${date}`,
  correctionReasonPrefix: 'Motivo de la rectificación: ',
  documentType: {
    invoice: 'Factura',
    proforma: 'Factura proforma',
    credit_note: 'Factura rectificativa (abono)',
    debit_note: 'Factura rectificativa (cargo)',
    quote: 'Presupuesto',
    delivery_note: 'Albarán',
  },
  watermarkMain: 'BORRADOR',
  watermarkSub: 'SIN VALIDEZ LEGAL',
  vatBaseWithRatePrefix: (percent) => `Base imponible (${percent}%):`,
  buyerReferencePrefix: 'Su referencia: ',
  paymentTermsPrefix: 'Condiciones de pago: ',
  correctionKsefNumberPrefix: 'Número KSeF de la factura rectificada: ',
};
