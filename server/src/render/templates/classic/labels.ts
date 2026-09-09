import type { DocumentType } from '@fakturcho/shared-types';

export type ClassicLanguage = 'bg' | 'en';

export interface ClassicLabels {
  companyIdLabel: string;
  recipientTitle: string;
  vatNumberPrefix: string;
  molPrefix: string;
  issuedAtPrefix: string;
  taxEventPrefix: string;
  validUntilPrefix: string;
  statusPaid: string;
  statusCancelled: string;
  phonePrefix: string;
  bicPrefix: string;
  preparedByPrefix: string;
  recipientSignaturePrefix: string;
  colName: string;
  colQuantity: string;
  colPrice: string;
  colTotal: string;
  vatBasePrefix: string;
  vatRatePrefix: (percent: number) => string;
  totalLabel: string;
  dueLabel: string;
  exemptionPrefix: string;
  originalMarker: string;
  draftLabel: string;
  documentType: Record<DocumentType, string>;
  watermarkMain: string;
  watermarkSub: string;
}

const bg: ClassicLabels = {
  companyIdLabel: 'ЕИК',
  recipientTitle: 'Получател:',
  vatNumberPrefix: 'ДДС №: ',
  molPrefix: 'МОЛ: ',
  issuedAtPrefix: 'Дата на издаване: ',
  taxEventPrefix: 'Данъчно събитие: ',
  validUntilPrefix: 'Валидно до: ',
  statusPaid: 'Статус: ПЛАТЕНО',
  statusCancelled: 'Статус: АНУЛИРАНА',
  phonePrefix: 'Телефон: ',
  bicPrefix: 'BIC: ',
  preparedByPrefix: 'Съставил: ',
  recipientSignaturePrefix: 'Получател: ',
  colName: 'Наименование',
  colQuantity: 'Количество',
  colPrice: 'Цена',
  colTotal: 'Общо',
  vatBasePrefix: 'Данъчна основа:',
  vatRatePrefix: (percent) => `ДДС (${percent}%):`,
  totalLabel: 'Общо:',
  dueLabel: 'Сума за плащане:',
  exemptionPrefix: 'Основание за неначисляване на ДДС: ',
  originalMarker: ' (Оригинал)',
  draftLabel: 'Чернова',
  documentType: {
    invoice: 'Фактура',
    proforma: 'Проформа фактура',
    credit_note: 'Кредитно известие',
    debit_note: 'Дебитно известие',
    quote: 'Ценова оферта',
  },
  watermarkMain: 'ЧЕРНОВА',
  watermarkSub: 'БЕЗ ПРАВНА СИЛА',
};

const en: ClassicLabels = {
  companyIdLabel: 'Company registration no.',
  recipientTitle: 'Recipient:',
  vatNumberPrefix: 'VAT no.: ',
  molPrefix: 'Representative: ',
  issuedAtPrefix: 'Issue date: ',
  taxEventPrefix: 'Tax event: ',
  validUntilPrefix: 'Valid until: ',
  statusPaid: 'Status: PAID',
  statusCancelled: 'Status: CANCELLED',
  phonePrefix: 'Phone: ',
  bicPrefix: 'BIC: ',
  preparedByPrefix: 'Prepared by: ',
  recipientSignaturePrefix: 'Received by: ',
  colName: 'Description',
  colQuantity: 'Quantity',
  colPrice: 'Price',
  colTotal: 'Total',
  vatBasePrefix: 'Taxable amount:',
  vatRatePrefix: (percent) => `VAT (${percent}%):`,
  totalLabel: 'Total:',
  dueLabel: 'Amount due:',
  exemptionPrefix: 'VAT exemption ground: ',
  originalMarker: ' (Original)',
  draftLabel: 'Draft',
  documentType: {
    invoice: 'Invoice',
    proforma: 'Proforma invoice',
    credit_note: 'Credit note',
    debit_note: 'Debit note',
    quote: 'Quote',
  },
  watermarkMain: 'DRAFT',
  watermarkSub: 'NOT LEGALLY VALID',
};

export const CLASSIC_LABELS: Record<ClassicLanguage, ClassicLabels> = { bg, en };

export function getClassicLabels(language: ClassicLanguage): ClassicLabels {
  return CLASSIC_LABELS[language];
}
