import type { Locale } from '@shared/types';
import type { Metadata } from 'next';
import { hreflangAlternates, toLocalePath } from './localeRedirect';

export function pageAlternates(
  basePath: string,
  locale: Locale,
  searchParams: Record<string, unknown>,
): Metadata['alternates'] {
  const canonical = toLocalePath(basePath, locale);
  if (Object.keys(searchParams).length > 0) return { canonical };
  return { canonical, languages: hreflangAlternates(basePath) };
}
