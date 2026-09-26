import type { DocumentDto } from '@fakturcho/shared-types';
import { correctedGrossAmountCents, isMppRequired } from './split-payment';
import { textEl } from './xml-escape';

export type Fa3DocumentType = 'invoice' | 'credit_note' | 'debit_note';

// XSD/broszura FA(3): "W przypadku, gdy pole P_19 równa się 1, należy
// wypełnić dodatkowo jedno z pól: P_19A, P_19B lub P_19C" — P_19=1 without a
// ground is not schema-valid, so an E line with no vatExemptionGround must
// fail readiness (checkFa3Readiness) before it ever reaches the mapper.
export function annotationsBlock(document: DocumentDto, kind: Fa3DocumentType): string {
  const hasReverseCharge = document.lineItems.some((line) => line.vatCategory === 'AE');
  const hasExempt = document.lineItems.some((line) => line.vatCategory === 'E');
  if (hasExempt && !document.vatExemptionGround) {
    throw new Error(
      'toFa3Xml: an exempt (E) line requires vatExemptionGround for P_19A (XSD requires P_19A/B/C when P_19=1).',
    );
  }
  const exemption = hasExempt
    ? `<Zwolnienie>${textEl('P_19', '1')}${textEl('P_19A', document.vatExemptionGround as string)}</Zwolnienie>`
    : `<Zwolnienie>${textEl('P_19N', '1')}</Zwolnienie>`;
  // art. 108a ust. 1a: a correction's threshold check compares the corrected
  // (post-correction) gross total, so the original's own gross amount is
  // folded in before converting to PLN.
  const isCorrection = kind !== 'invoice';
  const grossAmountCents = correctedGrossAmountCents(
    isCorrection,
    kind === 'credit_note',
    document.amount,
    isCorrection ? (document.originalDocument?.amount ?? null) : null,
  );
  const mppRequired = isMppRequired({
    hasAnnex15Line: document.lineItems.some((line) => line.splitPaymentAnnex15),
    currency: document.currency,
    grossAmountCents,
    exchangeRate: document.exchangeRate ?? null,
  });
  return (
    '<Adnotacje>' +
    textEl('P_16', '2') +
    textEl('P_17', '2') +
    textEl('P_18', hasReverseCharge ? '1' : '2') +
    textEl('P_18A', mppRequired ? '1' : '2') +
    exemption +
    `<NoweSrodkiTransportu>${textEl('P_22N', '1')}</NoweSrodkiTransportu>` +
    textEl('P_23', '2') +
    `<PMarzy>${textEl('P_PMarzyN', '1')}</PMarzy>` +
    '</Adnotacje>'
  );
}
