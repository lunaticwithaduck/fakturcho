import { describe, expect, it } from 'vitest';
import { resolveClassicLocale } from './locale';
import { buildFakeDocument } from './testing/fake-document';
import { buildTransportBlock } from './transport-block';

describe('buildTransportBlock — RO "mijloc de transport nr." (OMFP 2634/2015 model 14-3-6A)', () => {
  it('prints the vehicle registration when set on a RO delivery note', () => {
    const locale = resolveClassicLocale('ro', 'RO');
    const document = buildFakeDocument({ transportVehicle: 'B 123 XYZ' });
    const html = buildTransportBlock(document, locale);
    expect(html).toContain('Mijloc de transport nr.: B 123 XYZ');
  });

  it('prints nothing for the vehicle registration when it is blank', () => {
    const locale = resolveClassicLocale('ro', 'RO');
    const document = buildFakeDocument({ transportVehicle: null });
    const html = buildTransportBlock(document, locale);
    expect(html).not.toContain('Mijloc de transport');
  });

  it('never prints the vehicle registration row outside Romania', () => {
    const locale = resolveClassicLocale('it', 'IT');
    const document = buildFakeDocument({ transportVehicle: 'B 123 XYZ' });
    const html = buildTransportBlock(document, locale);
    expect(html).not.toContain('B 123 XYZ');
  });
});
