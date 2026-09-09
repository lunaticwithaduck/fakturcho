import type { ClassicLocaleContext } from './locale';

export const DRAFT_WATERMARK_TEXT = 'ЧЕРНОВА';
export const DRAFT_WATERMARK_SUBTEXT = 'БЕЗ ПРАВНА СИЛА';

export function buildWatermark(isDraft: boolean, locale: ClassicLocaleContext): string {
  if (!isDraft) return '';
  const { watermarkMain, watermarkSub } = locale.labels;
  return `<div class="watermark"><div class="watermark-main">${watermarkMain}</div><div class="watermark-sub">${watermarkSub}</div></div>`;
}
