import { isUnitCode, type LineItemDto } from '@fakturcho/shared-types';
import { pl } from '../../render/templates/classic/labels/pl';
import { vatRateCode } from './fa3-vat-groups';
import { optionalTextEl, textEl, toDecimalString } from './xml-escape';

// broszura FA(3) art. 106e ust. 1 pkt 6: P_8A is the Polish-language unit
// label the PDF prints (labels/pl.ts unitLabels), not the UN/ECE rec. 20
// code stored in unitCode. XSD P_8A minOccurs="0" — a line with no unit
// omits it rather than inventing one.
function unitLabel(unitCode: string | null): string | null {
  if (!unitCode) return null;
  return isUnitCode(unitCode) ? pl.unitLabels[unitCode] : unitCode;
}

// FA(3) broszura, KOR "Metoda pierwsza" (Przykład 23): a simple difference
// correction carries the quantity itself with a minus sign, no StanPrzed.
function signedQuantity(quantity: string, sign: 1 | -1): string {
  if (sign === 1 || Number(quantity) === 0) return quantity;
  return quantity.startsWith('-') ? quantity.slice(1) : `-${quantity}`;
}

export function lineBlock(
  originalLine: LineItemDto,
  discountAdjustedLine: LineItemDto,
  index: number,
  sign: 1 | -1,
  kursWaluty: string | null,
): string {
  // art. 106e ust. 1 pkt 10: opust nieuwzględniony w cenie jednostkowej netto.
  const allocatedDiscount = originalLine.lineTotal - discountAdjustedLine.lineTotal;
  return (
    '<FaWiersz>' +
    textEl('NrWierszaFa', String(index + 1)) +
    textEl('P_7', originalLine.name) +
    optionalTextEl('P_8A', unitLabel(originalLine.unitCode)) +
    textEl('P_8B', signedQuantity(originalLine.quantity, sign)) +
    textEl('P_9A', toDecimalString(originalLine.unitPrice)) +
    (allocatedDiscount !== 0 ? textEl('P_10', toDecimalString(allocatedDiscount * sign)) : '') +
    textEl('P_11', toDecimalString(discountAdjustedLine.lineTotal * sign)) +
    textEl('P_12', vatRateCode(originalLine.vatCategory, originalLine.vatRateBp)) +
    (kursWaluty !== null ? textEl('KursWaluty', kursWaluty) : '') +
    '</FaWiersz>'
  );
}
