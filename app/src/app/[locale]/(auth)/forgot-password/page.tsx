import { ForgotPasswordForm } from '@app/features/auth/ForgotPasswordForm';
import { loadMessages } from '@app/i18n/locale';
import { hreflangAlternates, toLocalePath } from '@app/i18n/localeRedirect';
import type { Locale } from '@shared/types';
import type { Metadata } from 'next';

interface LocaleForgotPasswordPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: LocaleForgotPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  const seo = (await loadMessages(locale as Locale)).seo.forgotPassword;
  return {
    title: { absolute: seo.title },
    description: seo.description,
    robots: { index: false, follow: true },
    alternates: {
      canonical: toLocalePath('/forgot-password', locale as Locale),
      languages: hreflangAlternates('/forgot-password'),
    },
  };
}

export default async function LocaleForgotPasswordPage({ params }: LocaleForgotPasswordPageProps) {
  const { locale } = await params;
  return <ForgotPasswordForm locale={locale as Locale} />;
}
