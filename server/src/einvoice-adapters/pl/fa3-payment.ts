import type { DocumentDto } from '@fakturcho/shared-types';
import { dateOnly, optionalTextEl, textEl } from './xml-escape';

// XSD TRachunekBankowy: NrRB, then SWIFT, then (skipping RachunekWlasnyBanku,
// unused here) NazwaBanku.
function rachunekBankowyBlock(document: DocumentDto): string {
  const iban = document.issuer.iban;
  if (!iban) return '';
  return (
    '<RachunekBankowy>' +
    textEl('NrRB', iban.replace(/\s+/g, '')) +
    optionalTextEl('SWIFT', document.issuer.bic) +
    optionalTextEl('NazwaBanku', document.issuer.bankName) +
    '</RachunekBankowy>'
  );
}

// XSD Fa sequence: FaWiersz(s) -> Rozliczenie (unused) -> Platnosc -> WarunkiTransakcji.
// Platnosc/TerminPlatnosci/Termin (both minOccurs="0"): the payment due date,
// printed only when the document actually carries one — dueAt is itself
// optional (SaveDraftRequest), so an invoice with none omits the row rather
// than inventing a date. Platnosc/RachunekBankowy (also minOccurs="0", right
// after TerminPlatnosci in the XSD sequence) carries the issuer's own IBAN,
// printed whenever the issuer has one on file, independently of dueAt.
export function paymentBlock(document: DocumentDto): string {
  const terminPlatnosci = document.dueAt
    ? `<TerminPlatnosci>${textEl('Termin', dateOnly(document.dueAt))}</TerminPlatnosci>`
    : '';
  const rachunekBankowy = rachunekBankowyBlock(document);
  if (!terminPlatnosci && !rachunekBankowy) return '';
  return `<Platnosc>${terminPlatnosci}${rachunekBankowy}</Platnosc>`;
}
