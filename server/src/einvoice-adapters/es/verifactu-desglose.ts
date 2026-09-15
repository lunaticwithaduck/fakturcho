import type { DocumentDto, VatCategory, VatSubtotal } from '@fakturcho/shared-types';
import { discountAdjustedLines } from '../../einvoice/discount';
import { computeVatSubtotals } from '../../vat-eu/subtotals';
import { sf } from './verifactu-xml';
import { toDecimalString, toPercentString } from './xml';

// Régimen general (clave "01") is the only regime this adapter models — see AEAT.md.
const IMPUESTO_IVA = '01';
const CLAVE_REGIMEN_GENERAL = '01';

// VatCategory -> Verifactu operation qualifier. S/Z stay subject-and-taxed (Z at a 0%
// rate); AE is the reverse-charge case; O is out of VAT's scope entirely.
const CALIFICACION_BY_CATEGORY: Partial<Record<VatCategory, 'S1' | 'S2' | 'N1'>> = {
  S: 'S1',
  Z: 'S1',
  AE: 'S2',
  O: 'N1',
};

// E/G/K are exempt operations; the LIVA article each maps to (art. 20 general
// exemptions, art. 21 exports, art. 25 intra-EU supplies) fixes the OperacionExenta code.
const EXENTA_BY_CATEGORY: Partial<Record<VatCategory, 'E1' | 'E2' | 'E5'>> = {
  E: 'E1',
  G: 'E2',
  K: 'E5',
};

function detalleDesglose(subtotal: VatSubtotal): string {
  const calificacion = CALIFICACION_BY_CATEGORY[subtotal.vatCategory];
  if (calificacion) {
    return (
      '<sf:DetalleDesglose>' +
      sf('Impuesto', IMPUESTO_IVA) +
      sf('ClaveRegimen', CLAVE_REGIMEN_GENERAL) +
      sf('CalificacionOperacion', calificacion) +
      sf('TipoImpositivo', toPercentString(subtotal.rateBp)) +
      sf('BaseImponibleOimporteNoSujeto', toDecimalString(subtotal.taxableAmount)) +
      sf('CuotaRepercutida', toDecimalString(subtotal.vatAmount)) +
      '</sf:DetalleDesglose>'
    );
  }
  const exenta = EXENTA_BY_CATEGORY[subtotal.vatCategory] ?? 'E1';
  return (
    '<sf:DetalleDesglose>' +
    sf('Impuesto', IMPUESTO_IVA) +
    sf('ClaveRegimen', CLAVE_REGIMEN_GENERAL) +
    sf('OperacionExenta', exenta) +
    sf('BaseImponibleOimporteNoSujeto', toDecimalString(subtotal.taxableAmount)) +
    '</sf:DetalleDesglose>'
  );
}

export function desgloseBlock(document: DocumentDto): string {
  const lines = discountAdjustedLines(
    document.lineItems,
    document.subtotal,
    document.discountTotal,
  );
  const subtotals = computeVatSubtotals(lines);
  return `<sf:Desglose>${subtotals.map(detalleDesglose).join('')}</sf:Desglose>`;
}
