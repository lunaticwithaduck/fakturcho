import type { ClassicLocaleContext } from './locale';

export const DRAFT_WATERMARK_TEXT = 'ЧЕРНОВА';
export const DRAFT_WATERMARK_SUBTEXT = 'БЕЗ ПРАВНА СИЛА';

const SUB_FONT_SIZE_PX = 26;
const SUB_LETTER_SPACING_PX = 6;
// Longest sub-line that renders without reaching the footer (RO, "FĂRĂ
// VALOARE LEGALĂ", 20 characters); scale font-size and letter-spacing down
// together for anything longer, so a long sub-line (e.g. IT's 37-character
// "DOCUMENTO NON VALIDO AI FINI FISCALI") keeps the same rotated footprint
// instead of swinging into the footer above it.
const SUB_REFERENCE_LENGTH = 20;

function watermarkSubStyle(text: string): string {
  if (text.length <= SUB_REFERENCE_LENGTH) return '';
  const scale = SUB_REFERENCE_LENGTH / text.length;
  const fontSize = Math.round(SUB_FONT_SIZE_PX * scale * 10) / 10;
  const letterSpacing = Math.round(SUB_LETTER_SPACING_PX * scale * 10) / 10;
  return ` style="font-size: ${fontSize}px; letter-spacing: ${letterSpacing}px"`;
}

export function buildWatermark(isDraft: boolean, locale: ClassicLocaleContext): string {
  if (!isDraft) return '';
  const { watermarkMain, watermarkSub } = locale.labels;
  return `<div class="watermark"><div class="watermark-main">${watermarkMain}</div><div class="watermark-sub"${watermarkSubStyle(watermarkSub)}>${watermarkSub}</div></div>`;
}
