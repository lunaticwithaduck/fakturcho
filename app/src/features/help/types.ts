import type { GuideFaqEntry, GuideSection } from '@app/features/guides/types';
import type { Locale } from '@shared/types';

export interface HelpContent {
  locale: Locale;
  title: string;
  intro: string;
  sections: readonly GuideSection[];
  faqHeading: string;
  faq: readonly GuideFaqEntry[];
}
