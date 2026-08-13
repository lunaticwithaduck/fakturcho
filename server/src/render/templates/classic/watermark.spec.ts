import { describe, expect, it } from 'vitest';
import { buildWatermark, DRAFT_WATERMARK_SUBTEXT, DRAFT_WATERMARK_TEXT } from './watermark';

describe('buildWatermark', () => {
  it('stamps a draft with the watermark', () => {
    const html = buildWatermark(true);
    expect(html).toContain('class="watermark"');
    expect(html).toContain(DRAFT_WATERMARK_TEXT);
    expect(html).toContain(DRAFT_WATERMARK_SUBTEXT);
  });

  it('leaves an issued document unmarked', () => {
    expect(buildWatermark(false)).toBe('');
  });
});
