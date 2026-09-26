import type { DocumentDto } from '@fakturcho/shared-types';
import { dateOnly, textEl } from './xml-escape';

// XSD Fa sequence: FaWiersz(s) -> Rozliczenie (unused) -> Platnosc -> WarunkiTransakcji.
// Platnosc/TerminPlatnosci/Termin (both minOccurs="0"): the payment due date,
// printed only when the document actually carries one — dueAt is itself
// optional (SaveDraftRequest), so an invoice with none omits the block rather
// than inventing a date.
export function paymentBlock(document: DocumentDto): string {
  if (!document.dueAt) return '';
  return (
    '<Platnosc><TerminPlatnosci>' +
    textEl('Termin', dateOnly(document.dueAt)) +
    '</TerminPlatnosci></Platnosc>'
  );
}
