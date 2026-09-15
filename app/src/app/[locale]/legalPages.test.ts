import { describe, expect, it } from 'vitest';
import { providedInEnglishNote } from './legalPages';

describe('providedInEnglishNote', () => {
  it('is absent for en — the legal text is already in the viewer language', async () => {
    expect(await providedInEnglishNote('en')).toBeUndefined();
  });
});
