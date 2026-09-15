import type { DocumentDto, LineItemDto, VatCategory, VatSubtotal } from '@fakturcho/shared-types';
import { discountAdjustedLines } from '../../einvoice/discount';
import { computeVatSubtotals } from '../../vat-eu/subtotals';
import { el, optionalEl, toAmountString, toRateString } from './xml';

const NATURA_BY_CATEGORY: Partial<Record<VatCategory, string>> = {
  Z: 'N2.2',
  E: 'N4',
  AE: 'N6.1',
  K: 'N3.2',
  G: 'N3.1',
  O: 'N2.1',
};

function groupByVat(lineItems: readonly LineItemDto[]): VatSubtotal[] {
  return computeVatSubtotals(lineItems);
}

function dettaglioLineaBlock(line: LineItemDto, index: number): string {
  const natura = NATURA_BY_CATEGORY[line.vatCategory];
  return (
    '<DettaglioLinee>' +
    el('NumeroLinea', String(index + 1)) +
    el('Descrizione', line.name) +
    el('Quantita', line.quantity) +
    optionalEl('UnitaMisura', line.unitCode) +
    el('PrezzoUnitario', toAmountString(line.unitPrice)) +
    el('PrezzoTotale', toAmountString(line.lineTotal)) +
    el('AliquotaIVA', toRateString(line.vatRateBp)) +
    (natura ? el('Natura', natura) : '') +
    '</DettaglioLinee>'
  );
}

function datiRiepilogoBlock(group: VatSubtotal, exemptionGround: string | null): string {
  const natura = NATURA_BY_CATEGORY[group.vatCategory];
  return (
    '<DatiRiepilogo>' +
    el('AliquotaIVA', toRateString(group.rateBp)) +
    (natura ? el('Natura', natura) : '') +
    el('ImponibileImporto', toAmountString(group.taxableAmount)) +
    el('Imposta', toAmountString(group.vatAmount)) +
    el('EsigibilitaIVA', 'I') +
    (natura
      ? el('RiferimentoNormativo', exemptionGround ?? 'Operazione non imponibile/esente')
      : '') +
    '</DatiRiepilogo>'
  );
}

export function beniServiziBlock(document: DocumentDto): string {
  const lines = document.lineItems.map((line, index) => dettaglioLineaBlock(line, index)).join('');
  const discounted = discountAdjustedLines(
    document.lineItems,
    document.subtotal,
    document.discountTotal,
  );
  const riepilogo = groupByVat(discounted)
    .map((group) => datiRiepilogoBlock(group, document.vatExemptionGround))
    .join('');
  return `<DatiBeniServizi>${lines}${riepilogo}</DatiBeniServizi>`;
}
