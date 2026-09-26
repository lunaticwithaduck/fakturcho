import { TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import {
  correctedGrossAmountCents,
  isMppRequired,
  isRecipientTaxpayer,
} from '../../../../einvoice-adapters/pl/split-payment';
import { toSharedDocumentType } from '../../../prisma-mappers';
import type { ClassicLanguage } from '../labels';
import type { MentionsBuilder } from './index';

const NOT_SUBJECT_EU_SERVICES_GROUND =
  'usługa niepodlegająca opodatkowaniu na terytorium kraju – art. 28b ustawy o podatku od towarów i usług';
const INTRA_EU_SUPPLY_NOTE =
  'Wewnątrzwspólnotowa dostawa towarów – art. 42 ustawy o podatku od towarów i usług.';
const REVERSE_CHARGE_MENTION = 'odwrotne obciążenie';
// art. 106e ust. 1 pkt 18a: the exact statutory words, printed in Polish
// regardless of the document's own language (like every other PL-mandated
// annotation in this file).
const SPLIT_PAYMENT_MENTION = 'mechanizm podzielonej płatności';

// The art. 28b cross-border B2B service ground and the art. 42 intra-Community
// supply ground are PL's own statutory citations (Polish, since PL issues only
// in Polish) — a document issued in one of the app's other 6 languages still
// needs a note the reader can follow. The ground itself
// (document.vatExemptionGround) is never translated, only the mention text.
const REVERSE_CHARGE_NOTE_BY_LANGUAGE: Partial<Record<ClassicLanguage, string>> = {
  pl: REVERSE_CHARGE_MENTION,
  en: 'Reverse charge – VAT to be accounted for by the recipient, Art. 196 Directive 2006/112/EC',
  de: 'Steuerschuldnerschaft des Leistungsempfängers, Art. 196 der Richtlinie 2006/112/EG',
  fr: 'Autoliquidation – TVA due par le preneur, art. 196 de la directive 2006/112/CE',
  it: 'Inversione contabile – IVA dovuta dal destinatario, art. 196 della direttiva 2006/112/CE',
  ro: 'Taxare inversă – TVA datorată de beneficiar, art. 196 din Directiva 2006/112/CE',
  bg: 'Обратно начисляване – данъкът се дължи от получателя, чл. 196 от Директива 2006/112/ЕО',
};
const INTRA_EU_SUPPLY_NOTE_BY_LANGUAGE: Partial<Record<ClassicLanguage, string>> = {
  pl: INTRA_EU_SUPPLY_NOTE,
  en: 'Intra-Community supply, Article 138 of Council Directive 2006/112/EC (art. 42 ustawy o VAT)',
  de: 'Steuerfreie innergemeinschaftliche Lieferung gemäß Art. 138 der Richtlinie 2006/112/EG (art. 42 ustawy o VAT)',
  fr: 'Livraison intracommunautaire exonérée, article 138 de la directive 2006/112/CE (art. 42 ustawy o VAT)',
  it: 'Cessione intracomunitaria esente, articolo 138 della direttiva 2006/112/CE (art. 42 ustawy o VAT)',
  ro: 'Livrare intracomunitară scutită, art. 138 din Directiva 2006/112/CE (art. 42 ustawy o VAT)',
  bg: 'Вътреобщностна доставка, освободена от ДДС, чл. 138 от Директива 2006/112/ЕО (art. 42 ustawy o VAT)',
};

export const plMentions: MentionsBuilder = ({
  document,
  lineItems,
  locale,
  originalDocumentAmount,
}) => {
  const mentions: string[] = [];
  const ground = document.vatExemptionGround ?? '';
  if (
    lineItems.some((line) => line.vatCategory === 'AE') ||
    ground === NOT_SUBJECT_EU_SERVICES_GROUND
  ) {
    mentions.push(REVERSE_CHARGE_NOTE_BY_LANGUAGE[locale.language] ?? REVERSE_CHARGE_MENTION);
  }
  if (lineItems.some((line) => line.vatCategory === 'K') && !ground.includes('art. 42')) {
    mentions.push(INTRA_EU_SUPPLY_NOTE_BY_LANGUAGE[locale.language] ?? INTRA_EU_SUPPLY_NOTE);
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
