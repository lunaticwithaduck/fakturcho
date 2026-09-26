import { LoginForm } from '@app/features/auth/LoginForm';
import { firstSearchParam } from '@app/features/shared/searchParams';
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

interface LocaleLoginPageWithSearchProps extends LocaleLoginPageProps {
  searchParams: Promise<{ resetSuccess?: string | string[] }>;
}

export default async function LocaleLoginPage({
  params,
  searchParams,
}: LocaleLoginPageWithSearchProps) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  return (
    <LoginForm locale={locale as Locale} resetSuccess={firstSearchParam(sp.resetSuccess) === '1'} />
  );
}
