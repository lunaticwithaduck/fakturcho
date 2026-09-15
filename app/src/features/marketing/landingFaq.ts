import type { Locale } from '@shared/types';
import { getMarketingContent } from './content';

export interface LandingFaqItem {
  question: string;
  answer: string;
}

export function getLandingFaq(locale: Locale): LandingFaqItem[] {
  return getMarketingContent(locale).faq.items;
}
