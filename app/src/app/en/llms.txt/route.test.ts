import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('English llms.txt', () => {
  it('links auth routes under /en', async () => {
    const text = await GET().text();

    expect(text).toContain('(https://www.fakturcho.com/en/signup)');
    expect(text).toContain('(https://www.fakturcho.com/en/login)');
    expect(text).not.toContain('(https://www.fakturcho.com/signup)');
    expect(text).not.toContain('(https://www.fakturcho.com/login)');
  });
});
