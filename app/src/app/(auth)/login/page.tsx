import { LoginForm } from '@app/features/auth/LoginForm';
import { hreflangAlternates } from '@app/i18n/localeRedirect';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Вход',
  description: 'Влезте в акаунта си във Фактурчо, за да издавате и управлявате документи.',
  alternates: {
    canonical: '/login',
    languages: hreflangAlternates('/login'),
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
