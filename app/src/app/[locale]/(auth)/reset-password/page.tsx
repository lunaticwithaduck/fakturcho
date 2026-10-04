import { ResetPasswordForm } from '@app/features/auth/ResetPasswordForm';
import { firstSearchParam } from '@app/features/shared/searchParams';
import { loadMessages } from '@app/i18n/locale';
import { hreflangAlternates, toLocalePath } from '@app/i18n/localeRedirect';
import type { Locale } from '@shared/types';
import type { Metadata } from 'next';

interface LocaleResetPasswordPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: LocaleResetPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  const seo = (await loadMessages(locale as Locale)).seo.resetPassword;
  return {
    title: seo.title,
    description: seo.description,
    robots: { index: false, follow: true },
    alternates: {
      canonical: toLocalePath('/reset-password', locale as Locale),
      languages: hreflangAlternates('/reset-password'),
    },
  };
}

interface LocaleResetPasswordPageWithSearchProps extends LocaleResetPasswordPageProps {
  searchParams: Promise<{ token?: string | string[]; error?: string | string[] }>;
}

export default async function LocaleResetPasswordPage({
  params,
  searchParams,
}: LocaleResetPasswordPageWithSearchProps) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  return (
    <ResetPasswordForm
      locale={locale as Locale}
      token={firstSearchParam(sp.token) ?? null}
      invalidToken={firstSearchParam(sp.error) === 'INVALID_TOKEN'}
    />
  );
}
