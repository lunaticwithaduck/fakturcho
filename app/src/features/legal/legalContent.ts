import bgMessages from '@messages/bg.json';
import deMessages from '@messages/de.json';
import enMessages from '@messages/en.json';
import esMessages from '@messages/es.json';
import frMessages from '@messages/fr.json';
import itMessages from '@messages/it.json';
import plMessages from '@messages/pl.json';
import roMessages from '@messages/ro.json';
import type { Locale } from '@shared/types';
import {
  COMPANY,
  describeEntityForLocale,
  pricingForLocale,
  productNameForLocale,
} from './company';
import { interpolate } from './interpolate';
import type { LegalSection } from './LegalDocument';

type LegalDocId = 'terms' | 'privacy' | 'refunds';

// Legal documents themselves stay English by design (see legal.providedInEnglishNote);
// each locale file already carries the English legal text, only footerLinks
// and providedInEnglishNote are translated, so this just picks the right file.
// Not typed as Record<Locale, typeof enMessages>: bg.json has no "seo" key,
// which is never read here (only .legal is).
const MESSAGES_BY_LOCALE = {
  bg: bgMessages,
  en: enMessages,
  de: deMessages,
  fr: frMessages,
  it: itMessages,
  pl: plMessages,
  ro: roMessages,
  es: esMessages,
};

function messagesFor(locale: Locale) {
  return MESSAGES_BY_LOCALE[locale];
}

function templateVars(locale: Locale) {
  const pricing = pricingForLocale(locale);
  return {
    legalName: locale === 'bg' ? COMPANY.legalName : COMPANY.legalNameLatin,
    entityLine: describeEntityForLocale(locale),
    supportEmail: COMPANY.supportEmail,
    productName: productNameForLocale(locale),
    website: COMPANY.website,
    perDocument: pricing.perDocument,
    packs: pricing.packs,
    subscription: pricing.subscription,
    signupGrant: pricing.signupGrant,
  };
}

export interface LegalDocContent {
  metaTitle: string;
  metaDescription: string;
  title: string;
  intro: string;
  sections: LegalSection[];
  lastUpdatedLabel: string;
}

export function getLegalDoc(doc: LegalDocId, locale: Locale): LegalDocContent {
  const messages = messagesFor(locale).legal[doc];
  const vars = templateVars(locale);
  return {
    metaTitle: messages.metaTitle,
    metaDescription: messages.metaDescription,
    title: messages.title,
    intro: interpolate(messages.intro, vars),
    sections: messages.sections.map((section) => ({
      heading: section.heading,
      paragraphs: section.paragraphs.map((paragraph) => interpolate(paragraph, vars)),
    })),
    lastUpdatedLabel: interpolate(messagesFor(locale).legal.lastUpdatedLabel, {
      date: COMPANY.lastUpdated,
    }),
  };
}

export function getLegalFooterLinks(locale: Locale) {
  return messagesFor(locale).legal.footerLinks;
}
