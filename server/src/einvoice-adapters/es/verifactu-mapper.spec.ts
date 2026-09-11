import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { esDomesticStandardInvoice } from './__fixtures__/es-domestic-standard';
import { computeRegistroAltaHuella } from './aeat-huella';
import { buildRegistroAlta, type VerifactuSoftwareIdentity } from './verifactu-mapper';

const SYSTEM: VerifactuSoftwareIdentity = {
  nombreRazon: 'Fakturcho SL',
  nif: 'B00000001',
  nombreSistemaInformatico: 'Fakturcho',
  idSistemaInformatico: '01',
  version: '1.0',
  numeroInstalacion: 'doc-es-domestic-1',
};

const GENERATED_AT = new Date('2026-09-04T08:30:00Z');

describe('buildRegistroAlta — first record of the chain', () => {
  const result = buildRegistroAlta(esDomesticStandardInvoice, null, SYSTEM, GENERATED_AT);

  it('carries IDFactura built from the issuer NIF and invoice series/date', () => {
    expect(result.xml).toContain('<sf:IDEmisorFactura>B12345674</sf:IDEmisorFactura>');
    expect(result.xml).toContain('<sf:NumSerieFactura>0000000015</sf:NumSerieFactura>');
    expect(result.xml).toContain(
      '<sf:FechaExpedicionFactura>04-09-2026</sf:FechaExpedicionFactura>',
    );
  });

  it('classifies a standard invoice with an identified recipient as F1', () => {
    expect(result.xml).toContain('<sf:TipoFactura>F1</sf:TipoFactura>');
    expect(result.xml).toContain('<sf:NIF>B00000018</sf:NIF>');
  });

  it('carries a single S1 DetalleDesglose at the fixture VAT rate', () => {
    expect(result.xml).toContain('<sf:CalificacionOperacion>S1</sf:CalificacionOperacion>');
    expect(result.xml).toContain('<sf:TipoImpositivo>21.00</sf:TipoImpositivo>');
    expect(result.xml).toContain(
      '<sf:BaseImponibleOimporteNoSujeto>1000.00</sf:BaseImponibleOimporteNoSujeto>',
    );
    expect(result.xml).toContain('<sf:CuotaRepercutida>210.00</sf:CuotaRepercutida>');
  });

  it('carries CuotaTotal/ImporteTotal matching the document totals', () => {
    expect(result.xml).toContain('<sf:CuotaTotal>210.00</sf:CuotaTotal>');
    expect(result.xml).toContain('<sf:ImporteTotal>1210.00</sf:ImporteTotal>');
  });

  it('marks PrimerRegistro when there is no previous chain link', () => {
    expect(result.xml).toContain('<sf:PrimerRegistro>S</sf:PrimerRegistro>');
    expect(result.xml).not.toContain('RegistroAnterior');
  });

  it('computes the Huella exactly as the standalone hash function would from the same fields', () => {
    const expected = computeRegistroAltaHuella({
      idEmisorFactura: 'B12345674',
      numSerieFactura: '0000000015',
      fechaExpedicionFactura: '04-09-2026',
      tipoFactura: 'F1',
      cuotaTotal: '210.00',
      importeTotal: '1210.00',
      huellaAnterior: '',
      fechaHoraHusoGenRegistro: extractTimestamp(result.xml),
    });
    expect(result.chainLink.huella).toBe(expected);
    expect(result.xml).toContain(`<sf:Huella>${result.chainLink.huella}</sf:Huella>`);
  });

  it('returns a chainLink usable as the RegistroAnterior of the next record', () => {
    expect(result.chainLink).toEqual({
      idEmisorFactura: 'B12345674',
      numSerieFactura: '0000000015',
      fechaExpedicionFactura: '04-09-2026',
      huella: result.chainLink.huella,
    });
  });
});

function extractTimestamp(xml: string): string {
  const match = /<sf:FechaHoraHusoGenRegistro>([^<]+)<\/sf:FechaHoraHusoGenRegistro>/.exec(xml);
  if (!match?.[1]) throw new Error('FechaHoraHusoGenRegistro not found in test fixture xml');
  return match[1];
}

describe('buildRegistroAlta — chained record', () => {
  it('carries RegistroAnterior with the previous Huella', () => {
    const result = buildRegistroAlta(
      esDomesticStandardInvoice,
      {
        idEmisorFactura: 'B12345674',
        numSerieFactura: '0000000014',
        fechaExpedicionFactura: '03-09-2026',
        huella: 'AAAA',
      },
      SYSTEM,
      GENERATED_AT,
    );

    expect(result.xml).toContain('<sf:RegistroAnterior>');
    expect(result.xml).toContain(
      '<sf:NumSerieFactura>0000000014</sf:NumSerieFactura><sf:FechaExpedicionFactura>03-09-2026</sf:FechaExpedicionFactura><sf:Huella>AAAA</sf:Huella>',
    );
    expect(result.xml).not.toContain('PrimerRegistro');
  });
});

describe('buildRegistroAlta — credit note', () => {
  it('classifies a credit note as R1 regardless of recipient identification', () => {
    const creditNote: DocumentDto = { ...esDomesticStandardInvoice, documentType: 'credit_note' };
    const result = buildRegistroAlta(creditNote, null, SYSTEM, GENERATED_AT);
    expect(result.xml).toContain('<sf:TipoFactura>R1</sf:TipoFactura>');
  });
});

describe('buildRegistroAlta — recipient without a usable tax id', () => {
  it('falls back to F2 and omits Destinatarios', () => {
    const noTaxId: DocumentDto = {
      ...esDomesticStandardInvoice,
      recipient: { ...esDomesticStandardInvoice.recipient, eik: null, vatNumber: null },
    };
    const result = buildRegistroAlta(noTaxId, null, SYSTEM, GENERATED_AT);
    expect(result.xml).toContain('<sf:TipoFactura>F2</sf:TipoFactura>');
    expect(result.xml).not.toContain('Destinatarios');
  });
});

describe('buildRegistroAlta — exempt line item', () => {
  it('emits an OperacionExenta DetalleDesglose for an exempt VatCategory', () => {
    const exempt: DocumentDto = {
      ...esDomesticStandardInvoice,
      lineItems: [
        {
          id: 'line-1',
          name: 'Servicios de consultoría informática',
          quantity: '10',
          unitPrice: 10000,
          lineTotal: 100000,
          sortOrder: 0,
          vatRateBp: 0,
          vatCategory: 'E',
          unitCode: 'HUR',
        },
      ],
    };
    const result = buildRegistroAlta(exempt, null, SYSTEM, GENERATED_AT);
    expect(result.xml).toContain('<sf:OperacionExenta>E1</sf:OperacionExenta>');
    expect(result.xml).not.toContain('CalificacionOperacion');
  });
});
