export const DRAFT_WATERMARK_TEXT = 'ЧЕРНОВА';
export const DRAFT_WATERMARK_SUBTEXT = 'БЕЗ ПРАВНА СИЛА';

export function buildWatermark(isDraft: boolean): string {
  if (!isDraft) return '';
  return `<div class="watermark"><div class="watermark-main">${DRAFT_WATERMARK_TEXT}</div><div class="watermark-sub">${DRAFT_WATERMARK_SUBTEXT}</div></div>`;
}
