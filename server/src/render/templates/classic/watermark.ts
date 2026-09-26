import type { ClassicLocaleContext } from './locale';

export const DRAFT_WATERMARK_TEXT = 'ЧЕРНОВА';
export const DRAFT_WATERMARK_SUBTEXT = 'БЕЗ ПРАВНА СИЛА';

const MAIN_FONT_SIZE_PX = 64;
const MAIN_LETTER_SPACING_PX = 8;
// Longest main word that keeps the reference rotated footprint (FR,
// "BROUILLON", 9 characters); PL's 14-character "WERSJA ROBOCZA" is the
// outlier and scales down to the same footprint instead of swinging wider
// and taller into the footer below it.
const MAIN_REFERENCE_LENGTH = 9;

const SUB_FONT_SIZE_PX = 22;
const SUB_LETTER_SPACING_PX = 5;
// Longest sub-line that renders without reaching the footer (RO, "FĂRĂ
// VALOARE LEGALĂ", 20 characters); scale font-size and letter-spacing down
// together for anything longer, so a long sub-line (e.g. IT's 37-character
// "DOCUMENTO NON VALIDO AI FINI FISCALI") keeps the same rotated footprint
// instead of swinging into the footer above it.
const SUB_REFERENCE_LENGTH = 20;

function scaledWatermarkStyle(
  text: string,
  referenceLength: number,
  baseFontSize: number,
  baseLetterSpacing: number,
): string {
  if (text.length <= referenceLength) return '';
  const scale = referenceLength / text.length;
  const fontSize = Math.round(baseFontSize * scale * 10) / 10;
  const letterSpacing = Math.round(baseLetterSpacing * scale * 10) / 10;
  return ` style="font-size: ${fontSize}px; letter-spacing: ${letterSpacing}px"`;
}

export function buildWatermark(isDraft: boolean, locale: ClassicLocaleContext): string {
  if (!isDraft) return '';
  const { watermarkMain, watermarkSub } = locale.labels;
  const mainStyle = scaledWatermarkStyle(
    watermarkMain,
    MAIN_REFERENCE_LENGTH,
    MAIN_FONT_SIZE_PX,
    MAIN_LETTER_SPACING_PX,
  );
  const subStyle = scaledWatermarkStyle(
    watermarkSub,
    SUB_REFERENCE_LENGTH,
    SUB_FONT_SIZE_PX,
    SUB_LETTER_SPACING_PX,
  );
  return `<div class="watermark"><div class="watermark-main"${mainStyle}>${watermarkMain}</div><div class="watermark-sub"${subStyle}>${watermarkSub}</div></div>`;
}
