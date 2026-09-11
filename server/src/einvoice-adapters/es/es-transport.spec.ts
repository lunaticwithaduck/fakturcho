import { describe, expect, it, vi } from 'vitest';
import type {
  EinvoiceTransportSendParams,
  EinvoiceTransportSendResult,
  EinvoiceTransportStatusResult,
} from '../../einvoice/transport/einvoice-transport.interface';
import { esDomesticStandardInvoice } from './__fixtures__/es-domestic-standard';
import { EsTransport } from './es-transport';
import { formatDir3BuyerReference } from './face-dir3';
import type { FaceTransport } from './face-transport';
import type { VerifactuTransport } from './verifactu-transport';

function fakeVerifactu(overrides: Partial<VerifactuTransport> = {}): VerifactuTransport {
  return {
    providerName: 'aeat-verifactu',
    country: 'ES',
    isConfigured: vi.fn(() => true),
    send: vi.fn(
      async (): Promise<EinvoiceTransportSendResult> => ({
        providerMessageId: 'CSV1',
        status: 'sent',
      }),
    ),
    checkStatus: vi.fn(
      async (): Promise<EinvoiceTransportStatusResult> => ({ status: 'accepted' }),
    ),
    ...overrides,
  } as unknown as VerifactuTransport;
}

function fakeFace(overrides: Partial<FaceTransport> = {}): FaceTransport {
  return {
    providerName: 'face',
    country: 'ES',
    isConfigured: vi.fn(() => true),
    send: vi.fn(
      async (): Promise<EinvoiceTransportSendResult> => ({
        providerMessageId: 'REG1',
        status: 'sent',
      }),
    ),
    checkStatus: vi.fn(
      async (): Promise<EinvoiceTransportStatusResult> => ({ status: 'accepted' }),
    ),
    ...overrides,
  } as unknown as FaceTransport;
}

function sendParams(buyerReference: string | null): EinvoiceTransportSendParams {
  return {
    documentId: esDomesticStandardInvoice.id,
    document: { ...esDomesticStandardInvoice, buyerReference },
    xml: '<Facturae/>',
    recipient: {
      peppolEndpointId: null,
      peppolScheme: null,
      sdiRecipientCode: null,
      pec: null,
      vatNumber: esDomesticStandardInvoice.recipient.vatNumber,
      countyRegion: null,
    },
  };
}

const DIR3_BUYER_REFERENCE = formatDir3BuyerReference({
  organoGestor: 'L01280796',
  unidadTramitadora: 'L01280796',
  oficinaContable: 'L01280796',
});

describe('EsTransport.send — private-sector recipient', () => {
  it('only submits to Verifactu, never touching FACe', async () => {
    const face = fakeFace();
    const transport = new EsTransport(fakeVerifactu(), face);

    const result = await transport.send(sendParams('PEDIDO-2026-77'));

    expect(result.status).toBe('sent');
    expect(result.providerMessageId).toContain('verifactu::CSV1');
    expect(face.send).not.toHaveBeenCalled();
  });
});

describe('EsTransport.send — public-body recipient (DIR3 buyerReference)', () => {
  it('submits to both Verifactu and FACe and reports sent when both succeed', async () => {
    const transport = new EsTransport(fakeVerifactu(), fakeFace());

    const result = await transport.send(sendParams(DIR3_BUYER_REFERENCE));

    expect(result.status).toBe('sent');
    expect(result.providerMessageId).toContain('verifactu::CSV1');
    expect(result.providerMessageId).toContain('face::REG1');
  });

  it('reports rejected when Verifactu fails even if FACe succeeds', async () => {
    const verifactu = fakeVerifactu({
      send: vi.fn(
        async (): Promise<EinvoiceTransportSendResult> => ({
          providerMessageId: '',
          status: 'rejected',
          errorText: 'bad NIF',
        }),
      ),
    });
    const transport = new EsTransport(verifactu, fakeFace());

    const result = await transport.send(sendParams(DIR3_BUYER_REFERENCE));

    expect(result.status).toBe('rejected');
    expect(result.errorText).toContain('bad NIF');
  });

  it('reports rejected when FACe fails even if Verifactu succeeds', async () => {
    const face = fakeFace({
      send: vi.fn(
        async (): Promise<EinvoiceTransportSendResult> => ({
          providerMessageId: '',
          status: 'rejected',
          errorText: 'unknown DIR3',
        }),
      ),
    });
    const transport = new EsTransport(fakeVerifactu(), face);

    const result = await transport.send(sendParams(DIR3_BUYER_REFERENCE));

    expect(result.status).toBe('rejected');
    expect(result.errorText).toContain('unknown DIR3');
  });

  it('skips FACe when it is not configured, even for a public body', async () => {
    const face = fakeFace({ isConfigured: vi.fn(() => false) });
    const transport = new EsTransport(fakeVerifactu(), face);

    const result = await transport.send(sendParams(DIR3_BUYER_REFERENCE));

    expect(result.status).toBe('sent');
    expect(face.send).not.toHaveBeenCalled();
  });
});

describe('EsTransport.isConfigured', () => {
  it('is true when either leg is configured', () => {
    expect(
      new EsTransport(
        fakeVerifactu({ isConfigured: vi.fn(() => false) }),
        fakeFace(),
      ).isConfigured(),
    ).toBe(true);
    expect(
      new EsTransport(
        fakeVerifactu(),
        fakeFace({ isConfigured: vi.fn(() => false) }),
      ).isConfigured(),
    ).toBe(true);
    expect(
      new EsTransport(
        fakeVerifactu({ isConfigured: vi.fn(() => false) }),
        fakeFace({ isConfigured: vi.fn(() => false) }),
      ).isConfigured(),
    ).toBe(false);
  });
});

describe('EsTransport.checkStatus', () => {
  it('routes to FACe when the providerMessageId carries a face:: segment', async () => {
    const face = fakeFace();
    const transport = new EsTransport(fakeVerifactu(), face);

    await transport.checkStatus('verifactu::CSV1|face::REG1');

    expect(face.checkStatus).toHaveBeenCalledWith('REG1');
  });

  it('routes to Verifactu when there is no face:: segment', async () => {
    const verifactu = fakeVerifactu();
    const transport = new EsTransport(verifactu, fakeFace());

    await transport.checkStatus('verifactu::CSV1');

    expect(verifactu.checkStatus).toHaveBeenCalledWith('CSV1');
  });
});
