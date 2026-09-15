import type { DocumentType } from '@fakturcho/shared-types';
import type { ClassicLabels } from './index';

// facture/facture pro forma/note de débit are feminine; "un avoir", "un
// devis" and "un bon de livraison" are masculine.
const FR_MASCULINE_TYPES = new Set<DocumentType>(['credit_note', 'quote', 'delivery_note']);
const agree = (documentType: DocumentType, feminine: string, masculine: string) =>
  FR_MASCULINE_TYPES.has(documentType) ? masculine : feminine;

export const fr: ClassicLabels = {
  companyIdLabel: 'SIREN',
  recipientTitle: 'Client :',
  vatNumberPrefix: 'N° TVA intracommunautaire : ',
  molPrefix: 'Représentant légal : ',
  issuedAtPrefix: "Date d'émission : ",
  taxEventPrefix: 'Date de livraison / prestation : ',
  validUntilPrefix: () => "Valable jusqu'au : ", // invariable adjective
  deliveryDatePrefix: 'Date de livraison : ',
  transportReasonPrefix: 'Motif du transport : ',
  transportedAtPrefix: 'Date et heure du transport : ',
  carrierNamePrefix: 'Transporteur : ',
  transportNotePrefix: 'Détails du transport : ',
  statusPaid: (documentType) => agree(documentType, 'Statut : PAYÉE', 'Statut : PAYÉ'),
  statusCancelled: (documentType) => agree(documentType, 'Statut : ANNULÉE', 'Statut : ANNULÉ'),
  phonePrefix: 'Téléphone : ',
  bicPrefix: 'BIC : ',
  preparedByPrefix: (documentType) => agree(documentType, 'Établie par : ', 'Établi par : '),
  recipientSignaturePrefix: (documentType) => agree(documentType, 'Reçue par : ', 'Reçu par : '),
  colName: 'Désignation',
  colQuantity: 'Quantité',
  colPrice: 'Prix unitaire',
  colTotal: 'Total',
  vatBasePrefix: 'Base HT :',
  vatRatePrefix: (percent) => `TVA (${String(percent).replace('.', ',')}%) :`,
  subtotalLabel: 'Sous-total :',
  discountRowLabel: (percent, customLabel) =>
    `Remise${percent !== null ? ` (${String(percent).replace('.', ',')}%)` : ''}${customLabel ? ` – ${customLabel}` : ''} :`,
  totalLabel: 'Total :',
  dueLabel: 'Net à payer :',
  exemptionPrefix: "Motif d'exonération de TVA : ",
  originalMarker: ' (Original)',
  draftLabel: 'Brouillon',
  documentType: {
    invoice: 'Facture',
    proforma: 'Facture pro forma',
    credit_note: 'Avoir',
    debit_note: 'Note de débit',
    quote: 'Devis',
    delivery_note: 'Bon de livraison',
  },
  watermarkMain: 'BROUILLON',
  watermarkSub: 'SANS VALEUR LÉGALE',
};
