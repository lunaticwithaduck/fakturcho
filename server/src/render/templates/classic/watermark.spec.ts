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

  it('shrinks the long Italian sub-line so it does not swing into the footer', () => {
    const itLocale = resolveClassicLocale('it');
    const html = buildWatermark(true, itLocale);
    expect(html).toContain('DOCUMENTO NON VALIDO AI FINI FISCALI');
    const match = html.match(/watermark-sub" style="font-size: ([\d.]+)px/);
    expect(match).not.toBeNull();
    expect(Number(match?.[1])).toBeLessThan(26);
  });

  it('leaves a short sub-line (e.g. RO) at the default size', () => {
    const roLocale = resolveClassicLocale('ro');
    const html = buildWatermark(true, roLocale);
    expect(html).toContain('<div class="watermark-sub">FĂRĂ VALOARE LEGALĂ</div>');
  });

  it('shrinks the long Polish main word ("WERSJA ROBOCZA") to the reference footprint', () => {
    const plLocale = resolveClassicLocale('pl');
    const html = buildWatermark(true, plLocale);
    expect(html).toContain('WERSJA ROBOCZA');
    const match = html.match(/watermark-main" style="font-size: ([\d.]+)px/);
    expect(match).not.toBeNull();
    expect(Number(match?.[1])).toBeLessThan(64);
  });

  it('leaves a short main word (e.g. FR "BROUILLON") at the default size', () => {
    const frLocale = resolveClassicLocale('fr');
    const html = buildWatermark(true, frLocale);
    expect(html).toContain('<div class="watermark-main">BROUILLON</div>');
  });
});
