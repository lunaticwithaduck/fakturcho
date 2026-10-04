import { SignupForm } from '@app/features/auth/SignupForm';
import { SignupHighlights } from '@app/features/auth/SignupHighlights';
import { defaultCountryForLocale } from '@app/features/marketing/targetCountries';
import { firstSearchParam } from '@app/features/shared/searchParams';
import { loadMessages } from '@app/i18n/locale';
import { pageAlternates } from '@app/i18n/pageAlternates';
import type { Locale } from '@shared/types';
import type { Metadata } from 'next';

interface LocaleSignupPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ country?: string | string[] }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: LocaleSignupPageProps): Promise<Metadata> {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  const seo = (await loadMessages(locale as Locale)).seo.signup;
  return {
    title: seo.title,
    description: seo.description,
    alternates: pageAlternates('/signup', locale as Locale, sp),
  };
}

export default async function LocaleSignupPage({ params, searchParams }: LocaleSignupPageProps) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  const country = firstSearchParam(sp.country) ?? defaultCountryForLocale(locale as Locale);
  const { capabilities, faq } = (await loadMessages(locale as Locale)).marketing;
  return (
    <div className="flex flex-col gap-10">
      <SignupForm locale={locale as Locale} initialCountry={country} />
      <SignupHighlights capabilities={capabilities} faq={faq} />
    </div>
  );
}
