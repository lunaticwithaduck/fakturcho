import { LoginForm } from '@app/features/auth/LoginForm';
import { firstSearchParam } from '@app/features/shared/searchParams';
import { hreflangAlternates } from '@app/i18n/localeRedirect';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Вход',
  description: 'Влезте в акаунта си във Фактурчо, за да издавате и управлявате документи.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/login',
    languages: hreflangAlternates('/login'),
  },
};

interface LoginPageProps {
  searchParams: Promise<{ resetSuccess?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = await searchParams;
  return <LoginForm resetSuccess={firstSearchParam(sp.resetSuccess) === '1'} />;
}
