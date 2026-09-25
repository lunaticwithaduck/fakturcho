import { toLocalePath } from '@app/i18n/localeRedirect';
import type { GuideContent } from './types';

const BASE_URL = 'https://www.fakturcho.com';

export function guidesLlmsSection(heading: string, guides: readonly GuideContent[]): string {
  if (guides.length === 0) return '';
  const lines = guides.map((guide) => {
    const url = `${BASE_URL}${toLocalePath(`/guide/${guide.slug}`, guide.locale)}`;
    return `- [${guide.title}](${url}): ${guide.description}`;
  });
  return `\n## ${heading}\n\n${lines.join('\n')}\n`;
}
