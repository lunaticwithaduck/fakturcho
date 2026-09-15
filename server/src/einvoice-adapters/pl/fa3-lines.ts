import type { LineItemDto } from '@fakturcho/shared-types';
import { vatRateCode } from './fa3-vat-groups';
import { textEl, toDecimalString } from './xml-escape';

export function lineBlock(line: LineItemDto, index: number): string {
  const unit = line.unitCode ?? 'szt.';
  return (
    '<FaWiersz>' +
    textEl('NrWierszaFa', String(index + 1)) +
    textEl('P_7', line.name) +
    textEl('P_8A', unit) +
    textEl('P_8B', line.quantity) +
    textEl('P_9A', toDecimalString(line.unitPrice)) +
    textEl('P_11', toDecimalString(line.lineTotal)) +
    textEl('P_12', vatRateCode(line.vatCategory, line.vatRateBp)) +
    '</FaWiersz>'
  );
}
