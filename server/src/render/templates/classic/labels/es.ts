import type { DocumentType } from '@fakturcho/shared-types';
import type { ClassicLabels } from './index';

// factura/factura proforma/factura rectificativa are feminine; "el
// presupuesto" and "el albarán" are masculine.
const ES_MASCULINE_TYPES = new Set<DocumentType>(['quote', 'delivery_note']);
const agree = (documentType: DocumentType, feminine: string, masculine: string) =>
  ES_MASCULINE_TYPES.has(documentType) ? masculine : feminine;

export const es: ClassicLabels = {
  companyIdLabel: 'NIF',
  recipientTitle: 'Cliente:',
  vatNumberPrefix: 'NIF-IVA: ',
  molPrefix: 'Representante: ',
  issuedAtPrefix: 'Fecha de expedición: ',
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
  colPrice: 'Precio',
  colTotal: 'Total',
  vatBasePrefix: 'Base imponible:',
  vatRatePrefix: (percent) => `IVA (${percent}%):`,
  subtotalLabel: 'Subtotal:',
  discountRowLabel: (percent, customLabel) =>
    `Descuento${percent !== null ? ` (${percent}%)` : ''}${customLabel ? ` – ${customLabel}` : ''}:`,
  totalLabel: 'Total:',
  dueLabel: 'Total a pagar:',
  exemptionPrefix: 'Operación exenta de IVA según el ',
  originalMarker: ' (Original)',
  draftLabel: 'Borrador',
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
};
