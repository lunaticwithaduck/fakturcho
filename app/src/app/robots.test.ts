import { describe, expect, it } from 'vitest';
import robots from './robots';

describe('robots', () => {
  it('never disallows /guide for any crawler, including AI crawlers', () => {
    const { rules } = robots();
    const ruleList = Array.isArray(rules) ? rules : [rules];
    for (const rule of ruleList) {
      const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
      for (const path of disallow) {
        if (!path) continue;
        expect(path === '/guide' || path.startsWith('/guide/')).toBe(false);
      }
    }
  });
});
