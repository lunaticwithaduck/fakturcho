import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
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
});
