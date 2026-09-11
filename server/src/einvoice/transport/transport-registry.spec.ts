import { describe, expect, it } from 'vitest';
import type {
  EinvoiceTransport,
  EinvoiceTransportSendResult,
} from './einvoice-transport.interface';
import { EinvoiceTransportRegistry } from './transport-registry';

function fakeTransport(country: string): EinvoiceTransport {
  return {
    providerName: `fake-${country.toLowerCase()}`,
    country,
    isConfigured: () => true,
    send: async (): Promise<EinvoiceTransportSendResult> => ({
      providerMessageId: 'msg-1',
      status: 'sent',
    }),
  };
}

describe('EinvoiceTransportRegistry.forCountry', () => {
  it('finds the transport registered for that country', () => {
    const ro = fakeTransport('RO');
    const registry = new EinvoiceTransportRegistry([ro, fakeTransport('IT')]);

    expect(registry.forCountry('RO')).toBe(ro);
  });

  it('normalizes the lookup to upper case', () => {
    const ro = fakeTransport('RO');
    const registry = new EinvoiceTransportRegistry([ro]);

    expect(registry.forCountry('ro')).toBe(ro);
    expect(registry.forCountry(' Ro ')).toBe(ro);
  });

  it('returns null for a country with no registered transport', () => {
    const registry = new EinvoiceTransportRegistry([fakeTransport('RO')]);

    expect(registry.forCountry('BG')).toBeNull();
  });

  it('returns null for a null country', () => {
    const registry = new EinvoiceTransportRegistry([fakeTransport('RO')]);

    expect(registry.forCountry(null)).toBeNull();
  });
});
