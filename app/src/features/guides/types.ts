import type { Locale } from '@shared/types';

export type GuideCountryCode = 'BG' | 'DE' | 'FR' | 'IT' | 'PL' | 'RO' | 'EU';

export interface InlineRun {
  text: string;
  bold?: boolean;
  href?: string;
}

export type Inline = readonly InlineRun[];

export interface GuideParagraphBlock {
  type: 'p';
  inline: Inline;
}

export interface GuideUlBlock {
  type: 'ul';
  items: readonly Inline[];
}

export interface GuideOlBlock {
  type: 'ol';
  items: readonly Inline[];
}

export interface GuideTableBlock {
  type: 'table';
  head: readonly string[];
  rows: readonly (readonly string[])[];
}

export interface GuideHeadingBlock {
  type: 'h3';
  text: string;
}

export interface GuideTipBlock {
  type: 'tip';
  inline: Inline;
}

export type GuideBlock =
  | GuideParagraphBlock
  | GuideUlBlock
  | GuideOlBlock
  | GuideTableBlock
  | GuideHeadingBlock
  | GuideTipBlock;

export interface GuideSection {
  heading: string;
  id: string;
  blocks: readonly GuideBlock[];
}

export interface GuideFaqEntry {
  question: string;
  answer: Inline;
}

export interface GuideCta {
  heading: string;
  body: Inline;
}

export interface GuideContent {
  country: GuideCountryCode;
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  h1: string;
  answer: string;
  lastReviewed: string;
  sections: readonly GuideSection[];
  faqHeading: string;
  faq: readonly GuideFaqEntry[];
  cta: GuideCta;
}
