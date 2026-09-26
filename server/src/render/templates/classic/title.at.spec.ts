import { describe, expect, it } from 'vitest';
import { resolveClassicLocale } from './locale';
import { buildTitle } from './title';

describe('buildTitle — AT debit note title override', () => {
  it('titles an AT debit note Nachtragsrechnung, not the German Belastungsanzeige', () => {
    const locale = resolveClassicLocale('de', 'AT');
    const html = buildTitle('debit_note', null, 1, null, locale);
    expect(html).toContain('Nachtragsrechnung');
    expect(html).not.toContain('Belastungsanzeige');
  });

  it('still titles a German debit note Belastungsanzeige', () => {
    const locale = resolveClassicLocale('de', 'DE');
    const html = buildTitle('debit_note', null, 1, null, locale);
    expect(html).toContain('Belastungsanzeige');
  });
});
