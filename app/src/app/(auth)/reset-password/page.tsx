import { ResetPasswordForm } from '@app/features/auth/ResetPasswordForm';
import { firstSearchParam } from '@app/features/shared/searchParams';
import { hreflangAlternates } from '@app/i18n/localeRedirect';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Нова парола',
  description: 'Задайте нова парола за акаунта си във Фактурчо.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/reset-password',
    languages: hreflangAlternates('/reset-password'),
  },
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string | string[]; error?: string | string[] }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const sp = await searchParams;
  return (
    <ResetPasswordForm
      token={firstSearchParam(sp.token) ?? null}
      invalidToken={firstSearchParam(sp.error) === 'INVALID_TOKEN'}
    />
  );
}
