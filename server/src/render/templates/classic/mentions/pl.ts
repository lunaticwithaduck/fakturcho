import { TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import {
  correctedGrossAmountCents,
  isMppRequired,
  isRecipientTaxpayer,
} from '../../../../einvoice-adapters/pl/split-payment';
import { toSharedDocumentType } from '../../../prisma-mappers';
import type { MentionsBuilder } from './index';

const NOT_SUBJECT_EU_SERVICES_GROUND =
  'usługa niepodlegająca opodatkowaniu na terytorium kraju – art. 28b ustawy o podatku od towarów i usług';
const INTRA_EU_SUPPLY_NOTE =
  'Wewnątrzwspólnotowa dostawa towarów – art. 42 ustawy o podatku od towarów i usług.';
// art. 106e ust. 1 pkt 18a: the exact statutory words, printed in Polish
// regardless of the document's own language (like every other PL-mandated
// annotation in this file).
const SPLIT_PAYMENT_MENTION = 'mechanizm podzielonej płatności';

export const plMentions: MentionsBuilder = ({ document, lineItems, originalDocumentAmount }) => {
  const mentions: string[] = [];
  const ground = document.vatExemptionGround ?? '';
  if (
    lineItems.some((line) => line.vatCategory === 'AE') ||
    ground === NOT_SUBJECT_EU_SERVICES_GROUND
  ) {
    mentions.push('odwrotne obciążenie');
  }
  if (lineItems.some((line) => line.vatCategory === 'K') && !ground.includes('art. 42')) {
    mentions.push(INTRA_EU_SUPPLY_NOTE);
  }

  const sharedType = toSharedDocumentType(document.documentType);
  if (TAX_DOCUMENT_TYPES[sharedType]) {
    const isCorrection = sharedType === 'credit_note' || sharedType === 'debit_note';
    const grossAmountCents = correctedGrossAmountCents(
      isCorrection,
      sharedType === 'credit_note',
      document.amount,
      isCorrection ? (originalDocumentAmount ?? null) : null,
    );
    const mppRequired = isMppRequired({
      hasAnnex15Line: lineItems.some((line) => line.splitPaymentAnnex15),
      currency: document.currency,
      grossAmountCents,
      exchangeRate: document.exchangeRate,
      recipientIsTaxpayer: isRecipientTaxpayer({
        clientType: document.recipientClientType,
        vatNumber: document.recipientVatNumber,
      }),
    });
    if (mppRequired) {
      mentions.push(SPLIT_PAYMENT_MENTION);
    }
  }

  return mentions;
};
