import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import esMessages from '@messages/es.json';
import roMessages from '@messages/ro.json';
import { describe, expect, it } from 'vitest';

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [`${prefix}${key}`]
      : flatten(value as Record<string, unknown>, `${prefix}${key}.`),
  );
}

describe('shell messages', () => {
  it('keeps the Bulgarian brand and nav copy unchanged', () => {
    expect(bgMessages.shell.brandName).toBe('Фактурчо');
    expect(bgMessages.shell.signOut).toBe('Изход');
    expect(bgMessages.shell.navItems).toEqual({
      documents: 'Документи',
      clients: 'Клиенти',
      catalogue: 'Каталог',
      billing: 'Билинг',
      profile: 'Профил',
    });
  });

  it('provides an English translation for every Bulgarian shell key', () => {
    const bgKeys = flatten(bgMessages.shell).sort();
    const enKeys = flatten(enMessages.shell).sort();
    expect(enKeys).toEqual(bgKeys);
  });

  it('gives the billing nav item a short, unambiguous name — not a loan or a duplicate of Facturación', () => {
    expect(roMessages.shell.navItems.billing).toBe('Sold');
    expect(roMessages.shell.navItems.billing.length).toBeLessThanOrEqual(10);
    expect(esMessages.shell.navItems.billing).toBe('Saldo');
  });
});
