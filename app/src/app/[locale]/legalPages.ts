import { loadMessages } from '@app/i18n/locale';
import type { Locale } from '@shared/types';

export type LegalDocId = 'privacy' | 'terms' | 'refunds';

// These pages carry the English legal text for every non-bg, non-en locale
// (see prompt: legal pages stay in English) — the URL exists per locale, but
// the content and its canonical both point at the one English original.
const HREFLANG: Record<LegalDocId, Record<string, string>> = {
  privacy: { bg: '/privacy', en: '/en/privacy', 'x-default': '/privacy' },
  terms: { bg: '/terms', en: '/en/terms', 'x-default': '/terms' },
  refunds: { bg: '/refunds', en: '/en/refunds', 'x-default': '/refunds' },
};

export function legalHreflang(doc: LegalDocId): Record<string, string> {
  return HREFLANG[doc];
}

export function legalCanonical(doc: LegalDocId): string {
  const languages = HREFLANG[doc];
  const canonical = languages.en;
  if (!canonical) throw new Error(`no en hreflang for ${doc}`);
  return canonical;
}

export async function providedInEnglishNote(locale: Locale): Promise<string | undefined> {
  if (locale === 'en') return undefined;
  const messages = await loadMessages(locale);
  return messages.legal.providedInEnglishNote as string;
}
