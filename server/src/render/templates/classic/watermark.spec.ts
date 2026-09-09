import { describe, expect, it } from 'vitest';
import { resolveClassicLocale } from './locale';
import { buildWatermark, DRAFT_WATERMARK_SUBTEXT, DRAFT_WATERMARK_TEXT } from './watermark';

describe('buildWatermark', () => {
  const bgLocale = resolveClassicLocale('bg');
  const enLocale = resolveClassicLocale('en');

  it('stamps a draft with the watermark', () => {
    const html = buildWatermark(true, bgLocale);
    expect(html).toContain('class="watermark"');
    expect(html).toContain(DRAFT_WATERMARK_TEXT);
    expect(html).toContain(DRAFT_WATERMARK_SUBTEXT);
  });

  it('leaves an issued document unmarked', () => {
    expect(buildWatermark(false, bgLocale)).toBe('');
  });

  it('stamps an English draft with the English watermark text', () => {
    const html = buildWatermark(true, enLocale);
    expect(html).toContain('class="watermark"');
    expect(html).toContain('DRAFT');
    expect(html).toContain('NOT LEGALLY VALID');
    expect(html).not.toContain(DRAFT_WATERMARK_TEXT);
  });
});
