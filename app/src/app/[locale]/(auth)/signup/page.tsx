import { SignupForm } from '@app/features/auth/SignupForm';
import { defaultCountryForLocale } from '@app/features/marketing/targetCountries';
import { loadMessages } from '@app/i18n/locale';
import { hreflangAlternates, toLocalePath } from '@app/i18n/localeRedirect';
import type { Locale } from '@shared/types';
import type { Metadata } from 'next';

interface LocaleSignupPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ country?: string }>;
}

export async function generateMetadata({ params }: LocaleSignupPageProps): Promise<Metadata> {
  const { locale } = await params;
  const seo = (await loadMessages(locale as Locale)).seo.signup;
  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: {
      canonical: toLocalePath('/signup', locale as Locale),
      languages: hreflangAlternates('/signup'),
    },
  };
}

export default async function LocaleSignupPage({ params, searchParams }: LocaleSignupPageProps) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  const country = sp.country ?? defaultCountryForLocale(locale as Locale);
  return <SignupForm locale={locale as Locale} initialCountry={country} />;
}
