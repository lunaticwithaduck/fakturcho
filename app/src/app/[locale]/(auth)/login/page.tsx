import { LoginForm } from '@app/features/auth/LoginForm';
import { loadMessages } from '@app/i18n/locale';
import { hreflangAlternates, toLocalePath } from '@app/i18n/localeRedirect';
import type { Locale } from '@shared/types';
import type { Metadata } from 'next';

interface LocaleLoginPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocaleLoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  const seo = (await loadMessages(locale as Locale)).seo.login;
  return {
    title: { absolute: seo.title },
    description: seo.description,
    robots: { index: false, follow: true },
    alternates: {
      canonical: toLocalePath('/login', locale as Locale),
      languages: hreflangAlternates('/login'),
    },
  };
}

export default async function LocaleLoginPage({ params }: LocaleLoginPageProps) {
  const { locale } = await params;
  return <LoginForm locale={locale as Locale} />;
}
