import type { DocumentType } from '@fakturcho/shared-types';
import type { ClassicLabels } from './index';

// Кредитно/дебитно известие (neuter noun) takes the neuter adjective form;
// every other document noun here (фактура, оферта, разписка) is feminine.
const NEUTER_DOCUMENT_TYPES: readonly DocumentType[] = ['credit_note', 'debit_note'];

function isNeuterDocument(documentType: DocumentType): boolean {
  return NEUTER_DOCUMENT_TYPES.includes(documentType);
}

export const bg: ClassicLabels = {
  companyIdLabel: 'ЕИК',
  supplierTitle: 'Доставчик:',
  recipientTitle: () => 'Получател:',
  vatNumberPrefix: 'ДДС №: ',
  molPrefix: 'МОЛ: ',
  issuedAtPrefix: () => 'Дата на издаване: ',
  taxEventPrefix: 'Дата на данъчното събитие: ',
  validUntilPrefix: () => 'Валидно до: ',
  deliveryDatePrefix: 'Дата на доставка: ',
  transportReasonPrefix: 'Основание за транспорта: ',
  transportedAtPrefix: 'Дата и час на транспорта: ',
  carrierNamePrefix: 'Превозвач: ',
  transportNotePrefix: 'Данни за транспорта: ',
  statusPaid: (documentType) => `Статус: ${isNeuterDocument(documentType) ? 'ПЛАТЕНО' : 'ПЛАТЕНА'}`,
  statusCancelled: (documentType) =>
    `Статус: ${isNeuterDocument(documentType) ? 'АНУЛИРАНО' : 'АНУЛИРАНА'}`,
  phonePrefix: 'Телефон: ',
  bicPrefix: 'BIC: ',
  preparedByPrefix: () => 'Съставил: ',
  recipientSignaturePrefix: () => 'Получил: ',
  colName: 'Наименование',
  colQuantity: 'Количество',
  colPrice: 'Ед. цена без ДДС',
  colTotal: 'Стойност',
  vatBasePrefix: 'Данъчна основа:',
  vatRatePrefix: (percent) => `ДДС (${percent}%):`,
  subtotalLabel: 'Междинна сума:',
  discountRowLabel: (percent, customLabel) =>
    `Отстъпка${percent !== null ? ` (${percent}%)` : ''}${customLabel ? ` – ${customLabel}` : ''}:`,
  totalLabel: 'Общо:',
  netValueLabel: 'Обща стойност:',
  dueLabel: 'Сума за плащане:',
  creditDueLabel: 'Сума за възстановяване:',
  paidLabel: 'Платено:',
  exemptionPrefix: 'Основание за неначисляване на ДДС: ',
  zeroRatePrefix: 'Основание за прилагане на нулева ставка: ',
  proformaNotice: 'Проформа фактурата не е данъчен документ.',
  reverseChargeNote: 'Обратно начисляване – чл. 21, ал. 2 от ЗДДС',
  originalMarker: ' (Оригинал)',
  draftLabel: 'Чернова',
  numberSign: '№',
  draftTitle: (l) => `${l} – чернова`,
  correctsInvoice: (number, date) => `Към фактура № ${number} от ${date}`,
  documentType: {
    invoice: 'Фактура',
    proforma: 'Проформа фактура',
    credit_note: 'Кредитно известие',
    debit_note: 'Дебитно известие',
    quote: 'Ценова оферта',
    delivery_note: 'Стокова разписка',
  },
  watermarkMain: 'ЧЕРНОВА',
  watermarkSub: 'БЕЗ ПРАВНА СИЛА',
};
